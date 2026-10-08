# Executed test-case catalog

79 documented cases from the existing automated suites. Each case includes a unique ID, requirement, priority, preconditions, data, steps, expected results, source link, run command and saved execution outcome. This catalog does not introduce new automation or claim new executions.

| Suite                               | Cases | Detailed cases                   |
| ----------------------------------- | ----: | -------------------------------- |
| Authentication                      |    13 | [Open](suites/authentication.md) |
| Inventory and dynamic catalog       |     7 | [Open](suites/inventory.md)      |
| Cart                                |     3 | [Open](suites/cart.md)           |
| Checkout and PDF download           |    10 | [Open](suites/checkout.md)       |
| Menu and navigation                 |     3 | [Open](suites/navigation.md)     |
| Personas and defect reproduction    |     4 | [Open](suites/personas.md)       |
| Mobile responsiveness               |     1 | [Open](suites/responsive.md)     |
| Accessibility                       |     5 | [Open](suites/accessibility.md)  |
| Visual comparisons                  |     2 | [Open](suites/visual.md)         |
| Independent companion REST / SQLite |    13 | [Open](suites/api.md)            |
| AI adapter / suggestions            |    16 | [Open](suites/ai.md)             |
| Preserved starter examples          |     2 | [Open](suites/examples.md)       |

Latest saved headed collection: **76 passed, 2 failed, 1 skipped** across 79 cases (portfolio plus starter examples). Three passing checks are known-defect reproductions, not evidence of correct persona behavior. The two visual cases failed against existing headless baselines. Live Ollama was skipped because it was not enabled. Earlier headless portfolio: 76 passed and 1 skipped across its 77 cases. Results are snapshots from 2026-10-08, not evergreen statuses.

## Use the catalog

- Open a suite Markdown file for manual-review or execution steps. API/AI cases require a programmatic client or the supplied automation; they are not browser-only manual steps.
- Use [catalog.json](catalog.json) for structured import or tooling.
- Use [execution-template.md](execution-template.md) to record a new manual run; leave unexecuted cases as Not run.
- Requirement IDs refer to [traceability](../docs/requirements-traceability.md). Case IDs are catalog identifiers; automation names and Allure IDs are preserved.
- Cases that loop over products, sorting modes or malformed inputs remain one case per actual Playwright test. Counts are not inflated by splitting assertions into new tests.

## Commands

```powershell
# Entire portfolio, with reviewed headless visual baselines:
npm run test:portfolio
# Headed portfolio plus preserved starter examples:
npm run test:portfolio -- --headed --project=examples
# API only:
npm run test:api
# Rebuild this documentation from saved evidence (does not run tests):
node scripts/build-test-cases.cjs
```

The catalog deliberately excludes invented search, pagination, coupons, payments, uploads and SauceDemo backend/database checks. The companion SQLite/API service is independent. Accessibility and PDF checks have documented limits; Firefox/WebKit are not additional executed cases. AI approval tests exercise adapter validation, not a real human approval or generated-code execution.
