# Application inventory

Observed with real Playwright browser navigation on 2026-10-08. Raw DOM attributes,
ARIA snapshots, products and persona observations: [reconnaissance evidence](evidence/reconnaissance.json).
The project folder has no Git repository; no commit history was available.

| Screen            | Actual path                                    | Observed controls and behavior                                                                                              |
| ----------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Login             | `/`                                            | Username text input, masked password, Login submit, public demo credentials, validation error and dismiss button            |
| Inventory         | `/inventory.html`                              | Six product cards, image/name detail links, description, USD price, Add to cart/Remove, native sorting dropdown, cart badge |
| Details           | `/inventory-item.html?id=4` (Backpack example) | Image, name, description, price, Add/Remove, Back to products                                                               |
| Cart              | `/cart.html`                                   | Quantity, product name/description/price, Remove, Continue Shopping, Checkout                                               |
| Customer details  | `/checkout-step-one.html`                      | First Name, Last Name, Zip/Postal Code; Cancel, Continue; required-field errors                                             |
| Overview          | `/checkout-step-two.html`                      | Line items, Payment Information, Shipping Information, Item total, Tax, Total; Cancel, Finish                               |
| Confirmation      | `/checkout-complete.html`                      | Thank you for your order!, completion text, Back Home, Generate PDF order download                                          |
| Shared menu       | Inventory/cart/checkout                        | Open/Close Menu, All Items, Dynamic Catalog submenu, About (external Sauce Labs), Logout, Reset App State                   |
| Dynamic Lazy Load | `/dynamic-catalog-lazy-load.html`              | Product variants, image/name/price, Loading placeholders and scroll-triggered loading sentinel                              |
| Dynamic Spinner   | `/dynamic-catalog-spinner.html`                | Loading status/spinner before product cards appear                                                                          |
| Dynamic Slider    | `/dynamic-catalog-slider.html`                 | One product image/name/price and six named Show product buttons                                                             |

Stable locators: `data-test` attributes (see evidence), accessible button/link names.
Menu actions and product links expose **button roles**, while About exposes a link.
Additional browser evidence is in `evidence/additional-reconnaissance.json`.
Sorting options actually observed: `az` Name (A to Z), `za` Name (Z to A),
`lohi` Price (low to high), `hilo` Price (high to low).
Prices in initial inventory: Backpack 29.99, Bike Light 9.99, Bolt T-Shirt 15.99,
Fleece Jacket 49.99, Onesie 7.99, Red T-Shirt 15.99. Tests use displayed prices
for arithmetic; these observations are not a tax specification.

## Public personas

The login page lists `standard_user`, `locked_out_user`, `problem_user`,
`performance_glitch_user`, `error_user`, `visual_user`, with public demo password
`secret_sauce`. These are demonstration credentials, not private secrets.

| Persona                 | Actual observation                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| standard_user           | Login, add Backpack, cart, checkout and confirmation worked                                                       |
| locked_out_user         | Rejected with “Sorry, this user has been locked out.”                                                             |
| performance_glitch_user | Login took approximately 5.1 seconds; checkout advanced                                                           |
| problem_user            | All six images used the same replacement image; Last Name input stayed empty and checkout reported required field |
| error_user              | Last Name input stayed empty; Continue still advanced to overview                                                 |
| visual_user             | Backpack used a replacement image, other five images matched baseline                                             |

## Scope exclusions

Search, pagination, coupons, real payments, verified backend/order APIs, database
access, account registration, file uploads, email receipts: **NOT APPLICABLE**.
No controls or accessible public interfaces for these were observed in the inspected
workflows. “Payment Information” is static demo text, not a payment form.
The local companion API is an independent teaching service, never SauceDemo's backend.
External About destination is inspected as a link only; no external-site automation is implied.
