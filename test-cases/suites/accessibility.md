# Accessibility test cases

5 cases mapped to existing automation. [Catalog index](../README.md).

## TC-042 — WCAG-oriented audit of login

| Field                     | Value                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Requirement               | A11Y-01                                                                             |
| Priority                  | Normal                                                                              |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps.   |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state. |
| Automation                | [tests/accessibility/audit.spec.ts](../../tests/accessibility/audit.spec.ts)        |
| Project                   | accessibility                                                                       |
| Run suite                 | `npm run test:accessibility`                                                        |
| Last saved outcome        | passed                                                                              |
| Previous headless outcome | passed                                                                              |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)              |

Steps:

1. Open login in a fresh context.
2. Run axe with wcag2a, wcag2aa, wcag21a and wcag21aa tags.
3. Attach the full scan JSON and inspect violations.

Expected results:

- No violations are returned for the selected tags on this scanned page state.

Notes: Limited automated audit only; no full accessibility certification or manual assistive-technology coverage.

## TC-043 — WCAG-oriented audit of inventory

| Field                     | Value                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Requirement               | A11Y-01                                                                             |
| Priority                  | Normal                                                                              |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps.   |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state. |
| Automation                | [tests/accessibility/audit.spec.ts](../../tests/accessibility/audit.spec.ts)        |
| Project                   | accessibility                                                                       |
| Run suite                 | `npm run test:accessibility`                                                        |
| Last saved outcome        | passed                                                                              |
| Previous headless outcome | passed                                                                              |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)              |

Steps:

1. Open login in a fresh context.
2. Sign in as standard_user.
3. Run axe with wcag2a, wcag2aa, wcag21a and wcag21aa tags.
4. Attach the full scan JSON and inspect violations.

Expected results:

- No violations are returned for the selected tags on this scanned page state.

Notes: Limited automated audit only; no full accessibility certification or manual assistive-technology coverage.

## TC-044 — WCAG-oriented audit of cart

| Field                     | Value                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Requirement               | A11Y-01                                                                             |
| Priority                  | Normal                                                                              |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps.   |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state. |
| Automation                | [tests/accessibility/audit.spec.ts](../../tests/accessibility/audit.spec.ts)        |
| Project                   | accessibility                                                                       |
| Run suite                 | `npm run test:accessibility`                                                        |
| Last saved outcome        | passed                                                                              |
| Previous headless outcome | passed                                                                              |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)              |

Steps:

1. Open login in a fresh context.
2. Sign in as standard_user.
3. Open an empty cart.
4. Run axe with wcag2a, wcag2aa, wcag21a and wcag21aa tags.
5. Attach the full scan JSON and inspect violations.

Expected results:

- No violations are returned for the selected tags on this scanned page state.

Notes: Limited automated audit only; no full accessibility certification or manual assistive-technology coverage.

## TC-045 — WCAG-oriented audit of checkout

| Field                     | Value                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Requirement               | A11Y-01                                                                             |
| Priority                  | Normal                                                                              |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps.   |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state. |
| Automation                | [tests/accessibility/audit.spec.ts](../../tests/accessibility/audit.spec.ts)        |
| Project                   | accessibility                                                                       |
| Run suite                 | `npm run test:accessibility`                                                        |
| Last saved outcome        | passed                                                                              |
| Previous headless outcome | passed                                                                              |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)              |

Steps:

1. Open login in a fresh context.
2. Sign in as standard_user.
3. Open an empty cart.
4. Click Checkout.
5. Run axe with wcag2a, wcag2aa, wcag21a and wcag21aa tags.
6. Attach the full scan JSON and inspect violations.

Expected results:

- No violations are returned for the selected tags on this scanned page state.

Notes: Limited automated audit only; no full accessibility certification or manual assistive-technology coverage.

## TC-046 — login controls follow keyboard focus order

| Field                     | Value                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Requirement               | A11Y-01                                                                             |
| Priority                  | Normal                                                                              |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps.   |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state. |
| Automation                | [tests/accessibility/audit.spec.ts](../../tests/accessibility/audit.spec.ts)        |
| Project                   | accessibility                                                                       |
| Run suite                 | `npm run test:accessibility`                                                        |
| Last saved outcome        | passed                                                                              |
| Previous headless outcome | passed                                                                              |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)              |

Steps:

1. Open login in a fresh context.
2. Press Tab three times, checking focus after each press.

Expected results:

- Focus order is Username → Password → Login.
