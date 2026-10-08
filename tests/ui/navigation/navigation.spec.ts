import { test, expect } from '../../../fixtures/test';
import { basket } from '../../../test-data/products';
test.beforeEach(async ({ signedIn: _signedIn }) => {});

test('[NAV-01] menu opens, closes, links to About and returns to All Items', async ({
  menu,
  page,
  inventory,
}) => {
  await menu.open();
  await expect(page.getByRole('link', { name: 'About', exact: true })).toHaveAttribute(
    'href',
    'https://saucelabs.com/',
  );
  await expect(page.getByRole('button', { name: 'Logout', exact: true })).toBeVisible();
  await menu.close();
  await expect(page.getByRole('button', { name: 'Logout', exact: true })).not.toBeVisible();
  await inventory.openCart();
  await menu.open();
  await page.getByRole('button', { name: 'All Items', exact: true }).click();
  await expect(inventory.items).toHaveCount(6);
});

test('[NAV-01] reset clears cart after navigation and refresh', async ({
  inventory,
  menu,
  cart,
  page,
}) => {
  for (const name of basket) await inventory.add(name);
  await menu.reset();
  await expect(inventory.badge).toHaveCount(0);
  await page.reload();
  for (const name of basket)
    await expect(
      inventory.card(name).getByRole('button', { name: 'Add to cart', exact: true }),
    ).toBeVisible();
  await inventory.openCart();
  await expect(cart.items).toHaveCount(0);
});

test('[NAV-01] browser back and forward retain selected product and cart', async ({
  inventory,
  page,
  details,
  cart,
}) => {
  await inventory.details(basket[0]);
  await details.add();
  await page.goBack();
  await expect(inventory.items).toHaveCount(6);
  await page.goForward();
  await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText(basket[0]);
  await inventory.openCart();
  await page.reload();
  expect((await cart.products()).map((product) => product.name)).toEqual([basket[0]]);
});
