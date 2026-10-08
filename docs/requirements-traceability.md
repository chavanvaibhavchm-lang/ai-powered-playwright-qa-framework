# Requirements traceability

These IDs describe observable behavior, not an invented external product contract.
Allure test IDs and stories link automation to this matrix.

| ID       | Observable requirement                                                | Automated suite           |
| -------- | --------------------------------------------------------------------- | ------------------------- |
| AUTH-01  | Standard credentials open inventory                                   | Original login + auth     |
| AUTH-02  | Invalid/missing credentials and locked account show errors            | Auth/negative             |
| AUTH-03  | Mask password, logout, protected routes and refresh state             | Auth/navigation           |
| INV-01   | Six complete product cards and matching details                       | Inventory                 |
| INV-02   | Four sorting modes order actual names/prices                          | Inventory                 |
| CART-01  | Add/remove, badge, item identity, navigation and refresh persistence  | Cart                      |
| CHECK-01 | Required name/postal fields                                           | Checkout/negative         |
| CHECK-02 | Single/multiple orders, displayed subtotal/tax/total and confirmation | Checkout                  |
| NAV-01   | Menu close/open, All Items, About link, reset, history                | Navigation                |
| DYN-01   | Actual lazy loading, spinner completion, named slider controls        | Inventory/dynamic         |
| PDF-01   | Demo order PDF download and file signature                            | Checkout/download         |
| RESP-01  | Mobile login/cart/checkout usability                                  | Responsive                |
| PERS-01  | Performance user can log in within a generous action budget           | Personas                  |
| DEF-01   | Problem user last-name input defect                                   | Known defects             |
| DEF-02   | Error user accepts checkout with empty last name                      | Known defects             |
| DEF-03   | Visual user Backpack replacement image                                | Known defects             |
| A11Y-01  | Limited WCAG-tagged audits and keyboard login                         | Accessibility             |
| VIS-01   | Deterministic login/inventory screenshots                             | Visual                    |
| API-01   | Independent local products/order service REST behavior                | Companion API             |
| API-02   | Independent SQLite persistence/isolation                              | Companion API             |
| AI-01    | Suggestions conform to JSON schema and requirement IDs                | AI                        |
| AI-02    | Invalid/untraceable/duplicate output handled deterministically        | AI                        |
| AI-03    | Optional local Ollama, human approval before authored tests           | AI live/documented review |

Search, pagination, coupons, payment processing, SauceDemo API/database,
registration, uploads: **NOT APPLICABLE**; see the application inventory.
