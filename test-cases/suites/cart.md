# Cart test cases

3 cases mapped to existing automation. [Catalog index](../README.md).

## TC-021 — multiple items retain identity, price and badge after refresh

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | CART-01                                                                                    |
| Priority                  | Critical                                                                                   |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | Sauce Labs Backpack + Sauce Labs Bike Light                                                |
| Automation                | [tests/ui/cart/cart.spec.ts](../../tests/ui/cart/cart.spec.ts)                             |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Record card data; add Backpack and Bike Light.
2. Open cart and compare both items and quantities.
3. Refresh cart and compare again.
4. Remove Backpack; Continue Shopping.
5. Check Backpack Add to cart, remove Bike Light, then reopen cart.

Expected results:

- Badge is initially 2; cart data matches inventory and quantities are both 1.
- Refresh preserves both items.
- Removing Backpack changes badge to 1 and its inventory action to Add to cart.
- Removing the remaining item clears badge and cart.

## TC-022 — single item can be removed from the cart

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | CART-01                                                                                    |
| Priority                  | Normal                                                                                     |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state.        |
| Automation                | [tests/ui/cart/cart.spec.ts](../../tests/ui/cart/cart.spec.ts)                             |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Add Backpack and check badge.
2. Open cart and remove Backpack.

Expected results:

- Badge is initially 1.
- Cart is empty and badge disappears.

## TC-023 — empty cart has navigation controls without fabricated empty-cart policy

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | CART-01                                                                                    |
| Priority                  | Normal                                                                                     |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state.        |
| Automation                | [tests/ui/cart/cart.spec.ts](../../tests/ui/cart/cart.spec.ts)                             |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Sign in without adding products; open cart.
2. Inspect cart and Checkout button.
3. Click Continue Shopping.

Expected results:

- Cart contains no items and Checkout is visible.
- Continue Shopping returns to all six products.

Notes: No assertion that empty-cart checkout must be blocked; the implementation does not specify that policy.
