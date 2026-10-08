import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { MockProvider, OllamaProvider } from './providers';

import { type Requirement } from './scenarios';
import { generateWithCorrection } from './correction';

async function main() {
  const requirements = JSON.parse(
    await readFile('test-data/requirements.json', 'utf8'),
  ) as Requirement[];

  const live = process.argv.includes('--live');

  const provider = live
    ? new OllamaProvider(process.env.OLLAMA_MODEL ?? 'qwen2.5:1.5b', process.env.OLLAMA_URL)
    : new MockProvider(await readFile('test-data/mock-suggestions.json', 'utf8'));

  const result = await generateWithCorrection(provider, requirements);
  const suggestions = result.suggestions;
  const qualityReport = result.quality;

  await mkdir('.local', {
    recursive: true,
  });

  await writeFile(
    '.local/scenario-suggestions.json',
    JSON.stringify(
      {
        source: live ? 'local-ollama' : 'deterministic-mock',
        approvalStatus: 'pending-human-review',
        ...suggestions,
      },
      null,
      2,
    ),
  );

  await writeFile('.local/scenario-quality-report.json', JSON.stringify(qualityReport, null, 2));

  await writeFile(
    '.local/scenario-correction-history.json',
    JSON.stringify(result.history, null, 2),
  );
  await writeFile(
    '.local/scenario-repair-audit.json',
    JSON.stringify(result.history.repairAudit, null, 2),
  );
  if (!qualityReport.passed) process.exitCode = 1;

  console.log('AI scenarios saved successfully.');

  console.log(`Quality gate: ${qualityReport.passed ? 'PASSED' : 'FAILED'}`);

  console.log(`Quality issues: ${qualityReport.issues.length}`);

  console.log('No Playwright tests were generated or executed.');
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
