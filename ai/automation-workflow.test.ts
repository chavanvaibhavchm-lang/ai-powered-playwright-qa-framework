import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import {
  AutomationWorkflow,
  emptyAutomation,
  traceability,
  classifyFailure,
} from './automation-workflow';
import { reviewScenarioQuality, type Scenario } from './scenarios';
const scenario: Scenario = {
  id: 'S-001',
  requirementIds: ['PRD-01'],
  title: 'Save button visibility',
  steps: ['Open application', 'Verify Save button'],
  expectedResult: 'Save button is visible on the current page.',
  priority: 'normal',
};
const requirements = [
  {
    id: 'PRD-01',
    description: scenario.expectedResult,
    sourceReference: 'fixture',
    evidence: scenario.expectedResult,
    ambiguityWarning: '',
    status: 'approved' as const,
  },
];
const provider = {
  extractRequirements: async () =>
    JSON.stringify({
      scenarioId: 'S-001',
      status: 'ready',
      reason: '',
      actions: [{ kind: 'assertVisible', target: 'UI-1', value: '', args: [] }],
    }),
};
test('full local workflow enforces approvals, runs only selected tests and records evidence', async () => {
  const server = createServer((_req, res) =>
    res.end('<title>Fixture</title><button>Save</button>'),
  );
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const addr = server.address();
  assert.ok(addr && typeof addr !== 'string');
  const id = randomUUID();
  const state = emptyAutomation();
  const workflow = new AutomationWorkflow(process.cwd(), id, state, provider);
  try {
    await workflow.configure({
      name: 'Local fixture',
      url: 'http://127.0.0.1:' + addr.port,
      allowLocal: true,
    });
    await workflow.inspect();
    state.scenarios = [{ ...scenario, status: 'pending' }];
    state.quality = { passed: true, issues: [] };
    await assert.rejects(workflow.generate(requirements), /Approve scenarios/);
    await workflow.reviewScenarios([{ id: scenario.id, status: 'approved' }]);
    const rows = await workflow.generate(requirements);
    assert.equal(rows[0]?.status, 'pending');
    assert.throws(() => workflow.selectApproved(['S-001']), /explicit code approval/);
    await assert.rejects(workflow.reviewCode('S-001', 'approved', ''), /reviewer/);
    await workflow.reviewCode('S-001', 'approved', 'Fixture reviewer');
    assert.throws(() => workflow.selectApproved(['S-001', 'S-001']), /unique/);
    assert.throws(() => workflow.selectApproved(['S-999']), /approval/);
    const approved = join(workflow.directory, 'approved', 'S-001.spec.ts');
    await writeFile(approved, 'require("child_process").execSync("echo bad")');
    await assert.rejects(workflow.run(['S-001']), /file changed/);
    await writeFile(approved, state.candidates[0]!.code);
    const result = await workflow.run(['S-001']);
    assert.equal(result.results[0]?.status, 'passed', JSON.stringify(result));
    assert.equal(
      result.allureGenerated,
      true,
      await readFile(join(workflow.directory, 'runs', result.runId, 'allure.log'), 'utf8'),
    );
    const coverage = traceability(state, requirements);
    assert.equal(coverage.coverage.passed, 1);
    assert.equal(coverage.coverage.approvedRequirements, 1);
    assert.deepEqual(coverage.requirements[0]?.scenarioIds, ['S-001']);
    assert.match(
      await readFile(join(workflow.directory, 'runs', result.runId, 'summary.json'), 'utf8'),
      /PRD-01/,
    );
    await workflow.reviewCode('S-001', 'rejected', 'Fixture reviewer');
    assert.throws(() => workflow.selectApproved(['S-001']), /approval/);
    await workflow.configure({
      name: 'Changed',
      url: 'http://127.0.0.1:' + addr.port,
      allowLocal: true,
    });
    assert.equal(state.candidates.length, 0);
    assert.equal(state.inspection, undefined);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    await rm(workflow.directory, { recursive: true, force: true });
  }
});
test('quality-gate enforcement and evidence-based failure classification', async () => {
  const state = emptyAutomation();
  state.scenarios = [{ ...scenario, status: 'pending' }];
  state.quality = {
    passed: false,
    issues: [{ scenarioId: 'S-001', severity: 'error', message: 'Bad steps' }],
  };
  const workflow = new AutomationWorkflow(process.cwd(), randomUUID(), state, provider);
  await assert.rejects(
    workflow.reviewScenarios([{ id: 'S-001', status: 'approved' }]),
    /quality gate/,
  );
  assert.equal(classifyFailure('strict mode violation', 'failed'), 'locator');
  assert.equal(classifyFailure('expect(locator).toHaveText', 'failed'), 'assertion');
  assert.equal(classifyFailure('Test timeout of 30000ms exceeded', 'failed'), 'timeout');
  assert.equal(classifyFailure('net::ERR_CONNECTION_REFUSED', 'blocked'), 'environment');
  assert.equal(classifyFailure('unexplained', 'failed'), 'unknown');
});

test('partial scenario approval preserves valid approval and marks only the invalid draft needs-fix', async () => {
  const id = randomUUID();
  const valid = { ...scenario, status: 'pending' as const };
  const invalid = {
    ...scenario,
    id: 'S-002',
    title: 'Repeated action is not qualified',
    steps: ['Open application', 'Click Save', 'Click Save'],
    status: 'pending' as const,
  };
  const state = emptyAutomation();
  state.scenarios = [valid, invalid];
  state.quality = reviewScenarioQuality({ scenarios: [valid, invalid] }, requirements);
  const workflow = new AutomationWorkflow(process.cwd(), id, state, provider);
  try {
    await workflow.reviewScenarios([
      { id: 'S-001', status: 'approved' },
      { id: 'S-002', status: 'needs-fix' },
    ]);
    assert.equal(state.scenarios[0]?.status, 'approved');
    assert.equal(state.scenarios[1]?.status, 'needs-fix');
    await assert.rejects(
      workflow.reviewScenarios([
        { id: 'S-001', status: 'approved' },
        { id: 'S-002', status: 'approved' },
      ]),
      /quality gate/,
    );
    assert.equal(state.scenarios[0]?.status, 'approved');
  } finally {
    await rm(workflow.directory, { recursive: true, force: true });
  }
});

test('verified existing POM method is reused in compiled candidate code', async () => {
  const id = randomUUID();
  const state = emptyAutomation();
  const dir = join(process.cwd(), '.local', 'prd', id, 'pom');
  await mkdir(dir, { recursive: true });
  const workflow = new AutomationWorkflow(process.cwd(), id, state, {
    extractRequirements: async () =>
      JSON.stringify({
        scenarioId: 'S-001',
        status: 'ready',
        reason: '',
        actions: [
          { kind: 'pom', target: state.poms[0]!.id, value: '', args: [] },
          { kind: 'assertVisible', target: 'UI-1', value: '', args: [] },
        ],
      }),
  });
  const server = createServer((_req, res) =>
    res.end('<button data-testid="save" type="button">Save</button>'),
  );
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const addr = server.address();
  assert.ok(addr && typeof addr !== 'string');
  try {
    await writeFile(
      join(dir, 'SavePage.ts'),
      "import {type Page,type Locator} from '@playwright/test';export class SavePage {readonly save:Locator;constructor(private readonly page:Page){this.save=this.page.getByTestId('save');}async saveChanges(){await this.save.click();}}",
    );
    await workflow.configure({
      name: 'POM fixture',
      url: 'http://127.0.0.1:' + addr.port,
      allowLocal: true,
      pomDirectory: '.local/prd/' + id + '/pom',
    });
    await workflow.inspect();
    state.scenarios = [
      {
        ...scenario,
        steps: ['Open application', 'Click Save', 'Verify Save button'],
        status: 'approved',
      },
    ];
    state.quality = { passed: true, issues: [] };
    await workflow.generate(requirements);
    assert.equal(state.candidates[0]?.status, 'pending', state.candidates[0]?.reason);
    assert.match(state.candidates[0]!.code, /pom0.saveChanges/);
    await workflow.reviewCode('S-001', 'approved', 'POM reviewer');
    const result = await workflow.run(['S-001']);
    assert.equal(result.results[0]?.status, 'passed', JSON.stringify(result));
    await writeFile(join(dir, 'SavePage.ts'), 'throw new Error("changed")');
    await assert.rejects(workflow.run(['S-001']), /POM changed/);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    await rm(workflow.directory, { recursive: true, force: true });
  }
});
