import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Ajv } from 'ajv';
import { approvedSuggestions, parseSuggestions, type Requirement } from './scenarios';

async function main() {
  const approvalFile = process.argv[2];
  if (!approvalFile) throw new Error('Provide the path to a human-authored approval JSON file');
  const approval: unknown = JSON.parse(await readFile(approvalFile, 'utf8')) as unknown;
  const validate = new Ajv().compile<{ reviewer: string; scenarioIds: string[] }>({
    type: 'object',
    additionalProperties: false,
    required: ['reviewer', 'scenarioIds'],
    properties: {
      reviewer: { type: 'string', minLength: 1, pattern: '\\S' },
      scenarioIds: {
        type: 'array',
        minItems: 1,
        uniqueItems: true,
        items: { type: 'string', pattern: '^S-[0-9]{3}$' },
      },
    },
  });
  if (!validate(approval)) throw new Error('Invalid human approval file');
  const requirements = JSON.parse(
    await readFile('test-data/requirements.json', 'utf8'),
  ) as Requirement[];
  const draft = JSON.parse(await readFile('.local/scenario-suggestions.json', 'utf8')) as {
    scenarios?: unknown;
    source?: unknown;
  };
  const quality = JSON.parse(
    await readFile('.local/scenario-quality-report.json', 'utf8'),
  ) as import('./scenarios').ScenarioQualityReport;
  const suggestions = parseSuggestions(
    JSON.stringify({ scenarios: draft.scenarios }),
    requirements,
  );
  const approved = approvedSuggestions(suggestions, approval, quality);
  await mkdir('.local', { recursive: true });
  await writeFile(
    '.local/approved-suggestions.json',
    JSON.stringify(
      {
        source: draft.source,
        reviewer: approval.reviewer,
        approvalStatus: 'human-reviewed',
        ...approved,
      },
      null,
      2,
    ),
  );
  console.log(
    'Approved suggestions saved. Test code must still be authored and reviewed by a human; nothing was executed.',
  );
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
