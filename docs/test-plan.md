# Test plan

## Goal and gates

Use the actual screens in [the inventory](application-inventory.md). Chromium is
the default browser; one CI worker and at most two local workers. Every UI test
uses a fresh browser context and logs in independently. No load/security scans or
real transactions. Known-defect persona checks, accessibility audits, visual
comparisons and optional local-LLM checks are separate from the default gate.

| Suite         | Purpose                                                                    | Gate                                                    |
| ------------- | -------------------------------------------------------------------------- | ------------------------------------------------------- |
| Smoke         | Login, catalog, cart, successful checkout                                  | Push/PR                                                 |
| Regression    | Auth, sorting, product identity, cart, totals, navigation, responsive flow | Manual CI dispatch/schedule                             |
| Negative      | Missing/invalid login and checkout inputs, boundary text                   | Regression and dedicated command                        |
| Personas      | Performance tolerance and evidence-based defect reproductions              | Separate exploratory command for known defects          |
| Accessibility | Limited axe scans and keyboard checks                                      | Separate audit; violations are reported, not suppressed |
| Visual        | Stable login/inventory screenshots, OS-specific baselines                  | Explicit baseline review/update                         |
| Companion API | Offline REST validation, CRUD and SQLite persistence                       | Push/PR                                                 |
| AI            | Deterministic provider/schema/traceability tests                           | Push/PR; live Ollama opt-in                             |

## Evidence and acceptance

Strict typecheck and lint must pass. A passing result requires an actual run.
Failures are classified as product, framework, environment, or unsupported scope.
Screenshots/video/trace are retained on failures. Allure has readable steps and
requirements IDs. Product defects are reproduced separately rather than weakened
into green functional assertions. Visual baselines are reviewed, not automatically
updated by CI. AI output stays as suggestions requiring human review; no generated
code is executed. Scope gaps are documented in the coverage matrix.

Initial existing baseline: 3 Chromium tests passed in 8.4 seconds. Reconnaissance
completed through confirmation and five additional persona sessions. Final suite
execution results are recorded separately in `execution-results.md`.
