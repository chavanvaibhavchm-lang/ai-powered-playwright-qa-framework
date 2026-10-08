import { createServer, type IncomingMessage } from 'node:http';
import { randomUUID, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname, relative, isAbsolute } from 'node:path';
import { requirementTarget, inspectionSummary } from './scenario-evidence';
import { projectPath } from './application';
import {
  AutomationWorkflow,
  emptyAutomation,
  traceability,
  type AutomationState,
} from './automation-workflow';
import { OllamaProvider } from './providers';
import { generateWithCorrection, onlyRemovesSteps } from './correction';
import { mergeScenarioBatches } from './scenario-batches';
import {
  parseSuggestions,
  reviewScenarioQuality,
  type Scenario,
  type Suggestions,
} from './scenarios';
import {
  documentChunks,
  extractRequirements,
  reviewRequirement,
  MAX_UPLOAD,
  type PrdRequirement,
  type SourceChunk,
} from './prd';

const port = Number(process.env.PRD_PORT ?? 3210);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PRD_PORT');
const origin = 'http://127.0.0.1:' + port;
const token = randomBytes(32).toString('hex');
const directory = join(process.cwd(), '.local', 'prd');
interface Session {
  id: string;
  filename: string;
  chunks: SourceChunk[];
  requirements: PrdRequirement[];
  extracted: boolean;
  busy: boolean;
  automation: AutomationState;
}
const sessions = new Map<string, Session>();
const provider = new OllamaProvider('qwen2.5:1.5b');
async function body(request: IncomingMessage, limit: number): Promise<Buffer> {
  const parts: Buffer[] = [];
  let size = 0;
  for await (const part of request) {
    const buffer = Buffer.from(part as Uint8Array);
    size += buffer.length;
    if (size > limit) throw new Error('Request exceeds size limit');
    parts.push(buffer);
  }
  return Buffer.concat(parts);
}
async function save(session: Session) {
  await writeFile(
    join(directory, session.id, 'session.json'),
    JSON.stringify({ ...session, busy: false }, null, 2),
  );
  await writeFile(
    join(directory, session.id, 'requirements.json'),
    JSON.stringify({ filename: session.filename, requirements: session.requirements }, null, 2),
  );
}
async function saveScenarioAudit(session: Session) {
  await writeFile(
    join(directory, session.id, 'scenario-repair-audit.json'),
    JSON.stringify(session.automation.scenarioAudit ?? [], null, 2),
  );
}
export const server = createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'",
  );
  const reply = (value: unknown, status = 200) => {
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(value));
  };
  try {
    if (request.headers.host !== '127.0.0.1:' + port) return reply({ error: 'Invalid host' }, 403);
    const path = request.url;
    if (request.method === 'GET' && path === '/api/config') return reply({ token });
    if (request.method === 'GET' && ['/', '/app.js', '/style.css'].includes(path ?? '')) {
      const file = path === '/' ? 'index.html' : path!.slice(1);
      response.writeHead(200, {
        'Content-Type': file.endsWith('.html')
          ? 'text/html'
          : file.endsWith('.js')
            ? 'text/javascript'
            : 'text/css',
      });
      response.end(await readFile(join(__dirname, 'prd-ui', file)));
      return;
    }
    if (request.method === 'GET' && path?.startsWith('/api/artifact/')) {
      const parts = path.slice('/api/artifact/'.length).split('/');
      const projectId = parts.shift()!;
      const runId = parts.shift()!;
      if (
        !/^[a-f0-9-]{36}$/.test(projectId) ||
        !/^[a-f0-9-]{36}$/.test(runId) ||
        !parts.length ||
        parts.some((p) => !p || p === '.' || p === '..' || !/^[\w.-]+$/.test(p))
      )
        throw new Error('Invalid artifact path');
      const base = join(directory, projectId, 'runs', runId);
      const target = await projectPath(
        process.cwd(),
        relative(process.cwd(), join(base, ...parts)),
      );
      const rel = relative(base, target);
      if (rel.startsWith('..') || isAbsolute(rel))
        throw new Error('Artifact escapes run directory');
      const types: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.zip': 'application/zip',
        '.webm': 'video/webm',
        '.woff2': 'font/woff2',
      };
      const artifact = await readFile(target);
      response.writeHead(200, {
        'Content-Type': types[extname(target)] ?? 'text/plain',
        'Content-Security-Policy':
          "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'",
      });
      response.end(artifact);
      return;
    }
    if (request.method !== 'POST') return reply({ error: 'Not found' }, 404);
    if (request.headers.origin !== origin || request.headers['x-prd-token'] !== token)
      return reply({ error: 'Invalid local session' }, 403);
    if (path === '/api/upload') {
      if (sessions.size >= 20)
        throw new Error('Session limit reached. Restart the server to begin a new session.');
      const name = decodeURIComponent(String(request.headers['x-filename'] ?? ''));
      if (
        !name ||
        name.length > 200 ||
        /[/\\]/.test(name) ||
        [...name].some((char) => char.charCodeAt(0) < 32)
      )
        throw new Error('Invalid filename');
      const buffer = await body(request, MAX_UPLOAD);
      const chunks = await documentChunks(name, buffer);
      const id = randomUUID();
      const session: Session = {
        id,
        filename: name,
        chunks,
        requirements: [],
        extracted: false,
        busy: false,
        automation: emptyAutomation(),
      };
      await mkdir(join(directory, id), { recursive: true });
      await writeFile(
        join(directory, id, 'upload.' + name.split('.').pop()!.toLowerCase()),
        buffer,
      );
      await writeFile(join(directory, id, 'source.json'), JSON.stringify(chunks));
      sessions.set(id, session);
      await save(session);
      return reply({ id, filename: name, chunks: chunks.length });
    }
    const input = JSON.parse((await body(request, 250_000)).toString('utf8')) as {
      id?: unknown;
      requirements?: unknown;
      config?: unknown;
      scenarios?: unknown;
      scenarioId?: unknown;
      title?: unknown;
      steps?: unknown;
      expectedResult?: unknown;
      status?: unknown;
      reviewer?: unknown;
      ids?: unknown;
    };
    if (
      path === '/api/resume' &&
      typeof input.id === 'string' &&
      /^[a-f0-9-]{36}$/.test(input.id) &&
      !sessions.has(input.id)
    ) {
      if (sessions.size >= 20) throw new Error('Session limit reached');
      const restored = JSON.parse(
        await readFile(join(directory, input.id, 'session.json'), 'utf8'),
      ) as Session;
      if (restored.id !== input.id) throw new Error('Invalid saved project');
      try {
        restored.automation = JSON.parse(
          await readFile(join(directory, input.id, 'automation.json'), 'utf8'),
        );
      } catch {
        restored.automation ??= emptyAutomation();
      }
      restored.busy = false;
      sessions.set(input.id, restored);
    }
    const session = typeof input.id === 'string' ? sessions.get(input.id) : undefined;
    if (!session)
      return reply({ error: 'Upload a PRD first; sessions expire when the server restarts' }, 404);
    if (session.busy) return reply({ error: 'This document is busy' }, 409);
    session.busy = true;
    const automation = new AutomationWorkflow(
      process.cwd(),
      session.id,
      session.automation,
      provider,
    );
    try {
      if (path === '/api/resume' || path === '/api/automation') {
        const quality = session.automation.scenarios.length
          ? reviewScenarioQuality(
              { scenarios: session.automation.scenarios },
              session.requirements.filter((r) => r.status === 'approved'),
              session.automation.inspection,
            )
          : session.automation.quality;
        session.automation.quality = quality;
        for (const scenario of session.automation.scenarios) {
          const invalid = quality?.issues.some(
            (issue) => issue.scenarioId === scenario.id && issue.severity === 'error',
          );
          if (invalid) scenario.status = 'needs-fix';
          else if (scenario.status === 'needs-fix') scenario.status = 'pending';
        }
        await automation.save();
        await save(session);
        return reply({
          id: session.id,
          filename: session.filename,
          requirements: session.requirements.map((r) => ({ ...r, target: requirementTarget(r) })),
          inspectionSummary: inspectionSummary(
            session.automation.inspection,
            session.automation.poms,
          ),
          ...session.automation,
          quality,
          traceability: traceability(session.automation, session.requirements),
        });
      }
      if (path === '/api/application') {
        await automation.configure(input.config);
        await save(session);
        return reply(session.automation);
      }
      if (path === '/api/inspect') {
        const result = await automation.inspect();
        await save(session);
        return reply(result);
      }
      if (path === '/api/scenario-review') {
        await automation.reviewScenarios(input.scenarios, session.requirements);
        await save(session);
        return reply(session.automation);
      }
      if (path === '/api/scenario-edit') {
        const before = session.automation.scenarios.find((s) => s.id === input.scenarioId);
        if (
          !before ||
          typeof input.title !== 'string' ||
          !Array.isArray(input.steps) ||
          input.steps.some((step) => typeof step !== 'string') ||
          typeof input.expectedResult !== 'string'
        )
          throw new Error('Invalid scenario edit');
        const candidate = {
          ...before,
          title: input.title,
          steps: input.steps as string[],
          expectedResult: input.expectedResult,
        };
        const approved = session.requirements.filter((r) => r.status === 'approved');
        const checked = parseSuggestions(JSON.stringify({ scenarios: [candidate] }), approved, true)
          .scenarios[0]!;
        if (
          checked.id !== before.id ||
          checked.priority !== before.priority ||
          JSON.stringify([...checked.requirementIds].sort()) !==
            JSON.stringify([...before.requirementIds].sort())
        )
          throw new Error('Scenario edits cannot change priority or requirement IDs');
        const previous = structuredClone(before) as Scenario;
        const index = session.automation.scenarios.indexOf(before);
        session.automation.scenarios[index] = { ...checked, status: 'pending' };
        session.automation.quality = reviewScenarioQuality(
          { scenarios: session.automation.scenarios },
          approved,
          session.automation.inspection,
        );
        for (const scenario of session.automation.scenarios) {
          const invalid = session.automation.quality.issues.some(
            (issue) => issue.scenarioId === scenario.id && issue.severity === 'error',
          );
          if (invalid && scenario.status === 'approved') scenario.status = 'needs-fix';
          else if (!invalid && scenario.status === 'needs-fix') scenario.status = 'pending';
        }
        session.automation.scenarioAudit ??= [];
        session.automation.scenarioAudit.push({
          scenarioId: checked.id,
          action: 'Human edit and immediate revalidation',
          before: previous,
          after: structuredClone(checked),
        });
        await saveScenarioAudit(session);
        await automation.invalidate();
        await automation.save();
        await save(session);
        return reply(session.automation);
      }
      if (path === '/api/scenario-revalidate') {
        session.automation.quality = reviewScenarioQuality(
          { scenarios: session.automation.scenarios },
          session.requirements.filter((r) => r.status === 'approved'),
          session.automation.inspection,
        );
        for (const scenario of session.automation.scenarios) {
          const invalid = session.automation.quality.issues.some(
            (issue) => issue.scenarioId === scenario.id && issue.severity === 'error',
          );
          if (invalid && scenario.status === 'approved') scenario.status = 'needs-fix';
          else if (invalid && scenario.status !== 'rejected') scenario.status = 'needs-fix';
          else if (!invalid && scenario.status === 'needs-fix') scenario.status = 'pending';
        }
        await automation.invalidate();
        await automation.save();
        await save(session);
        return reply(session.automation);
      }
      if (path === '/api/scenario-correct') {
        const scenario = session.automation.scenarios.find((s) => s.id === input.scenarioId);
        if (!scenario) throw new Error('Unknown scenario');
        const approved = session.requirements.filter((r) => r.status === 'approved');
        const currentQuality = reviewScenarioQuality(
          { scenarios: session.automation.scenarios },
          approved,
          session.automation.inspection,
        );
        const issues = currentQuality.issues.filter(
          (issue) => issue.scenarioId === scenario.id && issue.severity === 'error',
        );
        if (!issues.length) throw new Error('Scenario has no quality errors to correct');
        session.automation.scenarioCorrectionAttempts ??= [];
        if (session.automation.scenarioCorrectionAttempts.includes(scenario.id))
          throw new Error('The single targeted correction attempt was already used');
        session.automation.scenarioCorrectionAttempts.push(scenario.id);
        await automation.save();
        await save(session);
        if (!provider.correct) throw new Error('Provider does not support correction');
        const before = structuredClone(scenario) as Scenario;
        const scopedRequirements = approved.filter((r) => scenario.requirementIds.includes(r.id));
        const raw = await provider.correct(scopedRequirements, {
          suggestions: { scenarios: [before] },
          issues,
        });
        const candidate = parseSuggestions(raw, scopedRequirements, true).scenarios;
        if (candidate.length !== 1 || !onlyRemovesSteps(before, candidate[0]!))
          throw new Error(
            'Correction may only remove existing steps; title, expected result, priority and requirement IDs must remain unchanged',
          );
        const index = session.automation.scenarios.indexOf(scenario);
        session.automation.scenarios[index] = { ...candidate[0]!, status: 'pending' };
        session.automation.quality = reviewScenarioQuality(
          { scenarios: session.automation.scenarios },
          approved,
          session.automation.inspection,
        );
        session.automation.scenarioAudit ??= [];
        session.automation.scenarioAudit.push({
          scenarioId: scenario.id,
          action: 'Targeted AI correction removed existing steps only',
          before,
          after: structuredClone(candidate[0]!),
        });
        await saveScenarioAudit(session);
        for (const item of session.automation.scenarios) {
          const invalid = session.automation.quality.issues.some(
            (issue) => issue.scenarioId === item.id && issue.severity === 'error',
          );
          if (invalid) item.status = 'needs-fix';
          else if (item.status === 'needs-fix') item.status = 'pending';
        }
        await automation.invalidate();
        await automation.save();
        await save(session);
        return reply(session.automation);
      }
      if (path === '/api/code-generate') {
        const candidates = await automation.generate(session.requirements);
        await save(session);
        return reply({ candidates });
      }
      if (path === '/api/code-review') {
        const candidate = await automation.reviewCode(
          input.scenarioId,
          input.status,
          input.reviewer,
        );
        await save(session);
        return reply({ candidate });
      }
      if (path === '/api/run') {
        const result = await automation.run(input.ids, session.requirements);
        await save(session);
        const trace = traceability(session.automation, session.requirements);
        await writeFile(
          join(automation.directory, 'runs', result.runId, 'traceability.json'),
          JSON.stringify(trace, null, 2),
        );
        return reply({ ...result, traceability: trace });
      }
      if (path === '/api/extract') {
        const extracted = await extractRequirements(session.chunks, provider);
        await automation.invalidate(true);
        session.requirements = extracted;
        session.extracted = true;
        await save(session);
        return reply({ requirements: session.requirements });
      }
      if (path === '/api/review') {
        if (
          !session.extracted ||
          !Array.isArray(input.requirements) ||
          input.requirements.length !== session.requirements.length
        )
          throw new Error('Invalid review');
        const rows = input.requirements as {
          id: unknown;
          description: unknown;
          status: unknown;
          target?: unknown;
        }[];
        const seen = new Set<string>();
        const updated = rows.map((row) => {
          const original = session.requirements.find((r) => r.id === row.id);
          if (
            !original ||
            seen.has(original.id) ||
            typeof row.description !== 'string' ||
            !row.description.trim() ||
            row.description.length > 1000 ||
            !['pending', 'approved', 'rejected'].includes(String(row.status))
          )
            throw new Error('Invalid requirement review');
          seen.add(original.id);
          if (
            row.target !== undefined &&
            !['application', 'framework'].includes(String(row.target))
          )
            throw new Error('Invalid requirement target');
          return reviewRequirement(
            {
              ...original,
              target: (row.target ?? requirementTarget(original)) as 'application' | 'framework',
            },
            row.description.trim(),
            row.status as PrdRequirement['status'],
            session.chunks,
          );
        });
        if (JSON.stringify(updated) !== JSON.stringify(session.requirements))
          await automation.invalidate(true);
        session.requirements = updated;
        await save(session);
        return reply({ requirements: updated });
      }
      if (path === '/api/generate' || path === '/api/scenario-deduplicate') {
        const recovery = path === '/api/scenario-deduplicate';
        if (!recovery && session.automation.scenarios.length)
          throw new Error(
            'Scenarios already exist. Edit and revalidate them or use one targeted correction; full-batch regeneration is disabled to preserve human decisions.',
          );
        const approved = session.requirements
          .filter((r) => r.status === 'approved' && r.evidenceStatus !== 'unresolved')
          .filter((r) => requirementTarget(r) === 'application')
          .map(({ id, description, target }) => ({ id, description, target }));
        if (!approved.length)
          throw new Error(
            'Approve at least one application requirement first; framework requirements are tracked separately.',
          );
        const batches: Suggestions[] = [];
        const histories: Awaited<ReturnType<typeof generateWithCorrection>>['history'][] = [];
        if (recovery) {
          if (
            !session.automation.scenarios.length ||
            session.automation.scenarios.some((s) => !['pending', 'needs-fix'].includes(s.status))
          )
            throw new Error(
              'Duplicate removal requires pending scenarios; existing human decisions are preserved.',
            );
          batches.push({ scenarios: structuredClone(session.automation.scenarios) });
        } else {
          for (let i = 0; i < approved.length; i += 1) {
            const result = await generateWithCorrection(provider, approved.slice(i, i + 1));
            batches.push(result.suggestions);
            histories.push(result.history);
          }
        }
        const { suggestions, duplicates, changes } = mergeScenarioBatches(batches, !recovery);
        if (recovery && !duplicates.length)
          throw new Error('No exact duplicate scenarios to remove.');
        const quality = reviewScenarioQuality(suggestions, approved, session.automation.inspection);
        await automation.invalidate(true);
        const audit: NonNullable<AutomationState['scenarioAudit']> = histories.flatMap((history) =>
          history.repairAudit.map((entry) => ({
            scenarioId: entry.scenarioId,
            action: entry.reason,
            before: entry.before,
            after: entry.after,
          })),
        );
        audit.push(
          ...changes.map((change) => ({
            scenarioId: change.scenarioId,
            action: change.action,
            before: change.before,
            after: change.after,
          })),
        );
        session.automation.scenarioAudit = audit;
        await saveScenarioAudit(session);
        session.automation.scenarioCorrectionAttempts = [];
        session.automation.scenarios = suggestions.scenarios.map((s) => ({
          ...s,
          status: quality.issues.some(
            (issue) => issue.scenarioId === s.id && issue.severity === 'error',
          )
            ? ('needs-fix' as const)
            : ('pending' as const),
        }));
        session.automation.quality = quality;
        await automation.save();
        await save(session);
        const result = {
          source: recovery ? 'saved-scenarios' : 'local-ollama',
          duplicateRemovals: duplicates,
          approvalStatus: 'pending-human-review',
          ...suggestions,
          quality,
        };
        const output = join(directory, session.id, randomUUID());
        await mkdir(output);
        await writeFile(join(output, 'scenario-suggestions.json'), JSON.stringify(result, null, 2));
        await writeFile(
          join(output, 'scenario-quality-report.json'),
          JSON.stringify(quality, null, 2),
        );
        await writeFile(
          join(output, 'scenario-correction-history.json'),
          JSON.stringify(histories, null, 2),
        );
        await writeFile(
          join(output, 'scenario-merge-audit.json'),
          JSON.stringify({ originalBatches: batches, duplicateRemovals: duplicates }, null, 2),
        );
        await writeFile(
          join(output, 'scenario-repair-audit.json'),
          JSON.stringify(session.automation.scenarioAudit, null, 2),
        );
        await writeFile(
          join(output, 'approved-requirements.json'),
          JSON.stringify(approved, null, 2),
        );
        return reply({ ...result, outputDirectory: output });
      }
      return reply({ error: 'Not found' }, 404);
    } finally {
      session.busy = false;
    }
  } catch (error) {
    reply({ error: error instanceof Error ? error.message : String(error) }, 400);
  }
});
server.requestTimeout = 30_000;
server.listen(port, '127.0.0.1', () => console.log('Local PRD workflow: ' + origin));
