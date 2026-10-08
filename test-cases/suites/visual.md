# Visual comparisons test cases

2 cases mapped to existing automation. [Catalog index](../README.md).

## TC-047 — stable login appearance

| Field                     | Value                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Requirement               | VIS-01                                                                              |
| Priority                  | Normal                                                                              |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps.   |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state. |
| Automation                | [tests/visual/screens.spec.ts](../../tests/visual/screens.spec.ts)                  |
| Project                   | visual                                                                              |
| Run suite                 | `npm run test:visual`                                                               |
| Last saved outcome        | failed                                                                              |
| Previous headless outcome | passed                                                                              |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)              |

Steps:

1. Open login.
2. Use the visual project fixed viewport/locale/timezone/color scheme; wait for fonts and images.
3. Take a full-page screenshot with animations disabled.
4. Compare against the existing OS/project-specific baseline with baseline updates disabled.

Expected results:

- Screenshot matches the reviewed baseline within maxDiffPixels = 100.

Notes: The existing Windows baselines were created headlessly. Latest headed run failed both comparisons; inventory actual width was 1425 vs expected 1440. Baselines were not replaced. Earlier headless portfolio comparisons passed.

## TC-048 — stable inventory appearance

| Field                     | Value                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Requirement               | VIS-01                                                                              |
| Priority                  | Normal                                                                              |
| Preconditions             | Fresh browser context; SauceDemo reachable. Follow the case-specific login steps.   |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state. |
| Automation                | [tests/visual/screens.spec.ts](../../tests/visual/screens.spec.ts)                  |
| Project                   | visual                                                                              |
| Run suite                 | `npm run test:visual`                                                               |
| Last saved outcome        | failed                                                                              |
| Previous headless outcome | passed                                                                              |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)              |

Steps:

1. Open login and sign in to inventory.
2. Use the visual project fixed viewport/locale/timezone/color scheme; wait for fonts and images.
3. Take a full-page screenshot with animations disabled.
4. Compare against the existing OS/project-specific baseline with baseline updates disabled.

Expected results:

- Screenshot matches the reviewed baseline within maxDiffPixels = 100.

Notes: The existing Windows baselines were created headlessly. Latest headed run failed both comparisons; inventory actual width was 1425 vs expected 1440. Baselines were not replaced. Earlier headless portfolio comparisons passed.
