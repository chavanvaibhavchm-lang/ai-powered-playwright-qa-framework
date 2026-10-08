# Personas and defect reproduction test cases

4 cases mapped to existing automation. [Catalog index](../README.md).

## TC-037 — performance persona reaches inventory with a generous timeout

| Field                     | Value                                                                             |
| ------------------------- | --------------------------------------------------------------------------------- |
| Requirement               | PERS-01                                                                           |
| Priority                  | Normal                                                                            |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps. |
| Test data                 | performance_glitch_user / secret_sauce                                            |
| Automation                | [tests/ui/personas/personas.spec.ts](../../tests/ui/personas/personas.spec.ts)    |
| Project                   | chromium                                                                          |
| Run suite                 | `npm run test:personas`                                                           |
| Last saved outcome        | passed                                                                            |
| Previous headless outcome | passed                                                                            |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)            |

Steps:

1. Open login and sign in as performance_glitch_user.
2. Wait for six inventory cards using the configured generous timeout.
3. Record login duration in the test report.

Expected results:

- Six cards become visible.
- Measured duration is attached as an observation.

Notes: 45-second test budget and 20-second inventory assertion timeout; no load test or claimed performance SLA.

## TC-038 — problem persona cannot retain last name and is blocked at checkout

| Field                     | Value                                                                             |
| ------------------------- | --------------------------------------------------------------------------------- |
| Requirement               | DEF-01                                                                            |
| Priority                  | Normal                                                                            |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps. |
| Test data                 | problem_user / secret_sauce                                                       |
| Automation                | [tests/ui/personas/personas.spec.ts](../../tests/ui/personas/personas.spec.ts)    |
| Project                   | chromium                                                                          |
| Run suite                 | `npm run test:personas`                                                           |
| Last saved outcome        | Known defect reproduced (not correct product behavior)                            |
| Previous headless outcome | passed                                                                            |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)            |

Steps:

1. Sign in as problem_user; add Backpack; open Checkout.
2. Fill Ada / Lovelace / 560001.
3. Inspect Last Name, then Continue; save screenshot.

Expected results:

- Defect reproduction: Last Name stays empty.
- Continue displays Last Name is required; reproduction screenshot is attached.

Notes: Known defect DEF-01. Passing this check means reproduced, not correct product behavior.

## TC-039 — error persona advances with rejected empty last name

| Field                     | Value                                                                             |
| ------------------------- | --------------------------------------------------------------------------------- |
| Requirement               | DEF-02                                                                            |
| Priority                  | Normal                                                                            |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps. |
| Test data                 | error_user / secret_sauce                                                         |
| Automation                | [tests/ui/personas/personas.spec.ts](../../tests/ui/personas/personas.spec.ts)    |
| Project                   | chromium                                                                          |
| Run suite                 | `npm run test:personas`                                                           |
| Last saved outcome        | Known defect reproduced (not correct product behavior)                            |
| Previous headless outcome | passed                                                                            |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)            |

Steps:

1. Sign in as error_user; add Backpack; open Checkout.
2. Fill Ada / Lovelace / 560001 and inspect Last Name.
3. Continue and save screenshot.

Expected results:

- Defect reproduction: Last Name stays empty.
- Despite empty Last Name, overview opens; screenshot is attached.

Notes: Known defect DEF-02; separate from the default gate.

## TC-040 — visual persona substitutes the backpack image

| Field                     | Value                                                                             |
| ------------------------- | --------------------------------------------------------------------------------- |
| Requirement               | DEF-03                                                                            |
| Priority                  | Normal                                                                            |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps. |
| Test data                 | standard_user then visual_user / secret_sauce                                     |
| Automation                | [tests/ui/personas/personas.spec.ts](../../tests/ui/personas/personas.spec.ts)    |
| Project                   | chromium                                                                          |
| Run suite                 | `npm run test:personas`                                                           |
| Last saved outcome        | Known defect reproduced (not correct product behavior)                            |
| Previous headless outcome | passed                                                                            |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)            |

Steps:

1. Sign in as standard_user; record Backpack image src.
2. Open login and sign in as visual_user.
3. Compare Backpack image src with the control value.
4. Attach both source strings.

Expected results:

- Defect reproduction: sources differ and visual_user source contains sl-404.

Notes: Known defect DEF-03; this is a source comparison, not the visual screenshot suite.
