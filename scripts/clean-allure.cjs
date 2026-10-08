const fs = require('node:fs');
const path = require('node:path');
const projectRoot = path.resolve(__dirname, '..');
const resultsDir = path.resolve(projectRoot, 'allure-results');
if (path.dirname(resultsDir) !== projectRoot || path.basename(resultsDir) !== 'allure-results') {
  throw new Error('Refusing to clean a directory outside this project.');
}
fs.rmSync(resultsDir, { recursive: true, force: true });
console.log('Cleared Allure results for the next run.');
