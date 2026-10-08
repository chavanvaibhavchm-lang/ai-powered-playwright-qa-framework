# Verified execution results

Executed locally on **2026-10-08 (Asia/Kolkata)** in the requested Windows project.
Runtime: Node 24.14.0, Playwright 1.64.0, Allure CLI 3.20.1. This is execution
evidence, not a prediction of GitHub Actions status. No code was pushed/published.

| Suite                      | Cases | Passed | Failed | Skipped | Evidence                                                        |
| -------------------------- | ----: | -----: | -----: | ------: | --------------------------------------------------------------- |
| Existing baseline          |     3 |      3 |      0 |       0 | Initial terminal run, 8.4 s; original login + two starter tests |
| Desktop functional         |    37 |     37 |      0 |       0 | `evidence/regression-offline-execution.json`                    |
| Mobile functional          |     1 |      1 |      0 |       0 | Same full-run evidence                                          |
| Companion REST/SQLite      |    13 |     13 |      0 |       0 | Same full-run evidence, plus isolated initial API run           |
| AI deterministic           |    15 |     15 |      0 |       0 | Same full-run evidence                                          |
| AI live local model        |     1 |      0 |      0 |       1 | Explicit opt-in/model missing; no live model call claimed       |
| Known-defect reproductions |     3 |      3 |      0 |       0 | `evidence/known-defects-execution.json`                         |
| Accessibility              |     5 |      5 |      0 |       0 | `evidence/accessibility-execution.json`                         |
| Visual comparison          |     2 |      2 |      0 |       0 | `evidence/visual-comparison-execution.json`                     |
| Exact CI gate selection    |    34 |     34 |      0 |       0 | `evidence/ci-gate-execution.json`; subset, not additive         |

Default `npm test`: **66 passed, 1 skipped, 0 failed**, 52.7 seconds. Separate
audits/visual/known-defect checks add 10 passing checks. Across these distinct
current cases: **76 passed, 1 skipped**. Baseline and CI-gate subset runs are not
added again. No flaky retries were observed in the final full run; this does not
guarantee future network stability.

The final single-invocation `npm run test:portfolio` independently verified all
77 cases: **76 passed, 1 skipped, 0 failed**, 76.1 seconds. Evidence:
`evidence/portfolio-execution.json`. Its complete native HTML is archived under
`.local/reports/portfolio/playwright-report`.

Functional distribution: original login 1, auth/session 3, cart 3, checkout 4
(including PDF), inventory 7 (including dynamic catalog), navigation 3, negative 15,
performance persona 1, mobile 1. Smoke contains 6 cases and negative contains 15;
both are subsets of the functional run. Known defects are intentionally separate.

## Engineering/report checks

- `npm run typecheck`: strict `tsc --noEmit` passed.
- `npm run lint`: ESLint passed.
- `npm run format:check`: Prettier passed after formatting the new framework.
- Dependency installation audit reported 0 vulnerabilities at installation time.
- Real Playwright reconnaissance captured all standard shopping screens, six
  products, four sort options, five extra personas and three dynamic catalog modes.
- First visual baseline creation passed, PNGs were visually inspected, then
  `--update-snapshots=none` comparisons passed. Windows baselines only.
- Limited WCAG-tagged axe scans passed on login, inventory, cart and checkout.
  Keyboard focus order passed. This is not full accessibility certification.
- Genuine PDF download passed its filename/header/nonempty-byte checks;
  PDF content/layout is not certified.
- Allure raw results and HTML were generated with the installed Allure 3 CLI.
  Environment metadata, requirement labels, attachments and genuine JSONL history
  are inspected as part of final report verification.
- Actual local Allure dashboard loaded through Playwright with HTTP 200, correct
  77/76/1 counts, environment/executor metadata and zero page errors. A genuine
  dashboard screenshot is `evidence/allure-report.png`; structured verification
  is `evidence/report-verification.json`. Three historical report collections
  exist from real executions; their differing/bootstrap scopes are documented.
  Repeat generation of identical raw results does not append another history line.

## Commands to reproduce

```powershell
npm run typecheck
npm run lint
npm run format:check
npm run allure:clean
npm test
npm run test:known-defects
npm run test:accessibility
npm run test:visual
npm run allure:generate
npm run allure:open
```

Native Playwright HTML shows the latest invocation. `npm run record:run -- name`
archives its HTML under `.local/reports/name/playwright-report` and saves sanitized
JSON execution evidence; call it immediately after the relevant suite. For example,
the saved complete portfolio HTML can be opened with
`npx playwright show-report .local/reports/portfolio/playwright-report`.
Allure aggregates the fresh collection, including separately executed suites.

## Remaining optional work / limits

GitHub Actions workflow is implemented and its exact gate command passed locally;
the remote workflow has **not run**. There is no Git repository/remote in this
folder. The existing workflow file was improved; no duplicate workflow added.
Firefox/WebKit, Linux visual baselines, live Ollama model evaluation, manual
assistive-technology testing and full PDF content/layout review are not completed
and are not presented as passing coverage. Publishing requires a separate explicit
instruction. The existing ISC declaration remains; no MIT license decision made.

Three evidence-based training defects remain in the target personas; see
`defect-reports.md`. No target application code was changed. Underlying Windows
bundled headed browser `spawn UNKNOWN` cause remains unproven; the verified local
Chrome workaround is retained. API persistence is real local SQLite, not a
fabricated SauceDemo backend. AI output stayed in pending human-review data;
no generated scenarios were turned into executable tests.
