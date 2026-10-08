# Inventory and dynamic catalog test cases

7 cases mapped to existing automation. [Catalog index](../README.md).

## TC-014 — catalog contains six complete products with loaded images

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | INV-01                                                                                     |
| Priority                  | Critical                                                                                   |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state.        |
| Automation                | [tests/ui/inventory/inventory.spec.ts](../../tests/ui/inventory/inventory.spec.ts)         |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Sign in and inspect all six inventory cards.
2. Extract product names, descriptions and displayed prices.
3. Wait for each image to load and inspect its natural width.

Expected results:

- Names match test-data/products.ts in initial order.
- Each description has more than 20 characters; price is positive.
- All images are complete with naturalWidth > 0.

## TC-015 — all four dropdown choices sort actual names and numeric prices

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | INV-02                                                                                     |
| Priority                  | Normal                                                                                     |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state.        |
| Automation                | [tests/ui/inventory/inventory.spec.ts](../../tests/ui/inventory/inventory.spec.ts)         |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Record all inventory names and numeric prices.
2. Verify the four option labels/values.
3. Select az, za, lohi and hilo one at a time using the native dropdown.
4. After each selection compare all displayed values with the sorted baseline.

Expected results:

- Options are Name (A to Z)/az, Name (Z to A)/za, Price (low to high)/lohi, Price (high to low)/hilo.
- Names are in actual ascending/descending order.
- Prices are numerically ascending/descending, including equal prices.

## TC-016 — every product detail matches its inventory card and back returns

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | INV-01                                                                                     |
| Priority                  | Normal                                                                                     |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state.        |
| Automation                | [tests/ui/inventory/inventory.spec.ts](../../tests/ui/inventory/inventory.spec.ts)         |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Record inventory name, description and price for every product.
2. Open each product detail screen in turn.
3. Compare detail fields with the recorded card.
4. Click Back to products after each comparison.

Expected results:

- Detail URL includes inventory-item.html?id=<number>.
- Name, description and price match the inventory card for all six products.
- Back returns to the six-product catalog.

## TC-017 — details add/remove stays consistent with inventory and cart

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | CART-01                                                                                    |
| Priority                  | Normal                                                                                     |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state.        |
| Automation                | [tests/ui/inventory/inventory.spec.ts](../../tests/ui/inventory/inventory.spec.ts)         |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Record Backpack card data and open its details.
2. Add Backpack and verify badge; remove it and verify badge disappears.
3. Add it again and return to products.
4. Check its Remove button, then open cart and compare product data.

Expected results:

- Badge is 1 after add and absent after remove.
- Inventory reflects selected state after returning.
- Cart contains the same Backpack name, description and price.

## TC-018 — lazy catalog loads more product cards when scrolling to its sentinel

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | DYN-01                                                                                     |
| Priority                  | Normal                                                                                     |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state.        |
| Automation                | [tests/ui/inventory/dynamic.spec.ts](../../tests/ui/inventory/dynamic.spec.ts)             |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Sign in; open Menu > Dynamic Catalog > Lazy Load.
2. Wait for at least six loaded product-name elements and record count.
3. Scroll the lazy-load sentinel into view.
4. Wait for more product-name elements to load.

Expected results:

- URL ends in dynamic-catalog-lazy-load.html.
- Loaded product-name count increases beyond the recorded count.

## TC-019 — spinner disappears and loaded product content becomes visible

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | DYN-01                                                                                     |
| Priority                  | Normal                                                                                     |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state.        |
| Automation                | [tests/ui/inventory/dynamic.spec.ts](../../tests/ui/inventory/dynamic.spec.ts)             |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Sign in; open Menu > Dynamic Catalog > Spinner.
2. Wait for the loading spinner to be removed (up to 20 seconds).
3. Inspect the loaded catalog container.

Expected results:

- URL ends in dynamic-catalog-spinner.html.
- Spinner element is absent.
- Loaded content contains Sauce Labs.

## TC-020 — slider selects the requested product with a named control

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | DYN-01                                                                                     |
| Priority                  | Normal                                                                                     |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state.        |
| Automation                | [tests/ui/inventory/dynamic.spec.ts](../../tests/ui/inventory/dynamic.spec.ts)             |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Sign in; open Menu > Dynamic Catalog > Slider.
2. Click Show Sauce Labs Backpack.
3. Inspect the displayed product name and price.

Expected results:

- URL ends in dynamic-catalog-slider.html.
- Name is Sauce Labs Backpack and price is $29.99.
