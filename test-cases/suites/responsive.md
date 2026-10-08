# Mobile responsiveness test cases

1 cases mapped to existing automation. [Catalog index](../README.md).

## TC-041 — small mobile viewport supports login, cart and checkout

| Field                     | Value                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Requirement               | RESP-01                                                                                                           |
| Priority                  | Critical                                                                                                          |
| Preconditions             | Mobile Chromium project: 390 × 844, touch and mobile enabled.                                                     |
| Test data                 | standard_user / secret_sauce (public demo credentials); First Name: Ada; Last Name: Lovelace; Postal Code: 560001 |
| Automation                | [tests/ui/responsive/mobile.spec.ts](../../tests/ui/responsive/mobile.spec.ts)                                    |
| Project                   | mobile-chromium                                                                                                   |
| Run suite                 | `npm run test:smoke`                                                                                              |
| Last saved outcome        | passed                                                                                                            |
| Previous headless outcome | passed                                                                                                            |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                                            |

Steps:

1. Use a fresh 390 × 844 mobile browser context.
2. Inspect Login in viewport; sign in; inspect sort control in viewport.
3. Add Backpack, open cart and Checkout.
4. Enter customer details; Continue; compare arithmetic; Finish.
5. Check confirmation and horizontal document overflow.

Expected results:

- Login and sort controls are in viewport.
- Cart contains one item; total equals displayed subtotal plus tax.
- Confirmation is visible; document scrollWidth does not exceed innerWidth.
