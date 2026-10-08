const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const resultsDir = path.join(root, 'allure-results');
const resultFiles = fs.existsSync(resultsDir)
  ? fs
      .readdirSync(resultsDir)
      .filter((name) => name.endsWith('-result.json'))
      .sort()
  : [];
if (resultFiles.length === 0) throw new Error('Run a test suite before generating a report.');
const hash = createHash('sha256');
for (const filename of resultFiles)
  hash.update(filename).update(fs.readFileSync(path.join(resultsDir, filename)));
const sourceHash = hash.digest('hex');
const stamp = path.join(root, '.local', 'allure-source.sha256');
const appendHistory = !fs.existsSync(stamp) || fs.readFileSync(stamp, 'utf8') !== sourceHash;
const reportDir = path.resolve(root, 'allure-report');
if (path.dirname(reportDir) !== root || path.basename(reportDir) !== 'allure-report') {
  throw new Error('Refusing to replace report output outside this project.');
}
if (fs.existsSync(reportDir) && fs.lstatSync(reportDir).isSymbolicLink()) {
  throw new Error('Report output must not be a symbolic link.');
}
// Rebuild only generated HTML; previous CLI landing pages must not survive.
fs.rmSync(reportDir, { recursive: true, force: true });
fs.mkdirSync(path.join(root, 'test-history'), { recursive: true });
fs.mkdirSync(path.join(root, 'allure-results'), { recursive: true });
// Allure 3 derives executor details from CI environment. Raw executor metadata
// is also kept for portability; no secrets or private local paths are recorded.
const executor = process.env.GITHUB_ACTIONS
  ? {
      name: 'GitHub Actions',
      type: 'github',
      buildName: process.env.GITHUB_WORKFLOW,
      buildOrder: Number(process.env.GITHUB_RUN_NUMBER ?? 0),
      buildUrl: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
    }
  : { name: 'Local verified execution', type: 'local' };
fs.writeFileSync(
  path.join(root, 'allure-results', 'executor.json'),
  JSON.stringify(executor, null, 2),
);
const cli = path.resolve(path.dirname(require.resolve('allure')), '..', 'cli.js');
const result = spawnSync(
  process.execPath,
  [cli, 'generate', 'allure-results', '--config', 'allure.config.ts'],
  {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ALLURE_APPEND_HISTORY: appendHistory ? '1' : '0' },
  },
);
if (result.error) {
  console.error(result.error);
  process.exitCode = 1;
} else process.exitCode = result.status ?? 1;
if (result.status === 0) {
  fs.mkdirSync(path.dirname(stamp), { recursive: true });
  fs.writeFileSync(stamp, sourceHash);
}
