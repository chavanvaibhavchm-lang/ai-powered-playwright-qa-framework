import type { Scenario, Requirement } from './scenarios';
import type { ApplicationConfig, Inspection, UiElement } from './application';
import type { PomMethod } from './pom-discovery';
export type RequirementTarget = 'application' | 'framework';
export function requirementTarget(
  requirement: Requirement & { target?: RequirementTarget },
): RequirementTarget {
  if (requirement.target) return requirement.target;
  return /\ballure\b|requirement.to.result traceability|(?:publish|generate).*test.*(?:report|artifact)|execute approved tests|(?:framework|test runner).*(?:report|execution)/i.test(
    requirement.description,
  )
    ? 'framework'
    : 'application';
}
export function verifiedElements(inspection: Inspection): UiElement[] {
  return inspection.elements.filter(
    (e) => e.locator && e.count === 1 && e.visible && (!e.pageUrl || e.pageUrl === inspection.url),
  );
}
export interface EvidenceIssue {
  code: string;
  message: string;
  action: string;
}
export interface Readiness {
  status: 'ready' | 'blocked' | 'needs-inspection' | 'framework';
  issues: EvidenceIssue[];
}
const textKey = (s: string) =>
  s
    .toLowerCase()
    .replace(/log\s+in/g, 'login')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
export function scenarioReadiness(
  scenario: Scenario,
  requirements: Requirement[] | undefined,
  inspection?: Inspection,
  config?: ApplicationConfig,
): Readiness {
  const issues: EvidenceIssue[] = [];
  const add = (code: string, message: string, action: string) =>
    issues.push({ code, message, action });
  const referenced = requirements?.filter((r) => scenario.requirementIds.includes(r.id));
  if (
    requirements &&
    (!scenario.requirementIds.length || referenced?.length !== scenario.requirementIds.length)
  )
    add(
      'requirement-reference',
      'Scenario has missing or unknown requirement IDs.',
      'Regenerate against approved application requirements; do not reassign IDs without reviewing behavior.',
    );
  if (referenced?.some((r) => requirementTarget(r) === 'framework'))
    return {
      status: 'framework',
      issues: [
        {
          code: 'framework-requirement',
          message: 'Framework/reporting requirements are not application UI scenarios.',
          action:
            'Review this requirement as a framework requirement; exclude it from application test generation.',
        },
      ],
    };
  const source = textKey(referenced?.map((r) => r.description).join(' ') ?? '');
  const context = textKey([scenario.title, ...scenario.steps, scenario.expectedResult].join(' '));
  for (const feature of [
    'popularity',
    'rating',
    'newness',
    'refund',
    'coupon',
    'separate window',
    'modal',
  ])
    if (requirements && context.includes(feature) && !source.includes(feature))
      add(
        'unsupported-detail',
        'Scenario adds unsupported detail: ' + feature + '.',
        'Remove this detail or supply explicit approved PRD evidence.',
      );
  if (requirements && /disabled/i.test(scenario.expectedResult) && !source.includes('disabled'))
    add(
      'unsupported-detail',
      'Expected result invents a disabled-control outcome absent from the approved requirement.',
      'Describe only the required rejection/validation behavior; do not infer disabled buttons.',
    );
  const verified = inspection ? verifiedElements(inspection) : [];
  for (const step of scenario.steps) {
    if (!/^(click|select|choose|press|fill|enter|type|open|navigate|go|return)\b/i.test(step))
      continue;
    for (const match of step.matchAll(/['"“‘]([^'"”’]{2,100})['"”’]/g)) {
      const prefix = step.slice(0, match.index);
      const suffix = step.slice((match.index ?? 0) + match[0].length);
      if (/^(?:enter|type)\s*$/i.test(prefix) && !/^\s*(?:field|input|textbox)\b/i.test(suffix))
        continue;
      if (/^(?:enter|type|fill)\b/i.test(step) && /(?:with|using|value|text)\s*$/i.test(prefix))
        continue;
      const control = match[1]!;
      const observed = verified.some((e) =>
        [e.name, e.label, e.placeholder, e.testId].some((n) => textKey(n) === textKey(control)),
      );
      const specified = referenced?.some(
        (r) =>
          r.description.includes(control) &&
          /button|link|field|control|menu|option/i.test(r.description),
      );
      if (!observed && !specified)
        add(
          'unverified-control',
          'No verified control named "' +
            control +
            '" on ' +
            (inspection?.url ?? 'an inspected page') +
            '.',
          'This label is not established by PRD or current UI evidence. Use a behavior-level step until the relevant page is explicitly approved and inspected; do not infer a selector.',
        );
      else if (!observed)
        add(
          'further-inspection',
          'PRD names "' + control + '", but that control has not been inspected.',
          'Approve its page scope, provide local storage state if needed, and inspect that page before generation.',
        );
    }
    for (const match of step.matchAll(/https?:\/\/[^\s'"<>]+/g)) {
      const url = match[0].replace(/[.,)]$/, '');
      if (url !== inspection?.url)
        add(
          'further-inspection',
          'Scenario navigates to an uninspected URL: ' + url,
          'Explicitly approve that URL and inspect it; approval alone is not locator verification.',
        );
      if (config && ![config.url, ...config.approvedPages].includes(url))
        add(
          'scope',
          'Navigation is outside approved page scope: ' + url,
          'Add the intended page through explicit scope approval before inspection.',
        );
    }
    const destination = /^(?:navigate|go|return) to (?:the )?(.+?)(?: page| screen|$)/i.exec(
      step,
    )?.[1];
    const normalizedDestination = destination ? textKey(destination) : '';
    const genericDestination = ['application', 'app', 'site', 'website'].includes(
      normalizedDestination,
    );
    const verifiedNames = verified.flatMap((element) =>
      [element.name, element.label, element.placeholder, element.testId]
        .map(textKey)
        .filter(Boolean),
    );
    const inspectedLoginForm =
      verified.some((element) => element.inputType === 'password') &&
      verifiedNames.some((name) => /\b(username|user name|email)\b/.test(name)) &&
      verified.some(
        (element) =>
          /^(login|sign in|log in)$/.test(textKey(element.name || element.label)) &&
          /button|submit/.test((element.role + ' ' + element.inputType).toLowerCase()),
      );
    if (
      destination &&
      !genericDestination &&
      !(normalizedDestination === 'login' && inspectedLoginForm)
    ) {
      const pageIdentity = textKey((inspection?.url ?? '') + ' ' + (inspection?.title ?? ''));
      if (!pageIdentity.includes(normalizedDestination))
        add(
          'further-inspection',
          'Destination "' + destination + '" is not established by the inspected page URL/title.',
          'Approve and inspect the destination page or clarify the starting page; no navigation selectors will be inferred.',
        );
    }
  }
  if (
    scenario.steps.some((s) =>
      /enter.*(?:credentials|password)|^(?:login|log in|sign in)\b/i.test(s),
    )
  )
    add(
      'authentication',
      'Scenario requires credential entry or a login transition not established by current-page inspection.',
      'Prepare authenticated storage state locally, approve and inspect the destination, and rewrite the scenario to start in that verified state. Password entry remains blocked.',
    );
  const currentPageVisibility =
    /visible|display|present|show|appear/.test(scenario.expectedResult.toLowerCase()) &&
    scenario.steps.every((s) => /^(open|navigate|verify|check|assert|expect) /i.test(s)) &&
    verified.some((e) =>
      [e.name, e.label, e.placeholder, e.testId].some(
        (n) => n.length >= 3 && textKey(scenario.expectedResult).includes(textKey(n)),
      ),
    );
  for (const page of ['inventory', 'checkout', 'cart', 'product details', 'protected content']) {
    if (
      !currentPageVisibility &&
      context.includes(page) &&
      inspection &&
      !textKey(inspection.url + ' ' + inspection.title).includes(page)
    )
      add(
        'further-inspection',
        'Scenario requires ' + page + ' evidence, but only ' + inspection.url + ' was inspected.',
        'Explicitly approve and inspect the relevant authenticated page. A link on the current page does not verify the destination or its outcome.',
      );
  }
  if (!inspection)
    add(
      'further-inspection',
      'Application has not been inspected.',
      'Save application configuration and inspect the explicitly approved starting page.',
    );
  else {
    if (config && ![config.url, ...config.approvedPages].includes(inspection.url))
      add(
        'scope',
        'Saved inspection URL does not belong to the current approved scope.',
        'Reinspect the current configured page.',
      );
    if (!verified.length)
      add(
        'further-inspection',
        'Inspection contains no unique visible verified locators.',
        'Inspect the intended page and resolve duplicate/hidden locator findings.',
      );
  }
  return {
    status: issues.some((i) =>
      ['further-inspection', 'authentication', 'scope', 'unverified-control'].includes(i.code),
    )
      ? 'needs-inspection'
      : issues.length
        ? 'blocked'
        : 'ready',
    issues,
  };
}
export function inspectionSummary(inspection: Inspection | undefined, poms: PomMethod[]) {
  return {
    url: inspection?.url ?? null,
    inspectedAt: inspection?.inspectedAt ?? null,
    inspectedPages: inspection
      ? [{ url: inspection.url, inspectedAt: inspection.inspectedAt }]
      : [],
    controls: inspection?.elements.length ?? 0,
    verifiedLocators: inspection ? verifiedElements(inspection).length : 0,
    discoveredPomMethods: poms.length,
    reusablePomMethods: poms.filter((p) => p.reusable).length,
  };
}
export function requirementCoverage(requirements: Requirement[], scenarios: Scenario[]) {
  const application = requirements.filter((r) => requirementTarget(r) === 'application');
  const rows = application.map((r) => ({
    requirementId: r.id,
    scenarioIds: scenarios.filter((s) => s.requirementIds.includes(r.id)).map((s) => s.id),
  }));
  return {
    requirements: rows,
    uncoveredRequirementIds: rows.filter((r) => !r.scenarioIds.length).map((r) => r.requirementId),
    frameworkRequirementIds: requirements
      .filter((r) => requirementTarget(r) === 'framework')
      .map((r) => r.id),
  };
}
