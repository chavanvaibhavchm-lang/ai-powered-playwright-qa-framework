import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeScenarioBatches } from './scenario-batches';
import { reviewScenarioQuality, type Scenario } from './scenarios';
import { generateWithCorrection } from './correction';

const scenario: Scenario = {
  id: 'S-001',
  requirementIds: ['PRD-01'],
  title: 'Checkout required fields',
  steps: ['Open checkout', 'Enter first name', 'Verify last name field'],
  expectedResult: 'The last name field is visible and enabled.',
  priority: 'normal',
};
const requirements = [
  { id: 'PRD-01', description: 'Checkout requires first name, last name and postal code.' },
];

test('exact duplicate removal preserves a verbatim copy, coverage and an audit record', () => {
  const original = { scenarios: [scenario, { ...scenario, id: 'S-003' }] };
  const result = mergeScenarioBatches([original]);
  assert.deepEqual(result.suggestions.scenarios, [scenario]);
  assert.deepEqual(result.duplicates, [
    { batch: 1, removed: original.scenarios[1], retainedId: 'S-001' },
  ]);
  assert.equal(reviewScenarioQuality(original, requirements).passed, false);
  assert.equal(reviewScenarioQuality(result.suggestions, requirements).passed, true);
  result.suggestions.scenarios[0]!.steps[0] = 'changed';
  assert.equal(original.scenarios[0]!.steps[0], 'Open checkout');
});

test('server renumbering does not mutate correction history or reuse local scenario IDs', async () => {
  const response = JSON.stringify({ scenarios: [scenario, { ...scenario, id: 'S-003' }] });
  const result = await generateWithCorrection(
    { generate: async () => response, correct: async () => response },
    requirements,
  );
  assert.equal(result.history.attempts.length, 2);
  const before = structuredClone(result.history);
  const merged = mergeScenarioBatches([
    {
      scenarios: [
        {
          ...scenario,
          title: 'Different objective',
          steps: ['Open application', 'Verify postal code field'],
          expectedResult: 'The postal code field is visible.',
        },
      ],
    },
    result.suggestions,
  ]);
  assert.deepEqual(
    merged.suggestions.scenarios.map((s) => s.id),
    ['S-001', 'S-002'],
  );
  assert.equal(merged.changes[0]?.before.id, 'S-001');
  assert.equal(merged.changes[0]?.after.id, 'S-002');
  assert.deepEqual(result.history, before);
  assert.equal(merged.duplicates[0]?.retainedId, 'S-002');
});

test('same title with distinct validation actions is retained', () => {
  const other = {
    ...scenario,
    id: 'S-002',
    steps: ['Open checkout', 'Leave first name empty', 'Submit checkout'],
    expectedResult: 'Checkout does not proceed while first name is empty.',
  };
  assert.equal(
    mergeScenarioBatches([{ scenarios: [scenario, other] }]).suggestions.scenarios.length,
    2,
  );
});

test('normalized-equivalent scenario text is deduplicated only with the same requirement mapping', () => {
  const formatted = {
    ...scenario,
    id: 'S-002',
    title: '  CHECKOUT REQUIRED FIELDS!!! ',
    steps: ['Open checkout.', 'Enter first name!', 'Verify last name field'],
    expectedResult: 'The last name field is visible and enabled!',
    priority: 'critical' as const,
  };
  const result = mergeScenarioBatches([{ scenarios: [scenario, formatted] }], false);
  assert.equal(result.suggestions.scenarios.length, 1);
  assert.equal(result.suggestions.scenarios[0]?.priority, 'critical');
  assert.equal(result.duplicates.length, 1);
  assert.deepEqual(result.duplicates[0]?.before, scenario);
  assert.equal(result.duplicates[0]?.after?.priority, 'critical');

  const otherRequirement = { ...formatted, id: 'S-003', requirementIds: ['PRD-02'] };
  const distinct = mergeScenarioBatches([{ scenarios: [scenario, otherRequirement] }], false);
  assert.equal(distinct.duplicates.length, 0);
  assert.equal(distinct.suggestions.scenarios.length, 2);
});

test('different requirement coverage is preserved and does not create a duplicate-content failure', () => {
  const result = mergeScenarioBatches([
    { scenarios: [scenario, { ...scenario, id: 'S-002', requirementIds: ['PRD-02'] }] },
  ]);
  assert.equal(result.duplicates.length, 0);
  assert.equal(result.suggestions.scenarios.length, 2);
  assert.equal(reviewScenarioQuality(result.suggestions).passed, true);
});

test('removing copies does not hide unsupported details or grant approval', () => {
  const invalid = {
    ...scenario,
    steps: ['Open checkout', 'Select popularity sorting'],
    expectedResult: 'Products are sorted by popularity.',
  };
  const result = mergeScenarioBatches([{ scenarios: [invalid, { ...invalid, id: 'S-002' }] }]);
  const quality = reviewScenarioQuality(result.suggestions, requirements);
  assert.equal(quality.passed, false);
  assert.ok(quality.issues.some((i) => i.severity === 'error' && /Unsupported/.test(i.message)));
  assert.equal('status' in result.suggestions.scenarios[0]!, false);
});

test('saved-draft recovery keeps surviving IDs and preserves scenarios with distinct titles', () => {
  const result = mergeScenarioBatches(
    [
      {
        scenarios: [
          { ...scenario, id: 'S-007' },
          { ...scenario, id: 'S-009' },
          { ...scenario, id: 'S-012', title: 'Different title' },
        ],
      },
    ],
    false,
  );
  assert.deepEqual(
    result.suggestions.scenarios.map((s) => s.id),
    ['S-007', 'S-012'],
  );
  assert.equal(result.duplicates[0]?.removed.id, 'S-009');
  assert.equal(reviewScenarioQuality(result.suggestions).passed, true);
});
