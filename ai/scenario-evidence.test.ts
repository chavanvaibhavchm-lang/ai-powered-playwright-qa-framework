import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applicationConfig, type Inspection } from './application';
import { generateCandidates } from './automation-code';
import {
  scenarioReadiness,
  requirementTarget,
  requirementCoverage,
  inspectionSummary,
  verifiedElements,
} from './scenario-evidence';
import { reviewScenarioQuality, type Scenario } from './scenarios';
import { normalizeLocator } from './pom-discovery';
const config = applicationConfig({ name: 'Test', url: 'https://example.com/' });
const inspection: Inspection = {
  url: config.url,
  title: 'Login',
  inspectedAt: '2026-10-08T00:00:00Z',
  truncated: false,
  elements: [
    {
      id: 'UI-1',
      tag: 'button',
      role: 'button',
      name: 'Login',
      label: '',
      placeholder: '',
      testId: '',
      href: '',
      form: '',
      count: 1,
      visible: true,
      locator: 'page.getByRole("button", {name:"Login",exact:true})',
      verifiedLocators: ['page.getByRole("button", {name:"Login",exact:true})'],
      pageUrl: config.url,
    },
  ],
};
const scenario: Scenario = {
  id: 'S-001',
  requirementIds: ['PRD-01'],
  title: 'Login visibility',
  steps: ['Open application', 'Verify Login button'],
  expectedResult: 'Login button is visible.',
  priority: 'normal',
};
const requirements = [{ id: 'PRD-01', description: 'Login button is visible.' }];
test('inspection diagnostics report actual single-page evidence, not approved-but-uninspected pages', () => {
  const summary = inspectionSummary(inspection, []);
  assert.equal(summary.verifiedLocators, 1);
  assert.equal(summary.inspectedPages.length, 1);
  assert.equal(summary.url, config.url);
  assert.equal(
    verifiedElements({
      ...inspection,
      elements: [{ ...inspection.elements[0]!, pageUrl: 'https://example.com/cart' }],
    }).length,
    0,
  );
});
test('framework requirements are separate and uncovered application requirements are reported', () => {
  const rows = [
    ...requirements,
    { id: 'PRD-02', description: 'Products can be sorted.' },
    {
      id: 'PRD-03',
      description:
        'Execute approved tests only on explicit request; publish Allure artifacts and requirement-to-result traceability.',
    },
  ];
  assert.equal(requirementTarget(rows[2]!), 'framework');
  assert.equal(requirementTarget({ ...rows[2]!, target: 'application' }), 'application');
  const coverage = requirementCoverage(rows, [scenario]);
  assert.deepEqual(coverage.uncoveredRequirementIds, ['PRD-02']);
  assert.deepEqual(coverage.frameworkRequirementIds, ['PRD-03']);
  assert.equal(
    scenarioReadiness({ ...scenario, requirementIds: ['PRD-03'] }, rows, inspection, config).status,
    'framework',
  );
});
test('invented controls, unsupported sort criteria and credential transitions are flagged', () => {
  const invented = {
    ...scenario,
    steps: ["Click 'Browse Inventory'", 'Enter valid credentials'],
    expectedResult: 'Products are sorted by popularity.',
  };
  const result = scenarioReadiness(
    invented,
    [{ id: 'PRD-01', description: 'Browse inventory and sort products.' }],
    inspection,
    config,
  );
  assert.equal(result.status, 'needs-inspection');
  assert.ok(result.issues.some((i) => i.code === 'unverified-control'));
  assert.ok(result.issues.some((i) => i.code === 'unsupported-detail'));
  assert.ok(result.issues.some((i) => i.code === 'authentication'));
  assert.equal(
    reviewScenarioQuality({ scenarios: [invented] }, [
      { id: 'PRD-01', description: 'Browse inventory and sort products.' },
    ]).passed,
    false,
  );
});
test('approved navigation scope is not proof of inspected destination evidence', () => {
  const next = { ...scenario, steps: ['Navigate to https://example.com/cart'] };
  const result = scenarioReadiness(next, requirements, inspection, {
    ...config,
    approvedPages: ['https://example.com/cart'],
  });
  assert.ok(result.issues.some((i) => i.code === 'further-inspection'));
});
test('login and generic application destinations resolve to the inspected starting page', () => {
  const loginPage: Inspection = {
    ...inspection,
    title: 'Swag Labs',
    elements: [
      {
        ...inspection.elements[0]!,
        id: 'UI-1',
        tag: 'input',
        role: 'textbox',
        name: 'Username',
        placeholder: 'Username',
      },
      {
        ...inspection.elements[0]!,
        id: 'UI-2',
        tag: 'input',
        inputType: 'password',
        role: '',
        name: 'Password',
        placeholder: 'Password',
      },
      {
        ...inspection.elements[0]!,
        id: 'UI-3',
        name: 'Login',
        inputType: 'submit',
      },
    ],
  };
  const loginScenario = { ...scenario, steps: ['Navigate to the login page.'] };
  const genericScenario = { ...scenario, steps: ['Navigate to application.'] };
  for (const current of [loginScenario, genericScenario]) {
    const result = scenarioReadiness(current, requirements, loginPage, config);
    assert.ok(
      !result.issues.some((issue) => /Destination .*not established/.test(issue.message)),
      JSON.stringify(result.issues),
    );
  }
  const differentPage = scenarioReadiness(
    { ...scenario, steps: ['Navigate to the cart page.'] },
    requirements,
    loginPage,
    config,
  );
  assert.ok(differentPage.issues.some((issue) => /Destination "cart"/.test(issue.message)));
});
test('known insufficient evidence avoids AI calls and retains supplied inventory diagnostics', async () => {
  let calls = 0;
  const rows = await generateCandidates(
    [{ ...scenario, steps: ["Click 'Invented Button'"] }],
    config,
    inspection,
    [],
    {
      extractRequirements: async () => {
        calls++;
        throw Error('must not call');
      },
    },
    process.cwd(),
    'fixture',
    requirements,
  );
  assert.equal(calls, 0);
  assert.equal(rows[0]!.status, 'blocked');
  assert.equal(rows[0]!.evidenceInventory?.suppliedLocators.length, 1);
  assert.equal(rows[0]!.references.locators.length, 0);
  assert.match(rows[0]!.reason, /Next:/);
});
test('small inspected inventory is preserved and supported visibility scenarios still generate code', async () => {
  let prompt = '';
  const rows = await generateCandidates(
    [scenario],
    config,
    inspection,
    [],
    {
      extractRequirements: async (p) => {
        prompt = p;
        return JSON.stringify({
          scenarioId: 'S-001',
          status: 'ready',
          reason: '',
          actions: [{ kind: 'assertVisible', target: 'UI-1', value: '', args: [] }],
        });
      },
    },
    process.cwd(),
    'fixture',
    requirements,
  );
  assert.match(prompt, /UI-1/);
  assert.equal(rows[0]!.status, 'pending', rows[0]!.reason);
  assert.equal(rows[0]!.references.locators.length, 1);
});
test('POM locator canonicalization handles escaped CSS quotes and preserves string whitespace', () => {
  assert.equal(
    normalizeLocator('page.locator(\'[data-test="username"]\')'),
    normalizeLocator(String.raw`page.locator("[data-test=\"username\"]")`),
  );
  assert.notEqual(
    normalizeLocator("page.getByText('Save item')"),
    normalizeLocator("page.getByText('Saveitem')"),
  );
});

test('current-page control visibility does not claim inspection of a same-named destination', () => {
  const inventory = {
    ...inspection,
    elements: [
      {
        ...inspection.elements[0]!,
        name: 'Cart',
        locator: 'page.getByRole("button", {name:"Cart",exact:true})',
      },
    ],
  };
  const current = {
    ...scenario,
    title: 'Cart button visibility',
    steps: ['Open application', 'Verify Cart button'],
    expectedResult: 'Cart button is visible.',
  };
  assert.equal(
    scenarioReadiness(
      current,
      [{ id: 'PRD-01', description: 'Cart button is visible.' }],
      inventory,
      config,
    ).status,
    'ready',
  );
  assert.equal(inspectionSummary(inventory, []).inspectedPages[0]!.url, config.url);
});

test('quoted input values are not controls; absent inspection is pending evidence, not proof of invention', () => {
  const s = {
    ...scenario,
    steps: ['Open application', "Enter 'invalid credentials'", "Click 'Login'"],
    expectedResult: 'Login rejects the submitted credentials.',
  };
  const req = [{ id: 'PRD-01', description: 'Login rejects the submitted credentials.' }];
  const pending = reviewScenarioQuality({ scenarios: [s] }, req);
  assert.equal(pending.passed, true);
  assert.ok(!pending.issues.some((i) => i.message.includes('control named "invalid credentials"')));
  assert.equal(scenarioReadiness(s, req).status, 'needs-inspection');
  assert.equal(
    reviewScenarioQuality({ scenarios: [{ ...s, steps: ["Click 'Invented'"] }] }, req, inspection)
      .passed,
    false,
  );
});
test('invented modals and disabled outcomes still fail before inspection', () => {
  const s = {
    ...scenario,
    steps: ['Open application', 'Wait for login modal to appear'],
    expectedResult: 'The Login button is disabled.',
  };
  assert.equal(reviewScenarioQuality({ scenarios: [s] }, requirements).passed, false);
});
