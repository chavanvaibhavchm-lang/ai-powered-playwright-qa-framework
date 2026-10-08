import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import {
  applicationConfig,
  inspectApplication,
  pinnedProxy,
  projectPath,
  type ApplicationConfig,
  type Inspection,
} from './application';
import { discoverPoms, digest, type PomMethod } from './pom-discovery';
import {
  generateCandidates,
  parsePlan,
  renderTest,
  validateCode,
  validateTypes,
  type Candidate,
  type CodeProvider,
  type Execution,
} from './automation-code';
import { reviewScenarioQuality, type Scenario, type ScenarioQualityReport } from './scenarios';
import { requirementCoverage, scenarioReadiness, inspectionSummary } from './scenario-evidence';
import type { PrdRequirement } from './prd';
export interface AutomationState {
  config?: ApplicationConfig;
  inspection?: Inspection;
  poms: PomMethod[];
  scenarios: (Scenario & { status: 'pending' | 'needs-fix' | 'approved' | 'rejected' })[];
  quality?: ScenarioQualityReport;
  scenarioAudit?: {
    scenarioId: string;
    action: string;
    before: Scenario | null;
    after: Scenario | null;
  }[];
  scenarioCorrectionAttempts?: string[];
  candidates: Candidate[];
}
export const emptyAutomation = (): AutomationState => ({
  poms: [],
  scenarios: [],
  candidates: [],
  scenarioAudit: [],
  scenarioCorrectionAttempts: [],
});
export class AutomationWorkflow {
  readonly directory: string;
  constructor(
    private root: string,
    readonly projectId: string,
    readonly state: AutomationState,
    private provider: CodeProvider,
  ) {
    if (!/^[a-f0-9-]{36}$/.test(projectId)) throw new Error('Invalid project ID');
    this.directory = join(root, '.local', 'prd', projectId);
  }
  async save() {
    await mkdir(this.directory, { recursive: true });
    await writeFile(join(this.directory, 'automation.json'), JSON.stringify(this.state, null, 2));
  }
  async invalidate(clearScenarios = false) {
    this.state.candidates = [];
    if (clearScenarios) {
      this.state.scenarios = [];
      delete this.state.quality;
    }
    await rm(join(this.directory, 'approved'), { recursive: true, force: true });
    await rm(join(this.directory, 'candidates'), { recursive: true, force: true });
  }
  async configure(input: unknown) {
    const config = applicationConfig(input);
    if (config.pomDirectory) await projectPath(this.root, config.pomDirectory);
    if (config.storageState) {
      if (!/^\.local[\\/]auth[\\/][\w.-]+\.json$/.test(config.storageState))
        throw new Error('Storage state must be .local/auth/<name>.json');
      await projectPath(this.root, config.storageState);
    }
    await this.invalidate();
    this.state.config = config;
    delete this.state.inspection;
    this.state.poms = [];
    await this.save();
    return config;
  }
  async inspect() {
    if (!this.state.config) throw new Error('Save application configuration first');
    const inspection = await inspectApplication(this.state.config, this.root);
    const poms = await discoverPoms(this.root, this.state.config.pomDirectory, inspection);
    await this.invalidate();
    this.state.inspection = inspection;
    this.state.poms = poms;
    await this.save();
    return { inspection, poms };
  }
  async reviewScenarios(rows: unknown, requirements?: PrdRequirement[]) {
    if (requirements)
      this.state.quality = reviewScenarioQuality(
        { scenarios: this.state.scenarios },
        requirements.filter((r) => r.status === 'approved'),
        this.state.inspection,
      );
    if (!Array.isArray(rows) || rows.length !== this.state.scenarios.length)
      throw new Error('Review every scenario');
    const seen = new Set<string>();
    const updates = rows.map((row: Record<string, unknown>) => {
      const original = this.state.scenarios.find((s) => s.id === row.id);
      if (
        !original ||
        seen.has(original.id) ||
        !['approved', 'rejected', 'pending', 'needs-fix'].includes(String(row.status))
      )
        throw new Error('Invalid scenario review');
      if (
        row.status === 'approved' &&
        this.state.quality?.issues.some(
          (i) => i.scenarioId === original.id && i.severity === 'error',
        )
      )
        throw new Error('Scenario failed the quality gate');
      seen.add(original.id);
      const hasErrors = this.state.quality?.issues.some(
        (issue) => issue.scenarioId === original.id && issue.severity === 'error',
      );
      return {
        ...original,
        status:
          hasErrors && row.status !== 'rejected'
            ? 'needs-fix'
            : (row.status as 'pending' | 'needs-fix' | 'approved' | 'rejected'),
      };
    });
    await this.invalidate();
    this.state.scenarios = updates;
    await this.save();
  }
  async generate(requirements: PrdRequirement[]) {
    const { config, inspection, poms } = this.state;
    if (!config || !inspection) throw new Error('Inspect the configured application first');
    const quality = reviewScenarioQuality(
      { scenarios: this.state.scenarios },
      requirements.filter((r) => r.status === 'approved'),
      inspection,
    );
    this.state.quality = quality;
    const scenarios = this.state.scenarios.filter((s) => s.status === 'approved');
    if (!scenarios.length) throw new Error('Approve scenarios first');
    if (
      scenarios.some((scenario) =>
        quality.issues.some(
          (issue) => issue.scenarioId === scenario.id && issue.severity === 'error',
        ),
      )
    )
      throw new Error('An approved scenario failed the quality gate');
    if (
      scenarios.some((s) =>
        s.requirementIds.some(
          (id) =>
            !requirements.some(
              (r) => r.id === id && r.status === 'approved' && r.evidenceStatus !== 'unresolved',
            ),
        ),
      )
    )
      throw new Error('Requirement approval is stale');
    const candidates = await generateCandidates(
      scenarios,
      config,
      inspection,
      poms,
      this.provider,
      this.root,
      this.projectId,
      requirements.filter((r) => r.status === 'approved'),
    );
    await this.invalidate();
    this.state.candidates = candidates;
    const directory = join(this.directory, 'candidates');
    await mkdir(directory, { recursive: true });
    for (const c of candidates)
      if (c.code) await writeFile(join(directory, c.scenarioId + '.ts.txt'), c.code);
    await this.save();
    return candidates;
  }
  verify(candidate: Candidate) {
    const { config, inspection, poms } = this.state;
    if (
      !config ||
      !inspection ||
      !this.state.scenarios.some(
        (s) =>
          s.id === candidate.scenarioId &&
          s.status === 'approved' &&
          JSON.stringify(s.requirementIds) === JSON.stringify(candidate.requirementIds),
      )
    )
      throw new Error('Stale approval provenance');
    parsePlan(JSON.stringify(candidate.plan), candidate.scenario, inspection, poms);
    const file = '.local/prd/' + this.projectId + '/approved/' + candidate.scenarioId + '.spec.ts';
    const expected = renderTest(
      candidate.plan,
      candidate.scenario,
      config,
      inspection,
      poms,
      this.root,
      file,
    );
    validateCode(candidate.code, expected);
    if (candidate.hash !== digest(candidate.code)) throw new Error('Candidate hash mismatch');
  }
  async reviewCode(id: unknown, status: unknown, reviewer: unknown) {
    const candidate = this.state.candidates.find((c) => c.scenarioId === id);
    if (
      !candidate ||
      candidate.status === 'blocked' ||
      !['approved', 'rejected'].includes(String(status)) ||
      typeof reviewer !== 'string' ||
      !reviewer.trim() ||
      reviewer.length > 100
    )
      throw new Error('Valid candidate, review decision and human reviewer required');
    this.verify(candidate);
    validateTypes(
      candidate.code,
      this.root,
      '.local/prd/' + this.projectId + '/approved/' + candidate.scenarioId + '.spec.ts',
    );
    const directory = join(this.directory, 'approved');
    await mkdir(directory, { recursive: true });
    if (status === 'approved') {
      await this.verifyPoms(candidate);
      await writeFile(join(directory, candidate.scenarioId + '.spec.ts'), candidate.code);
    } else await rm(join(directory, candidate.scenarioId + '.spec.ts'), { force: true });
    candidate.status = status as 'approved' | 'rejected';
    candidate.reviewer = reviewer.trim();
    candidate.reviewedAt = new Date().toISOString();
    delete candidate.execution;
    await this.save();
    return candidate;
  }
  async verifyPoms(candidate: Candidate) {
    for (const method of candidate.references.poms) {
      const file = await projectPath(this.root, method.file);
      if (digest(await readFile(file, 'utf8')) !== method.sourceHash)
        throw new Error('POM changed since inspection; inspect again');
    }
  }
  selectApproved(ids: unknown): Candidate[] {
    if (!Array.isArray(ids) || !ids.length || ids.length > 10 || new Set(ids).size !== ids.length)
      throw new Error('Select 1–10 unique approved test IDs');
    return ids.map((id) => {
      const c = this.state.candidates.find((c) => c.scenarioId === id && c.status === 'approved');
      if (!c) throw new Error('Execution requires separate explicit code approval');
      this.verify(c);
      return c;
    });
  }
  async run(ids: unknown, requirements: PrdRequirement[] = []) {
    const selected = this.selectApproved(ids);
    const config = this.state.config!;
    for (const c of selected) {
      await this.verifyPoms(c);
      if (
        (await readFile(join(this.directory, 'approved', c.scenarioId + '.spec.ts'), 'utf8')) !==
        c.code
      )
        throw new Error('Approved file changed; review again');
    }
    const runId = randomUUID();
    const runDirectory = join(this.directory, 'runs', runId);
    await mkdir(runDirectory, { recursive: true });
    let proxy: Awaited<ReturnType<typeof pinnedProxy>> | undefined;
    try {
      proxy = await pinnedProxy(config);
      const q = JSON.stringify;
      const importPath = relative(runDirectory, join(this.root, 'playwright.config')).replace(
        /\\/g,
        '/',
      );
      let storageState: string | undefined;
      if (config.storageState) storageState = await projectPath(this.root, config.storageState);
      const runConfig =
        'import base from ' +
        q(importPath) +
        ";\nimport { defineConfig } from '@playwright/test';\nexport default defineConfig({...base, testDir: " +
        q(join(this.directory, 'approved')) +
        ', testMatch: ' +
        q(selected.map((c) => c.scenarioId + '.spec.ts')) +
        ", projects:[{name:'generated',use:{browserName:'chromium'}}], retries:0,workers:1,fullyParallel:false,globalTimeout:300000,timeout:30000,outputDir:" +
        q(join(runDirectory, 'artifacts')) +
        ",reporter:[['list'],['json',{outputFile:" +
        q(join(runDirectory, 'summary.json')) +
        "}],['html',{open:'never',outputFolder:" +
        q(join(runDirectory, 'html')) +
        "}],['allure-playwright',{resultsDir:" +
        q(join(runDirectory, 'allure-results')) +
        '}]],use:{...base.use,baseURL:' +
        q(config.url) +
        ',headless:true,proxy:{server:' +
        q(proxy.server) +
        ",bypass:'<-loopback>'},serviceWorkers:'block',storageState:" +
        (storageState ? q(storageState) : 'undefined') +
        ",screenshot:'only-on-failure',trace:'retain-on-failure',video:'off'}});\n";
      await writeFile(join(runDirectory, 'config.ts'), runConfig);
      const outcome = await runCommand(
        this.root,
        [
          join(this.root, 'node_modules', '@playwright', 'test', 'cli.js'),
          'test',
          '--config',
          join(runDirectory, 'config.ts'),
        ],
        { PRD_RUN_CONFIG: JSON.stringify(config) },
      );
      await writeFile(join(runDirectory, 'execution.log'), outcome.output);
      let report: Record<string, unknown> = {};
      try {
        report = JSON.parse(await readFile(join(runDirectory, 'summary.json'), 'utf8'));
      } catch {
        /* environment failure */
      }
      const results = flattenResults(report);
      for (const c of selected) {
        const result = results.find((r) => r.title.startsWith(c.scenarioId + ' '));
        const status = result?.status === 'passed' ? 'passed' : result ? 'failed' : 'blocked';
        const reason =
          result?.reason ??
          (outcome.output.slice(-2000) || 'No execution result; environment unavailable');
        c.execution = {
          status,
          category: classifyFailure(reason, status),
          reason: status === 'passed' ? '' : reason,
          runId,
          reportLinks: [
            '/api/artifact/' + this.projectId + '/' + runId + '/html/index.html',
            '/api/artifact/' + this.projectId + '/' + runId + '/execution.log',
          ],
          artifacts: result?.artifacts ?? [],
        };
      }
      // Reporting is a fixed local command. Failure to build Allure does not change test results.
      const allure = await runCommand(
        this.root,
        [
          join(this.root, 'node_modules', 'allure', 'cli.js'),
          'generate',
          join(runDirectory, 'allure-results'),
          '--output',
          join(runDirectory, 'allure-report'),
        ],
        {},
        60_000,
      );
      await writeFile(join(runDirectory, 'allure.log'), allure.output);
      try {
        await readFile(join(runDirectory, 'allure-report', 'index.html'));
        for (const c of selected)
          c.execution!.reportLinks.push(
            '/api/artifact/' + this.projectId + '/' + runId + '/allure-report/index.html',
          );
      } catch {
        /* expose log if generation unavailable */
      }
      await this.save();
      const trace = traceability(this.state, requirements);
      await writeFile(join(runDirectory, 'traceability.json'), JSON.stringify(trace, null, 2));
      return {
        runId,
        results: selected.map((c) => ({ scenarioId: c.scenarioId, ...c.execution })),
        allureGenerated: allure.exitCode === 0,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      for (const candidate of selected)
        candidate.execution = {
          status: 'blocked',
          category: 'environment',
          reason,
          runId,
          reportLinks: ['/api/artifact/' + this.projectId + '/' + runId + '/execution.log'],
          artifacts: [],
        };
      await writeFile(join(runDirectory, 'execution.log'), reason);
      await this.save();
      await writeFile(
        join(runDirectory, 'traceability.json'),
        JSON.stringify(traceability(this.state, requirements), null, 2),
      );
      return {
        runId,
        results: selected.map((c) => ({ scenarioId: c.scenarioId, ...c.execution })),
        allureGenerated: false,
      };
    } finally {
      await proxy?.close();
    }
  }
}
export function classifyFailure(reason: string, status: string): Execution['category'] {
  if (status === 'passed') return 'unknown';
  if (/strict mode violation|locator.*resolved to|waiting for (?:getBy|locator)/i.test(reason))
    return 'locator';
  if (/expect\(|toHaveText|toBeVisible|assertion/i.test(reason)) return 'assertion';
  if (/timeout|timed out/i.test(reason)) return 'timeout';
  if (
    /net::|browser.*(?:missing|launch)|executable doesn't exist|ECONN|ENOTFOUND|No execution result/i.test(
      reason,
    )
  )
    return 'environment';
  return 'unknown';
}
function flattenResults(report: Record<string, unknown>) {
  const found: { title: string; status: string; reason: string; artifacts: string[] }[] = [];
  function walk(suites: unknown) {
    if (!Array.isArray(suites)) return;
    for (const suite of suites) {
      walk(suite.suites);
      for (const spec of suite.specs ?? []) {
        const test = spec.tests?.[0];
        const result = test?.results?.at(-1);
        if (result)
          found.push({
            title: spec.title,
            status: result.status,
            reason: (result.errors ?? [])
              .map((e: { message?: string }) => e.message ?? '')
              .join('\n')
              .slice(0, 4000),
            artifacts: (result.attachments ?? [])
              .map((a: { path?: string }) => a.path)
              .filter(Boolean),
          });
      }
    }
  }
  walk(report.suites);
  return found;
}
export function traceability(state: AutomationState, requirements: PrdRequirement[]) {
  return {
    inspection: inspectionSummary(state.inspection, state.poms),
    scenarioCoverage: requirementCoverage(
      requirements.filter((r) => r.status === 'approved'),
      state.scenarios,
    ),
    approvedScenarioCoverage: requirementCoverage(
      requirements.filter((r) => r.status === 'approved'),
      state.scenarios.filter((s) => s.status === 'approved'),
    ),
    scenarioReadiness: state.scenarios.map((s) => ({
      scenarioId: s.id,
      ...scenarioReadiness(
        s,
        requirements.filter((r) => r.status === 'approved'),
        state.inspection,
        state.config,
      ),
    })),
    coverage: {
      approvedRequirements: requirements.filter((r) => r.status === 'approved').length,
      scenariosGenerated: state.scenarios.length,
      scenariosApproved: state.scenarios.filter((s) => s.status === 'approved').length,
      testsGenerated: state.candidates.filter((c) => !!c.code).length,
      testsApproved: state.candidates.filter((c) => c.status === 'approved').length,
      passed: state.candidates.filter((c) => c.execution?.status === 'passed').length,
      failed: state.candidates.filter((c) => c.execution?.status === 'failed').length,
      blocked: state.candidates.filter(
        (c) => c.status === 'blocked' || c.execution?.status === 'blocked',
      ).length,
    },
    requirements: requirements
      .filter((r) => r.status === 'approved')
      .map((r) => ({
        requirementId: r.id,
        scenarioIds: state.scenarios
          .filter((s) => s.requirementIds.includes(r.id))
          .map((s) => s.id),
        testIds: state.candidates
          .filter((c) => c.requirementIds.includes(r.id))
          .map((c) => c.scenarioId),
      })),
    tests: state.candidates.map((c) => ({
      requirementIds: c.requirementIds,
      scenarioId: c.scenarioId,
      file: c.code ? c.diff.split('\n')[1]?.slice(4) : null,
      approval: c.status,
      reviewer: c.reviewer,
      execution: c.execution,
      blockedReason: c.reason,
    })),
  };
}
async function runCommand(
  root: string,
  args: string[],
  extraEnv: Record<string, string>,
  timeout = 310_000,
): Promise<{ exitCode: number; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      env: { ...process.env, ...extraEnv },
      shell: false,
      windowsHide: true,
    });
    let output = '';
    let settled = false;
    const timer = setTimeout(() => child.kill(), timeout);
    const append = (data: Buffer) => {
      output = (output + data.toString()).slice(-100_000);
    };
    child.stdout.on('data', append);
    child.stderr.on('data', append);
    const finish = (code: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ exitCode: code, output });
    };
    child.on('error', (e) => {
      output += e.message;
      finish(-1);
    });
    child.on('close', (code) => finish(code ?? -1));
  });
}
