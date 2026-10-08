import { type ScenarioProvider } from './providers';
import {
  parseSuggestions,
  repairRedundantRepeatedAssertions,
  reviewScenarioQuality,
  validateRequirements,
  type Requirement,
  type Scenario,
  type ScenarioQualityReport,
  type Suggestions,
} from './scenarios';

export interface CorrectionAttempt {
  attempt: number;
  scenarioId: string;
  input: Suggestions;
  findings: ScenarioQualityReport;
  candidate?: Suggestions;
  rawResponse?: string;
  quality?: ScenarioQualityReport;
  failure?: string;
}

function isSubsequence(candidate: string[], original: string[]): boolean {
  let cursor = 0;
  for (const step of candidate) {
    while (cursor < original.length && original[cursor] !== step) cursor += 1;
    if (cursor === original.length) return false;
    cursor += 1;
  }
  return true;
}

export function onlyRemovesSteps(before: Scenario, after: Scenario): boolean {
  return (
    before.id === after.id &&
    before.title === after.title &&
    before.expectedResult === after.expectedResult &&
    before.priority === after.priority &&
    JSON.stringify([...before.requirementIds].sort()) ===
      JSON.stringify([...after.requirementIds].sort()) &&
    isSubsequence(after.steps, before.steps)
  );
}

export async function generateWithCorrection(
  provider: ScenarioProvider,
  requirements: Requirement[],
) {
  validateRequirements(requirements);
  const original = parseSuggestions(await provider.generate(requirements), requirements, true);
  const current = structuredClone(original);
  const repairAudit: {
    scenarioId: string;
    reason: string;
    before: Scenario;
    after: Scenario;
  }[] = [];
  let quality = reviewScenarioQuality(current, requirements);

  for (let index = 0; index < current.scenarios.length; index += 1) {
    const before = current.scenarios[index]!;
    const repaired = repairRedundantRepeatedAssertions(before);
    if (repaired.changes.length) {
      current.scenarios[index] = repaired.scenario;
      repairAudit.push({
        scenarioId: before.id,
        reason: 'Removed adjacent punctuation/case/whitespace-equivalent repeated assertion.',
        before,
        after: structuredClone(repaired.scenario),
      });
      quality = reviewScenarioQuality(current, requirements);
    }
  }

  const initialQuality = reviewScenarioQuality(original, requirements);
  const attempts: CorrectionAttempt[] = [];
  let attempt = 0;
  for (const target of [
    ...new Set(quality.issues.filter((i) => i.severity === 'error').map((i) => i.scenarioId)),
  ]) {
    quality = reviewScenarioQuality(current, requirements);
    const scenarioIndex = current.scenarios.findIndex((scenario) => scenario.id === target);
    if (scenarioIndex < 0) continue;
    const before = current.scenarios[scenarioIndex]!;
    const relevant = quality.issues.filter((issue) => issue.scenarioId === target);
    if (!relevant.some((issue) => issue.severity === 'error')) continue;
    const entry: CorrectionAttempt = {
      attempt: ++attempt,
      scenarioId: target,
      input: { scenarios: [structuredClone(before)] },
      findings: { passed: false, issues: relevant },
    };
    attempts.push(entry);
    try {
      if (!provider.correct) throw new Error('Provider does not support correction');
      const scopedRequirements = requirements.filter((requirement) =>
        before.requirementIds.includes(requirement.id),
      );
      entry.rawResponse = await provider.correct(scopedRequirements, {
        suggestions: entry.input,
        issues: relevant,
      });
      const candidate = parseSuggestions(entry.rawResponse, scopedRequirements, true);
      entry.candidate = candidate;
      if (candidate.scenarios.length !== 1 || !onlyRemovesSteps(before, candidate.scenarios[0]!))
        throw new Error(
          'Correction may only remove existing steps; title, expected result, priority and requirement IDs must remain unchanged',
        );
      const corrected = candidate.scenarios[0]!;
      current.scenarios[scenarioIndex] = corrected;
      quality = reviewScenarioQuality(current, requirements);
      entry.quality = quality;
      repairAudit.push({
        scenarioId: target,
        reason: 'Targeted AI correction removed existing steps only.',
        before: structuredClone(before),
        after: structuredClone(corrected),
      });
    } catch (error) {
      entry.failure = error instanceof Error ? error.message : String(error);
    }
  }

  const finalQuality = reviewScenarioQuality(current, requirements);
  return {
    suggestions: current,
    quality: { ...finalQuality, approvalStatus: 'pending-human-review' as const },
    history: {
      original,
      initialQuality,
      repairAudit,
      attempts,
      corrected: repairAudit.length ? structuredClone(current) : null,
      remainingIssues: finalQuality.issues,
      finalQualityStatus: finalQuality.passed ? 'passed' : 'failed',
      correctionStatus: initialQuality.passed
        ? repairAudit.length
          ? 'repaired'
          : 'not-needed'
        : finalQuality.passed
          ? 'corrected'
          : 'partial-or-failed',
      approvalStatus: 'pending-human-review' as const,
    },
  };
}
