# Coverage matrix

Status reflects implemented checks and observed scope. Final execution evidence
is in [execution results](execution-results.md). Subsets are not additive counts.

| Feature                                              | Status                               | Evidence / oracle                                                                      |
| ---------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- |
| Standard login                                       | AUTOMATED                            | Original login test, exact inventory URL and title                                     |
| Missing/wrong/locked credentials                     | AUTOMATED                            | Nine invalid/boundary auth cases, actual error text                                    |
| Password/keyboard/session/logout/protected inventory | AUTOMATED                            | Type=password, focus, refresh and rejected direct route                                |
| Six product cards/details/images                     | AUTOMATED                            | Actual names, descriptions, integer price values; all six details                      |
| All four sort modes                                  | AUTOMATED                            | All option names/values; extracted full name/price order                               |
| Inventory/details/cart add-remove consistency        | AUTOMATED                            | Matching product data and badge state                                                  |
| Single/multiple/empty cart + refresh                 | AUTOMATED                            | Item identity, price, quantity and navigation                                          |
| Required customer fields                             | AUTOMATED                            | Each missing field tested separately                                                   |
| Single/multiple checkout + totals                    | AUTOMATED                            | Actual displayed subtotal; total = subtotal + displayed tax                            |
| Checkout cancel/confirmation                         | AUTOMATED                            | Observed destination and persisted basket                                              |
| Boundary Unicode/long/whitespace inputs              | AUTOMATED OBSERVATION                | Nonempty-field behavior, not a fabricated postal validation rule                       |
| Menu All Items/About/logout/reset/history            | AUTOMATED                            | Actual role semantics, href and navigation/state                                       |
| Dynamic catalog lazy/spinner/slider                  | AUTOMATED                            | Scroll-triggered content, spinner completion and selected product                      |
| PDF order download                                   | AUTOMATED LIMITED                    | Real download, .pdf filename, nonempty %PDF- bytes; content/layout manual              |
| Small mobile shopping flow                           | AUTOMATED                            | 390×844 login/cart/checkout and no horizontal overflow                                 |
| Performance persona                                  | AUTOMATED LIMITED                    | Generous wait and observed duration; no invented SLA/load test                         |
| Three persona defects                                | AUTOMATED REPRODUCTION               | Separate @known-defect tests with evidence                                             |
| Problem persona all-image replacement                | MANUAL OBSERVED                      | Raw reconnaissance; no duplicate inflated automated case                               |
| Accessibility                                        | AUTOMATED LIMITED + MANUAL REMAINING | Four WCAG-tagged axe audits and keyboard focus; screen-reader/inclusive testing manual |
| Visual login/inventory                               | AUTOMATED LIMITED                    | Two reviewed Windows baselines and actual comparison runs                              |
| Firefox/WebKit                                       | IMPLEMENTED, NOT EXECUTED            | Optional install/command; no pass claim                                                |
| Companion API/SQLite                                 | AUTOMATED                            | Separate local REST service, CRUD/schema/errors/reopen persistence                     |
| AI schema/provider validation                        | AUTOMATED                            | 15 deterministic cases, mocks clearly identified                                       |
| Live local LLM evaluation                            | OPTIONAL, NOT EXECUTED               | Skip unless explicitly configured; no quality claim                                    |
| Human scenario approval                              | IMPLEMENTED                          | Approved data only; authored code always requires review                               |
| Search / pagination / coupons                        | NOT APPLICABLE                       | Not observed in inspected UI; lazy loading is a different actual feature               |
| Real payment processing / email receipt              | NOT APPLICABLE                       | Static payment/shipping text only; demo confirmation                                   |
| SauceDemo backend API/database                       | NOT APPLICABLE                       | No verified public interface; no fake backend assertions                               |
| Registration / file uploads                          | NOT APPLICABLE                       | No inspected controls; order PDF is a download, not an upload                          |
| CI workflow                                          | IMPLEMENTED, REMOTE RUN NOT EXECUTED | Local gate command verified; no Git repository/remote run                              |
| Publishing                                           | NOT REQUESTED                        | No push/Pages deployment                                                               |
