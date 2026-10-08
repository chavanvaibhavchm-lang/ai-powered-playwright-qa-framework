const fs = require('node:fs');
const path = require('node:path');
const name = process.argv[2];
if (!name || !/^[a-z0-9-]+$/.test(name)) throw new Error('Use a simple lowercase execution label');
const report = JSON.parse(fs.readFileSync('test-results/summary.json', 'utf8'));
const tests = [];
function visit(suites) {
  for (const suite of suites) {
    for (const spec of suite.specs ?? [])
      for (const test of spec.tests)
        tests.push({
          title: spec.title,
          file: spec.file,
          project: test.projectName,
          status: test.status,
          results: test.results.map((result) => ({
            status: result.status,
            duration: result.duration,
            error: result.error?.message,
            attachments: result.attachments?.map((attachment) => ({
              name: attachment.name,
              contentType: attachment.contentType,
            })),
          })),
        });
    visit(suite.suites ?? []);
  }
}
visit(report.suites);
const expectedProject = process.argv[3];
if (expectedProject && tests.some((test) => test.project !== expectedProject))
  throw new Error('Report belongs to a different project; run the requested suite first');
fs.mkdirSync('docs/evidence', { recursive: true });
fs.writeFileSync(
  path.join('docs/evidence', `${name}-execution.json`),
  JSON.stringify({ recordedAt: new Date().toISOString(), stats: report.stats, tests }, null, 2),
);
console.log(`${name}: ${JSON.stringify(report.stats)}`);
// The standard HTML output represents only the latest invocation. Preserve each
// recorded invocation separately before the next Playwright run replaces it.
if (fs.existsSync('playwright-report')) {
  const savedReport = path.join('.local', 'reports', name, 'playwright-report');
  fs.mkdirSync(path.dirname(savedReport), { recursive: true });
  fs.cpSync('playwright-report', savedReport, { recursive: true });
}
