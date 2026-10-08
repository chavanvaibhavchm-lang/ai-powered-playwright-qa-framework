# Menu and navigation test cases

3 cases mapped to existing automation. [Catalog index](../README.md).

## TC-034 — menu opens, closes, links to About and returns to All Items

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | NAV-01                                                                                     |
| Priority                  | Normal                                                                                     |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state.        |
| Automation                | [tests/ui/navigation/navigation.spec.ts](../../tests/ui/navigation/navigation.spec.ts)     |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Open Menu from inventory.
2. Inspect About href and Logout visibility.
3. Close Menu and inspect Logout visibility.
4. Open cart, then Menu > All Items.

Expected results:

- About href is https://saucelabs.com/.
- Logout is visible only while menu is open.
- All Items returns to six products.

Notes: About destination is checked as a link; the external site is not exercised.

## TC-035 — reset clears cart after navigation and refresh

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | NAV-01                                                                                     |
| Priority                  | Normal                                                                                     |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state.        |
| Automation                | [tests/ui/navigation/navigation.spec.ts](../../tests/ui/navigation/navigation.spec.ts)     |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Add Backpack and Bike Light.
2. Open Menu > Reset App State and close menu.
3. Refresh inventory and inspect both product actions.
4. Open cart.

Expected results:

- Badge clears.
- Both products expose Add to cart after refresh.
- Cart is empty.

## TC-036 — browser back and forward retain selected product and cart

| Field                     | Value                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Requirement               | NAV-01                                                                                     |
| Priority                  | Normal                                                                                     |
| Preconditions             | Fresh browser context signed in as standard_user; empty initial cart; SauceDemo reachable. |
| Test data                 | standard_user / secret_sauce (public demo credentials); use fixture-isolated state.        |
| Automation                | [tests/ui/navigation/navigation.spec.ts](../../tests/ui/navigation/navigation.spec.ts)     |
| Project                   | chromium                                                                                   |
| Run suite                 | `npm run test:regression`                                                                  |
| Last saved outcome        | passed                                                                                     |
| Previous headless outcome | passed                                                                                     |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                     |

Steps:

1. Open Backpack details and add it.
2. Use browser Back and inspect inventory.
3. Use Forward and inspect Backpack details.
4. Open cart and refresh.

Expected results:

- Back shows six inventory products.
- Forward restores Backpack details.
- Refreshed cart contains Backpack.
