import Ajv from 'ajv';
import type { Inspection } from './application';
import { requirementTarget, requirementCoverage, scenarioReadiness } from './scenario-evidence';

export interface Requirement {
  target?: 'application' | 'framework';
  id: string;
  description: string;
}

export interface Scenario {
  id: string;
  requirementIds: string[];
  title: string;
  steps: string[];
  expectedResult: string;
  priority: 'critical' | 'normal' | 'minor';
}

export interface Suggestions {
  scenarios: Scenario[];
}

export const suggestionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['scenarios'],
  properties: {
    scenarios: {
      type: 'array',
      minItems: 1,
      maxItems: 20,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'requirementIds', 'title', 'steps', 'expectedResult', 'priority'],
        properties: {
          id: {
            type: 'string',
            pattern: '^S-[0-9]{3}$',
          },
          requirementIds: {
            type: 'array',
            minItems: 1,
            uniqueItems: true,
            items: {
              type: 'string',
              pattern: '^[A-Z]+-[0-9]{2}$',
            },
          },
          title: {
            type: 'string',
            minLength: 5,
            maxLength: 200,
            pattern: '\\S',
          },
          steps: {
            type: 'array',
            minItems: 1,
            maxItems: 10,
            items: {
              type: 'string',
              minLength: 3,
              maxLength: 500,
              pattern: '\\S',
            },
          },
          expectedResult: {
            type: 'string',
            minLength: 5,
            maxLength: 500,
            pattern: '\\S',
          },
          priority: {
            enum: ['critical', 'normal', 'minor'],
          },
        },
      },
    },
  },
} as const;

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile<Suggestions>(suggestionSchema);

export function validateRequirements(requirements: Requirement[]): void {
  if (requirements.length === 0) {
    throw new Error('Requirements are missing');
  }

  const ids = new Set<string>();

  for (const requirement of requirements) {
    if (!/^[A-Z]+-\d{2}$/.test(requirement.id) || !requirement.description.trim()) {
      throw new Error('Invalid requirement');
    }

    if (ids.has(requirement.id)) {
      throw new Error('Duplicate requirement ID');
    }

    ids.add(requirement.id);
  }
}

export function parseSuggestions(
  raw: string,
  requirements: Requirement[],
  schemaOnly = false,
): Suggestions {
  validateRequirements(requirements);

  if (raw.length > 100_000) {
    throw new Error('Model output too large');
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error('Model returned malformed JSON');
  }

  if (!validate(parsed)) {
    throw new Error(`Invalid scenario schema: ${ajv.errorsText(validate.errors)}`);
  }

  if (schemaOnly) return parsed;

  const allowed = new Set(requirements.map((requirement) => requirement.id));

  const seenIds = new Set<string>();
  const scenarios: Scenario[] = [];

  for (const scenario of parsed.scenarios) {
    if (scenario.requirementIds.some((id) => !allowed.has(id))) {
      throw new Error('Unknown requirement reference');
    }

    if (seenIds.has(scenario.id)) {
      throw new Error('Duplicate scenario ID');
    }

    seenIds.add(scenario.id);

    scenarios.push(scenario);
  }

  return { scenarios };
}

export function approvedSuggestions(
  suggestions: Suggestions,
  approval: {
    reviewer: string;
    scenarioIds: string[];
  },
  quality?: ScenarioQualityReport,
): Suggestions {
  if (!approval.reviewer.trim()) {
    throw new Error('Human reviewer is required');
  }

  if (approval.scenarioIds.length === 0) {
    throw new Error('Explicit approval IDs are required');
  }

  const available = new Set(suggestions.scenarios.map((scenario) => scenario.id));

  if (approval.scenarioIds.some((id) => !available.has(id))) {
    throw new Error('Approval references an unknown scenario');
  }
  if (
    quality?.issues.some(
      (issue) => approval.scenarioIds.includes(issue.scenarioId) && issue.severity === 'error',
    )
  )
    throw new Error('Cannot approve a scenario that failed the quality gate');

  return {
    scenarios: suggestions.scenarios.filter((scenario) =>
      approval.scenarioIds.includes(scenario.id),
    ),
  };
}

// AI SCENARIO QUALITY GATE

export interface ScenarioQualityIssue {
  scenarioId: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface ScenarioQualityReport {
  uncoveredRequirementIds?: string[];
  frameworkRequirementIds?: string[];
  passed: boolean;
  issues: ScenarioQualityIssue[];
}

export function normalizeScenarioText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function scenarioContentKey(scenario: Scenario): string {
  return JSON.stringify([
    [...scenario.requirementIds].sort(),
    normalizeScenarioText(scenario.title),
    scenario.steps.map(normalizeScenarioText),
    normalizeScenarioText(scenario.expectedResult),
  ]);
}

export interface RepeatedStepRepair {
  scenario: Scenario;
  changes: { before: string[]; after: string[]; removedStep: string; index: number }[];
}

const assertionStep = /^(verify|check|assert|expect|ensure|confirm)\b/i;

export function repairRedundantRepeatedAssertions(scenario: Scenario): RepeatedStepRepair {
  const result = structuredClone(scenario);
  const changes: RepeatedStepRepair['changes'] = [];
  for (let index = result.steps.length - 1; index > 0; index -= 1) {
    const current = result.steps[index]!;
    const previous = result.steps[index - 1]!;
    if (
      assertionStep.test(current) &&
      assertionStep.test(previous) &&
      normalizeScenarioText(current) === normalizeScenarioText(previous)
    ) {
      const before = [...result.steps];
      result.steps.splice(index, 1);
      changes.push({ before, after: [...result.steps], removedStep: current, index });
    }
  }
  return { scenario: result, changes: changes.reverse() };
}

export function reviewScenarioQuality(
  suggestions: Suggestions,
  requirements?: Requirement[],
  inspection?: Inspection,
): ScenarioQualityReport {
  const issues: ScenarioQualityIssue[] = [];
  const ids = new Set<string>();
  const content = new Map<string, string>();
  for (const scenario of suggestions.scenarios) {
    const add = (severity: 'error' | 'warning', message: string) =>
      issues.push({ scenarioId: scenario.id, severity, message });
    if (ids.has(scenario.id)) add('error', 'Duplicate scenario ID');
    ids.add(scenario.id);
    if (
      requirements &&
      scenario.requirementIds.some((id) => !requirements.some((r) => r.id === id))
    )
      add('error', 'Unknown requirement reference');
    const steps = scenario.steps.map(normalizeScenarioText);
    const key = scenarioContentKey(scenario);
    const duplicate = content.get(key);
    if (duplicate) {
      add('error', 'Duplicate scenario content');
      issues.push({
        scenarioId: duplicate,
        severity: 'error',
        message: 'Duplicate scenario content',
      });
    } else content.set(key, scenario.id);
    const seen = new Map<string, number>();
    steps.forEach((step, index) => {
      const previous = seen.get(step);
      if (previous !== undefined) {
        const between = steps.slice(previous + 1, index);
        const dropdown = /dropdown|drop down|sorting menu/.test(step);
        const selected = between.some((text) => /^(select|choose|change) /.test(text));
        const changed = between.some((text) =>
          /^(add|remove|update|change|select|choose|enter|fill|type|complete|return|navigate|go back|cancel|open|close|save|delete|reset|apply|log in|sign in)\b/.test(
            text,
          ),
        );
        const distinctAssertion = between.some((text) =>
          /^(verify|check|assert|expect|ensure|confirm)\b/.test(text),
        );
        const checkout = /proceed to checkout/.test(step);
        const reset = between.some((text) =>
          /^(return|go back|cancel|navigate).*(cart|checkout)/.test(text),
        );
        if (distinctAssertion || (!(dropdown && selected) && !(checkout ? reset : changed)))
          add('error', 'Repeated test step without an explicit state change: "' + step + '"');
        else if (!dropdown && !checkout)
          add(
            'warning',
            'Repeated step follows a possible state change; verify its purpose: "' + step + '"',
          );
      }
      seen.set(step, index);
      if (
        !/^(navigate|open|login|log in|sign in|launch|go|click|select|choose|enter|fill|type|read|compare|verify|check|assert|expect|add|remove|update|change|return|cancel|submit|complete|capture|record|ensure|given|start|observe|press) /.test(
          step,
        )
      )
        add('warning', 'Step may be unclear or non-actionable: "' + step + '"');
    });
    const expected = normalizeScenarioText(scenario.expectedResult);
    if (!expected) add('error', 'Expected result is missing');
    else if (
      /^(works|works correctly|success|successful|as expected|test passes|everything works|correct result)$/.test(
        expected,
      ) ||
      expected.length < 20
    )
      add('warning', 'Expected result may be vague; specify an observable outcome');
    if (!/navigate|open|login|log in|sign in|launch|go to|given/.test(steps.slice(0, 3).join(' ')))
      add('warning', 'Scenario may be missing initial setup steps');
    const checkoutIndex = steps.findIndex((step) => /proceed to checkout|checkout page/.test(step));
    if (
      checkoutIndex >= 0 &&
      !steps
        .slice(0, checkoutIndex)
        .some((step) =>
          /add.*(cart|product|item)|cart.*(contains|with)|given.*(product|item)/.test(step),
        )
    )
      add('warning', 'Checkout may require products in the cart before proceeding');
    const title = normalizeScenarioText(scenario.title);
    if (
      ['login', 'sort', 'cart', 'checkout'].filter((feature) => title.includes(feature)).length > 1
    )
      add('warning', 'Scenario title may combine multiple test objectives');
    if (requirements) {
      for (const issue of scenarioReadiness(scenario, requirements, inspection).issues.filter(
        (i) => i.code === 'unverified-control' || i.code === 'unsupported-detail',
      ))
        add(
          issue.code === 'unverified-control' && !inspection ? 'warning' : 'error',
          issue.message + ' ' + issue.action,
        );
      if (
        requirements.some(
          (r) => scenario.requirementIds.includes(r.id) && requirementTarget(r) === 'framework',
        )
      )
        add('error', 'Framework/internal requirement must not become an application UI scenario');
      for (const term of ['popularity', 'rating', 'newness', 'separate window']) {
        const scenarioText = normalizeScenarioText(
          [scenario.title, ...scenario.steps, scenario.expectedResult].join(' '),
        );
        const requirementText = normalizeScenarioText(
          requirements
            .filter((r) => scenario.requirementIds.includes(r.id))
            .map((r) => r.description)
            .join(' '),
        );
        if (scenarioText.includes(term) && !requirementText.includes(term))
          add('error', 'Unsupported scenario detail: ' + term);
      }
      const evidence = requirements
        .filter((r) => scenario.requirementIds.includes(r.id))
        .map((r) => normalizeScenarioText(r.description))
        .join(' ');
      const text = normalizeScenarioText(
        [scenario.title, ...scenario.steps, scenario.expectedResult].join(' '),
      );
      for (const feature of [
        'coupon',
        'payment',
        'refund',
        'upload',
        'pagination',
        'search',
        'email',
      ])
        if (text.includes(feature) && !evidence.includes(feature))
          add(
            'warning',
            'Potentially unsupported behavior: ' + feature + '; verify against requirements',
          );
    }
  }
  const coverage = requirements
    ? requirementCoverage(requirements, suggestions.scenarios)
    : undefined;
  return {
    passed: !issues.some((issue) => issue.severity === 'error'),
    issues,
    ...(coverage
      ? {
          uncoveredRequirementIds: coverage.uncoveredRequirementIds,
          frameworkRequirementIds: coverage.frameworkRequirementIds,
        }
      : {}),
  };
}
