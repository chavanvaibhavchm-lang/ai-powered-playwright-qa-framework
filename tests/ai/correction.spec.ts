import { test, expect } from '../../fixtures/test';
import { generateWithCorrection } from '../../ai/correction';
import { OllamaProvider, type ScenarioProvider } from '../../ai/providers';
import {
  normalizeScenarioText,
  repairRedundantRepeatedAssertions,
  reviewScenarioQuality,
  type Suggestions,
  type Requirement,
} from '../../ai/scenarios';
import mock from '../../test-data/mock-suggestions.json';

const requirements: Requirement[] = [
  { id: 'INV-02', description: 'Sort numeric prices using the native dropdown.' },
];
const valid = mock as Suggestions;
const repeated: Suggestions = {
  scenarios: [
    {
      ...valid.scenarios[0]!,
      steps: [
        'Open inventory',
        'Verify sorting control',
        'verify sorting control!!!',
        'Select price ascending',
      ],
    },
  ],
};

test('[AI-04] normalized adjacent repeated assertions are deterministically repaired and audited', async () => {
  const result = await generateWithCorrection(
    {
      generate: async () => JSON.stringify(repeated),
    },
    requirements,
  );
  expect(normalizeScenarioText(' Verify   sorting control!!! ')).toBe(
    normalizeScenarioText('verify sorting control'),
  );
  expect(result.suggestions.scenarios[0]?.steps).toEqual([
    'Open inventory',
    'Verify sorting control',
    'Select price ascending',
  ]);
  expect(result.history.repairAudit).toHaveLength(1);
  expect(result.history.repairAudit[0]).toMatchObject({
    before: repeated.scenarios[0],
    after: result.suggestions.scenarios[0],
  });
  expect(result.quality.issues.some((i) => /Repeated test step/.test(i.message))).toBe(false);
});

test('[AI-04] repeated assertions after an action are preserved as a different application state', async () => {
  const input = {
    scenarios: [
      {
        ...valid.scenarios[0]!,
        steps: [
          'Open inventory',
          'Verify result count',
          'Select price ascending',
          'Verify result count',
        ],
      },
    ],
  };
  const repaired = repairRedundantRepeatedAssertions(input.scenarios[0]!);
  expect(repaired.changes).toHaveLength(0);
  expect(repaired.scenario.steps).toEqual(input.scenarios[0]?.steps);
  expect(
    reviewScenarioQuality(input, requirements).issues.some(
      (i) => i.severity === 'error' && /Repeated test step/.test(i.message),
    ),
  ).toBe(false);
});

test('[AI-04] a distinct assertion between repeats prevents automatic removal', async () => {
  const scenario = {
    ...valid.scenarios[0]!,
    steps: ['Open inventory', 'Verify result count', 'Verify price label', 'Verify result count'],
  };
  expect(repairRedundantRepeatedAssertions(scenario).changes).toHaveLength(0);
  expect(
    reviewScenarioQuality({ scenarios: [scenario] }, requirements).issues.some(
      (i) => i.severity === 'error' && /Repeated test step/.test(i.message),
    ),
  ).toBe(true);
});

test('[AI-04] a repeated assertion separated only by a click still fails the gate', () => {
  const scenario = {
    ...valid.scenarios[0]!,
    steps: [
      'Navigate to the login page',
      'Enter an empty username',
      'Click the login button',
      'Verify the form is not submitted',
      'Click the login button again',
      'Verify the form is not submitted',
    ],
  };
  expect(
    reviewScenarioQuality({ scenarios: [scenario] }, requirements).issues.some(
      (issue) =>
        issue.severity === 'error' &&
        issue.message.includes('Repeated test step without an explicit state change'),
    ),
  ).toBe(true);
});

test('[AI-04] targeted correction is one scenario and can only remove existing steps', async () => {
  let callCount = 0;
  let requestScenarioCount = 0;
  const invalid = {
    scenarios: [
      {
        ...valid.scenarios[0]!,
        steps: [
          'Open inventory',
          'Verify sorting control',
          'Select price ascending',
          'Select price ascending',
        ],
      },
    ],
  };
  const provider: ScenarioProvider = {
    generate: async () => JSON.stringify(invalid),
    correct: async (_reqs, request) => {
      callCount += 1;
      requestScenarioCount = request.suggestions.scenarios.length;
      const target = request.suggestions.scenarios[0]!;
      return JSON.stringify({
        scenarios: [
          {
            ...target,
            steps: target.steps.filter((step) => step !== 'Select price ascending'),
          },
        ],
      });
    },
  };
  const result = await generateWithCorrection(provider, requirements);
  expect(requestScenarioCount).toBe(1);
  expect(callCount).toBe(1);
  expect(result.history.attempts).toHaveLength(1);
  expect(result.history.attempts[0]?.scenarioId).toBe(valid.scenarios[0]?.id);
  expect(result.history.repairAudit).toHaveLength(1);
  expect(result.suggestions.scenarios[0]?.expectedResult).toBe(valid.scenarios[0]?.expectedResult);
});

test('[AI-04] correction cannot change expected result, title, or requirement mapping', async () => {
  const invalid = {
    scenarios: [
      {
        ...valid.scenarios[0]!,
        steps: ['Open inventory', 'Select price ascending', 'Select price ascending'],
      },
    ],
  };
  const result = await generateWithCorrection(
    {
      generate: async () => JSON.stringify(invalid),
      correct: async (_reqs, request) =>
        JSON.stringify({
          scenarios: [
            {
              ...request.suggestions.scenarios[0]!,
              expectedResult: 'A different business expectation is met.',
            },
          ],
        }),
    },
    requirements,
  );
  expect(result.history.attempts[0]?.failure).toContain('may only remove existing steps');
  expect(result.suggestions.scenarios[0]?.expectedResult).toBe(
    invalid.scenarios[0]?.expectedResult,
  );
});

test('[AI-04] only one correction retry is made per invalid scenario', async () => {
  let calls = 0;
  const invalid = {
    scenarios: [
      {
        ...valid.scenarios[0]!,
        steps: ['Open inventory', 'Select price ascending', 'Select price ascending'],
      },
    ],
  };
  const result = await generateWithCorrection(
    {
      generate: async () => JSON.stringify(invalid),
      correct: async (_reqs, request) => {
        calls += 1;
        return JSON.stringify(request.suggestions);
      },
    },
    requirements,
  );
  expect(calls).toBe(1);
  expect(result.history.attempts).toHaveLength(1);
  expect(result.suggestions.scenarios).toHaveLength(1);
});

test('[AI-04] invalid initial JSON is rejected and Ollama correction stays local', async () => {
  await expect(
    generateWithCorrection({ generate: async () => '{bad' }, requirements),
  ).rejects.toThrow('malformed JSON');
  const transport: typeof fetch = async (_url, options) => {
    const payload = JSON.parse(String(options?.body)) as { prompt: string; model: string };
    expect(payload.model).toBe('qwen2.5:1.5b');
    expect(payload.prompt).toContain('Preserve every scenario ID');
    return new Response(
      JSON.stringify({ response: JSON.stringify({ scenarios: [valid.scenarios[0]] }) }),
    );
  };
  const ollama = new OllamaProvider('qwen2.5:1.5b', undefined, transport);
  expect(
    await ollama.correct!(requirements, {
      suggestions: { scenarios: [valid.scenarios[0]!] },
      issues: [
        { scenarioId: valid.scenarios[0]!.id, severity: 'error', message: 'Repeated test step' },
      ],
    }),
  ).toContain('"scenarios"');
});
