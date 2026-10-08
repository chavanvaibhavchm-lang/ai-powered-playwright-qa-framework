import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateCandidates, parsePlan, validateCode } from './automation-code';
import { applicationConfig, type Inspection } from './application';
import type { Scenario } from './scenarios';
const scenario: Scenario = {
  id: 'S-001',
  requirementIds: ['PRD-01'],
  title: 'Save button visibility',
  steps: ['Open application', 'Verify Save button'],
  expectedResult: 'Save button is visible on the current page.',
  priority: 'normal',
};
const inventory: Inspection = {
  url: 'https://example.com/',
  title: 'Sample',
  inspectedAt: 'now',
  truncated: false,
  elements: [
    {
      id: 'UI-1',
      tag: 'button',
      name: 'Save',
      role: 'button',
      label: '',
      placeholder: '',
      testId: 'save',
      form: '',
      href: '',
      count: 1,
      visible: true,
      locator: 'page.getByRole("button", { name: "Save", exact: true })',
      verifiedLocators: [],
    },
  ],
};
const plan = {
  scenarioId: 'S-001',
  status: 'ready',
  reason: '',
  actions: [{ kind: 'assertVisible', target: 'UI-1', value: '', args: [] }],
};
test('mocked local generation produces independently reviewable code and provenance', async () => {
  const rows = await generateCandidates(
    [scenario],
    applicationConfig({ name: 'Sample', url: inventory.url }),
    inventory,
    [],
    { extractRequirements: async () => JSON.stringify(plan) },
    process.cwd(),
    'project',
  );
  assert.equal(rows[0]?.status, 'pending');
  assert.match(rows[0]!.code, /PRD-01/);
  assert.match(rows[0]!.code, /toBeVisible/);
  assert.match(rows[0]!.diff, /\/dev\/null/);
});
test('schema, locator uniqueness, assertion evidence and code tampering are rejected', () => {
  assert.throws(
    () =>
      parsePlan(
        JSON.stringify({ ...plan, code: 'require("child_process")' }),
        scenario,
        inventory,
        [],
      ),
    /schema/,
  );
  assert.throws(
    () => parsePlan(JSON.stringify({ ...plan, scenarioId: 'S-002' }), scenario, inventory, []),
    /provenance/,
  );
  assert.throws(
    () => parsePlan(JSON.stringify(plan), scenario, { ...inventory, elements: [] }, []),
    /locator/,
  );
  assert.throws(
    () =>
      parsePlan(
        JSON.stringify(plan),
        scenario,
        { ...inventory, elements: [{ ...inventory.elements[0]!, count: 2 }] },
        [],
      ),
    /locator/,
  );
  assert.throws(
    () =>
      parsePlan(
        JSON.stringify(plan),
        { ...scenario, expectedResult: 'Login succeeds' },
        inventory,
        [],
      ),
    /outcome/,
  );
  assert.throws(() => validateCode('fetch("https://evil")', 'expected'), /validated plan/);
  assert.throws(() => validateCode('const x = ;', 'const x = ;'), /syntax/);
});
test('blocked scenarios preserve missing information and cannot contain actions', async () => {
  const blocked = {
    scenarioId: 'S-001',
    status: 'blocked',
    reason: 'The destination page has not been inspected.',
    actions: [],
  };
  assert.equal(parsePlan(JSON.stringify(blocked), scenario, inventory, []).status, 'blocked');
  assert.throws(
    () => parsePlan(JSON.stringify({ ...blocked, actions: plan.actions }), scenario, inventory, []),
    /no actions/,
  );
  const rows = await generateCandidates(
    [scenario],
    applicationConfig({ name: 'Sample', url: inventory.url }),
    inventory,
    [],
    { extractRequirements: async () => '{invalid' },
    process.cwd(),
    'project',
  );
  assert.equal(rows[0]?.status, 'blocked');
  assert.equal(rows[0]?.code, '');
});
