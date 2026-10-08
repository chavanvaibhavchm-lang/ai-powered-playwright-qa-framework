# Exact file change manifest

Based on the initial file inventory and final workspace. No `.git` repository exists,
so this is a filesystem change manifest rather than a Git diff. Generated runtime
artifacts are listed separately and are ignored in Git.

## Modified existing files

- `.github/workflows/playwright.yml`
- `.gitignore`
- `package-lock.json`
- `package.json`
- `pages/LoginPage.ts`
- `playwright.config.ts`
- `tests/login.spec.ts`

## Added files

- `docs/evidence/allure-report.png`
- `docs/evidence/report-verification.json`
- `scripts/verify-report.cjs`

- `.editorconfig`
- `.env.example`
- `.prettierignore`
- `.prettierrc.json`
- `README.md`
- `ai/generate.ts`
- `ai/providers.ts`
- `ai/review.ts`
- `ai/scenarios.ts`
- `allure.config.ts`
- `companion/server.ts`
- `companion/start.ts`
- `companion/store.ts`
- `docs/ai-workflow.md`
- `docs/application-inventory.md`
- `docs/changed-files.md`
- `docs/companion-api.md`
- `docs/coverage-matrix.md`
- `docs/defect-reports.md`
- `docs/evidence/accessibility-execution.json`
- `docs/evidence/additional-reconnaissance.json`
- `docs/evidence/ci-gate-execution.json`
- `docs/evidence/known-defects-execution.json`
- `docs/evidence/portfolio-execution.json`
- `docs/evidence/reconnaissance.json`
- `docs/evidence/regression-offline-execution.json`
- `docs/evidence/visual-baseline-execution.json`
- `docs/evidence/visual-comparison-execution.json`
- `docs/execution-results.md`
- `docs/reporting.md`
- `docs/requirements-traceability.md`
- `docs/test-plan.md`
- `eslint.config.mjs`
- `fixtures/api.ts`
- `fixtures/test.ts`
- `pages/CartPage.ts`
- `pages/CheckoutPage.ts`
- `pages/InventoryPage.ts`
- `pages/MenuComponent.ts`
- `pages/ProductDetailsPage.ts`
- `scripts/recon-additional.cjs`
- `scripts/recon.cjs`
- `scripts/record-run.cjs`
- `scripts/report.cjs`
- `scripts/run-suite.cjs`
- `test-data/mock-suggestions.json`
- `test-data/products.ts`
- `test-data/requirements.json`
- `tests/accessibility/audit.spec.ts`
- `tests/ai/local-live.spec.ts`
- `tests/ai/scenarios.spec.ts`
- `tests/api/orders.spec.ts`
- `tests/ui/auth/auth.spec.ts`
- `tests/ui/cart/cart.spec.ts`
- `tests/ui/checkout/checkout.spec.ts`
- `tests/ui/checkout/download.spec.ts`
- `tests/ui/inventory/dynamic.spec.ts`
- `tests/ui/inventory/inventory.spec.ts`
- `tests/ui/navigation/navigation.spec.ts`
- `tests/ui/negative/checkout.spec.ts`
- `tests/ui/negative/login.spec.ts`
- `tests/ui/personas/personas.spec.ts`
- `tests/ui/responsive/mobile.spec.ts`
- `tests/visual/baselines/win32/visual/visual/screens.spec.ts/inventory.png`
- `tests/visual/baselines/win32/visual/visual/screens.spec.ts/login.png`
- `tests/visual/screens.spec.ts`
- `tsconfig.json`
- `utils/products.ts`

## Preserved existing files

- `tests/example.spec.ts`
- `scripts/clean-allure.cjs`

## Generated local artifacts (ignored)

- `allure-results/`: raw results, metadata and genuine copied attachments.
- `allure-report/`: current Allure 3 Awesome HTML/data.
- `playwright-report/`: complete latest portfolio HTML.
- `test-results/`: latest JSON/artifacts, isolated SQLite test databases.
- `test-history/allure-history.jsonl`: real local report history.
- `.local/scenario-suggestions.json`: labelled mock suggestions awaiting human review.
- `.local/allure-source.sha256`: genuine result fingerprint for history deduplication.
- `.local/reports/`: archived native HTML for recorded invocations.

No MIT license, new Git repository, commits, pushes or publishing were created.
