import { test, expect } from '../../fixtures/test';
import {
  parseSuggestions,
  approvedSuggestions,
  reviewScenarioQuality,
  type Requirement,
  type Scenario,
  type Suggestions,
} from '../../ai/scenarios';
import { MockProvider, OllamaProvider, suggest } from '../../ai/providers';
import mock from '../../test-data/mock-suggestions.json';

const requirements: Requirement[] = [
  { id: 'INV-02', description: 'Sort numeric prices using the native dropdown.' },
];
const raw = JSON.stringify(mock);

test('[AI-01] deterministic provider produces schema-validated traceable suggestions', async () => {
  expect(await suggest(new MockProvider(raw), requirements)).toEqual(mock);
});
test('[AI-02] malformed JSON and markdown code fences are rejected', async () => {
  expect(() => parseSuggestions('{bad', requirements)).toThrow('malformed JSON');
  expect(() => parseSuggestions('```json\n' + raw + '\n```', requirements)).toThrow(
    'malformed JSON',
  );
});
for (const invalid of [
  { name: 'missing scenarios', value: {} },
  { name: 'empty scenarios', value: { scenarios: [] } },
  {
    name: 'invalid priority',
    value: { scenarios: [{ ...mock.scenarios[0], priority: 'urgent' }] },
  },
  { name: 'unexpected generated code', value: { ...mock, code: 'execute()' } },
  { name: 'empty steps', value: { scenarios: [{ ...mock.scenarios[0], steps: [] }] } },
  { name: 'whitespace title', value: { scenarios: [{ ...mock.scenarios[0], title: '     ' }] } },
]) {
  test(`[AI-02] rejects ${invalid.name}`, async () => {
    expect(() => parseSuggestions(JSON.stringify(invalid.value), requirements)).toThrow(
      'Invalid scenario schema',
    );
  });
}
test('[AI-02] missing, malformed and duplicate requirements fail before calling provider', async () => {
  const provider = new MockProvider(raw);
  await expect(suggest(provider, [])).rejects.toThrow('Requirements are missing');
  await expect(suggest(provider, [{ id: 'invented', description: '' }])).rejects.toThrow(
    'Invalid requirement',
  );
  await expect(suggest(provider, [...requirements, ...requirements])).rejects.toThrow(
    'Duplicate requirement',
  );
});
test('[AI-02] unknown requirements and duplicate scenario IDs are rejected', async () => {
  expect(() =>
    parseSuggestions(
      JSON.stringify({ scenarios: [{ ...mock.scenarios[0], requirementIds: ['FAKE-01'] }] }),
      requirements,
    ),
  ).toThrow('Unknown requirement');
  expect(() =>
    parseSuggestions(
      JSON.stringify({ scenarios: [...mock.scenarios, ...mock.scenarios] }),
      requirements,
    ),
  ).toThrow('Duplicate scenario ID');
});
test('[AI-02] parsing preserves title-equivalent proposals for the quality review and audit', async () => {
  const suggestions = parseSuggestions(
    JSON.stringify({
      scenarios: [
        ...mock.scenarios,
        { ...mock.scenarios[0], id: 'S-002', title: '  VERIFY NUMERIC ASCENDING PRICE ORDER  ' },
      ],
    }),
    requirements,
  );
  expect(suggestions.scenarios).toHaveLength(mock.scenarios.length + 1);
});
test('[AI-04] duplicate scenarios use normalized content and preserve different requirement mappings', async () => {
  const base = mock.scenarios[0] as Scenario;
  const sameMapping = {
    scenarios: [
      base,
      {
        ...base,
        id: 'S-002',
        title: '  VERIFY NUMERIC ASCENDING PRICE ORDER!!! ',
      },
    ],
  };
  const quality = reviewScenarioQuality(sameMapping, requirements);
  expect(
    quality.issues
      .filter((issue) => issue.message === 'Duplicate scenario content')
      .map((i) => i.scenarioId),
  ).toEqual(expect.arrayContaining(['S-001', 'S-002']));
  const differentMapping = reviewScenarioQuality(
    {
      scenarios: [base, { ...base, id: 'S-002', requirementIds: ['INV-03'] }],
    },
    [...requirements, { id: 'INV-03', description: 'Same behavior under another requirement.' }],
  );
  expect(differentMapping.issues.some((i) => i.message === 'Duplicate scenario content')).toBe(
    false,
  );
});
test('[AI-03] approved suggestions require reviewer and explicit valid selection', async () => {
  const suggestions = parseSuggestions(raw, requirements);
  expect(() => approvedSuggestions(suggestions, { reviewer: '', scenarioIds: ['S-001'] })).toThrow(
    'Human reviewer',
  );
  expect(() => approvedSuggestions(suggestions, { reviewer: 'Reviewer', scenarioIds: [] })).toThrow(
    'Explicit approval',
  );
  expect(() =>
    approvedSuggestions(suggestions, { reviewer: 'Reviewer', scenarioIds: ['S-999'] }),
  ).toThrow('unknown scenario');
  expect(
    approvedSuggestions(suggestions, { reviewer: 'Reviewer', scenarioIds: ['S-001'] }),
  ).toEqual(mock);
});
test('[AI-04] partial approval allows valid scenarios and blocks only needs-fix scenarios', async () => {
  const suggestions: Suggestions = {
    scenarios: [
      mock.scenarios[0] as Scenario,
      {
        ...(mock.scenarios[0] as Scenario),
        id: 'S-002',
        title: 'Invalid scenario with an issue',
      },
    ],
  };
  const quality = {
    passed: false,
    issues: [{ scenarioId: 'S-002', severity: 'error' as const, message: 'Repeated test step' }],
  };
  expect(
    approvedSuggestions(
      suggestions,
      { reviewer: 'Reviewer', scenarioIds: ['S-001'] },
      quality,
    ).scenarios.map((s) => s.id),
  ).toEqual(['S-001']);
  expect(() =>
    approvedSuggestions(suggestions, { reviewer: 'Reviewer', scenarioIds: ['S-002'] }, quality),
  ).toThrow('failed the quality gate');
});
test('[AI-01] local adapter sends schema and parses mocked Ollama response', async () => {
  const calls: { url: string; payload: unknown }[] = [];
  const transport: typeof fetch = async (url, options) => {
    calls.push({ url: String(url), payload: JSON.parse(String(options?.body)) as unknown });
    return new Response(JSON.stringify({ response: raw }), { status: 200 });
  };
  expect(
    await suggest(new OllamaProvider('mock-local-model', undefined, transport), requirements),
  ).toEqual(mock);
  expect(calls).toHaveLength(1);
  expect(calls[0]?.url).toBe('http://127.0.0.1:11434/api/generate');
  expect(calls[0]?.payload).toMatchObject({
    model: 'mock-local-model',
    stream: false,
    format: { type: 'object' },
  });
});
test('[AI-02] adapter rejects HTTP failures, missing response text and nonlocal endpoints', async () => {
  await expect(
    new OllamaProvider(
      'mock',
      undefined,
      async () => new Response('offline', { status: 503 }),
    ).generate(requirements),
  ).rejects.toThrow('HTTP 503');
  await expect(
    new OllamaProvider('mock', undefined, async () => new Response('{}')).generate(requirements),
  ).rejects.toThrow('response text is missing');
  expect(() => new OllamaProvider('mock', 'https://paid.example.com')).toThrow('loopback');
  expect(() => new OllamaProvider('')).toThrow('OLLAMA_MODEL');
});
test('[AI-02] excessive output is rejected before JSON parsing', async () => {
  expect(() => parseSuggestions('x'.repeat(100001), requirements)).toThrow('too large');
});
