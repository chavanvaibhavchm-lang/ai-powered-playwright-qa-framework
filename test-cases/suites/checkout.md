# Checkout and PDF download test cases

10 cases mapped to existing automation. [Catalog index](../README.md).

## TC-024 — completes 1-item checkout with verified arithmetic

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | CHECK-02                                                                                   |
| Priority                  | Critical                                                                                   |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | Sauce Labs Backpack; First Name: Ada; Last Name: Lovelace; Postal Code: 560001             |
| Automation                | [tests/ui/checkout/checkout.spec.ts](../../tests/ui/checkout/checkout.spec.ts)             |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Record displayed product data and add the specified basket.
2. Open cart; compare selected items; click Checkout.
3. Enter customer data and Continue.
4. Compare overview items, subtotal, displayed tax and total.
5. Finish, then Back Home.

Expected results:

- Cart/overview line items match inventory.
- Subtotal equals the sum of displayed prices in integer cents.
- Tax is nonnegative; total equals subtotal plus displayed tax, without assuming a tax rate.
- Payment and shipping information are nonempty.
- Thank you for your order! appears; badge clears; Back Home shows six products.

## TC-025 — completes 2-item checkout with verified arithmetic

| Field                     | Value                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| Requirement               | CHECK-02                                                                                               |
| Priority                  | Critical                                                                                               |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable.             |
| Test data                 | Sauce Labs Backpack + Sauce Labs Bike Light; First Name: Ada; Last Name: Lovelace; Postal Code: 560001 |
| Automation                | [tests/ui/checkout/checkout.spec.ts](../../tests/ui/checkout/checkout.spec.ts)                         |
| Project                   | chromium                                                                                               |
| Run suite                 | `npm run test:regression`                                                                              |
| Last saved outcome        | passed                                                                                                 |
| Previous headless outcome | passed                                                                                                 |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                                 |

Steps:

1. Record displayed product data and add the specified basket.
2. Open cart; compare selected items; click Checkout.
3. Enter customer data and Continue.
4. Compare overview items, subtotal, displayed tax and total.
5. Finish, then Back Home.

Expected results:

- Cart/overview line items match inventory.
- Subtotal equals the sum of displayed prices in integer cents.
- Tax is nonnegative; total equals subtotal plus displayed tax, without assuming a tax rate.
- Payment and shipping information are nonempty.
- Thank you for your order! appears; badge clears; Back Home shows six products.

## TC-026 — cancel from information returns to cart and overview returns to inventory

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | CHECK-02                                                                                   |
| Priority                  | Normal                                                                                     |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | First Name: Ada; Last Name: Lovelace; Postal Code: 560001                                  |
| Automation                | [tests/ui/checkout/checkout.spec.ts](../../tests/ui/checkout/checkout.spec.ts)             |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Add Backpack; open cart and Checkout.
2. Cancel from customer information.
3. Start Checkout again, fill valid customer data and Continue.
4. Cancel from overview.

Expected results:

- First Cancel returns to cart with one item.
- Overview Cancel returns to inventory and badge remains 1.

## TC-027 — completed demo order downloads a nonempty PDF artifact

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | PDF-01                                                                                     |
| Priority                  | Normal                                                                                     |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | First Name: Ada; Last Name: Lovelace; Postal Code: 560001                                  |
| Automation                | [tests/ui/checkout/download.spec.ts](../../tests/ui/checkout/download.spec.ts)             |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Complete a Backpack checkout with valid customer data.
2. Click Generate PDF order and capture the download.
3. Save the file and inspect its filename, first five bytes and size.

Expected results:

- Download reports no failure and filename ends in .pdf.
- File starts with %PDF- and exceeds 100 bytes.
- The genuine artifact is attached to the test report.

Notes: File download/header checks only; PDF text and layout are not certified.

## TC-028 — missing firstName blocks checkout

| Field                     | Value                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| Requirement               | CHECK-01                                                                                        |
| Priority                  | Normal                                                                                          |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable.      |
| Test data                 | First Name: Ada; Last Name: Lovelace; Postal Code: 560001; override firstName with empty string |
| Automation                | [tests/ui/negative/checkout.spec.ts](../../tests/ui/negative/checkout.spec.ts)                  |
| Project                   | chromium                                                                                        |
| Run suite                 | `npm run test:regression`                                                                       |
| Last saved outcome        | passed                                                                                          |
| Previous headless outcome | passed                                                                                          |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                          |

Steps:

1. Sign in, add Backpack, open cart > Checkout.
2. Fill customer details with only the specified field empty.
3. Click Continue.

Expected results:

- Error contains First Name is required.
- URL remains checkout-step-one.html.

## TC-029 — missing lastName blocks checkout

| Field                     | Value                                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| Requirement               | CHECK-01                                                                                       |
| Priority                  | Normal                                                                                         |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable.     |
| Test data                 | First Name: Ada; Last Name: Lovelace; Postal Code: 560001; override lastName with empty string |
| Automation                | [tests/ui/negative/checkout.spec.ts](../../tests/ui/negative/checkout.spec.ts)                 |
| Project                   | chromium                                                                                       |
| Run suite                 | `npm run test:regression`                                                                      |
| Last saved outcome        | passed                                                                                         |
| Previous headless outcome | passed                                                                                         |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                         |

Steps:

1. Sign in, add Backpack, open cart > Checkout.
2. Fill customer details with only the specified field empty.
3. Click Continue.

Expected results:

- Error contains Last Name is required.
- URL remains checkout-step-one.html.

## TC-030 — missing postalCode blocks checkout

| Field                     | Value                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| Requirement               | CHECK-01                                                                                         |
| Priority                  | Normal                                                                                           |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable.       |
| Test data                 | First Name: Ada; Last Name: Lovelace; Postal Code: 560001; override postalCode with empty string |
| Automation                | [tests/ui/negative/checkout.spec.ts](../../tests/ui/negative/checkout.spec.ts)                   |
| Project                   | chromium                                                                                         |
| Run suite                 | `npm run test:regression`                                                                        |
| Last saved outcome        | passed                                                                                           |
| Previous headless outcome | passed                                                                                           |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                           |

Steps:

1. Sign in, add Backpack, open cart > Checkout.
2. Fill customer details with only the specified field empty.
3. Click Continue.

Expected results:

- Error contains Postal Code is required.
- URL remains checkout-step-one.html.

## TC-031 — observes Unicode and special characters

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | CHECK-01                                                                                   |
| Priority                  | Normal                                                                                     |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | First Name: Zoë; Last Name: O'Connor-李; Postal Code: SW1A 1AA                             |
| Automation                | [tests/ui/negative/checkout.spec.ts](../../tests/ui/negative/checkout.spec.ts)             |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Sign in, add Backpack and open Checkout.
2. Fill the specified boundary values.
3. Click Continue.

Expected results:

- Checkout advances to checkout-step-two.html.

Notes: Documents actual nonempty-field behavior; this is not a claim of robust name/postal validation or a fabricated defect.

## TC-032 — observes long nonempty values

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | CHECK-01                                                                                   |
| Priority                  | Normal                                                                                     |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | First Name: A × 256; Last Name: B × 256; Postal Code: P × 256                              |
| Automation                | [tests/ui/negative/checkout.spec.ts](../../tests/ui/negative/checkout.spec.ts)             |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Sign in, add Backpack and open Checkout.
2. Fill the specified boundary values.
3. Click Continue.

Expected results:

- Checkout advances to checkout-step-two.html.

Notes: Documents actual nonempty-field behavior; this is not a claim of robust name/postal validation or a fabricated defect.

## TC-033 — observes whitespace-only fields (observed demo behavior)

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | CHECK-01                                                                                   |
| Priority                  | Normal                                                                                     |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | Each field contains exactly three spaces                                                   |
| Automation                | [tests/ui/negative/checkout.spec.ts](../../tests/ui/negative/checkout.spec.ts)             |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Sign in, add Backpack and open Checkout.
2. Fill the specified boundary values.
3. Click Continue.

Expected results:

- Checkout advances to checkout-step-two.html.

Notes: Documents actual nonempty-field behavior; this is not a claim of robust name/postal validation or a fabricated defect.
