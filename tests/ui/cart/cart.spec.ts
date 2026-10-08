import { test, expect } from '../../../fixtures/test';
import { basket, productNames } from '../../../test-data/products';
test.beforeEach(async ({ signedIn: _signedIn }) => {});

test(
  '[CART-01] multiple items retain identity, price and badge after refresh',
  { tag: '@smoke' },
  async ({ page, inventory, cart }) => {
    const expected = (await inventory.products()).filter((product) =>
      basket.includes(product.name as (typeof basket)[number]),
    );
    for (const name of basket) await inventory.add(name);
    await expect(inventory.badge).toHaveText('2');
    await inventory.openCart();
    expect(await cart.products()).toEqual(expected);
    await expect(page.locator('[data-test="item-quantity"]')).toHaveText(['1', '1']);
    await page.reload();
    expect(await cart.products()).toEqual(expected);
    await cart.remove(basket[0]);
    await expect(inventory.badge).toHaveText('1');
    await cart.continueShopping();
    await expect(
      inventory.card(basket[0]).getByRole('button', { name: 'Add to cart', exact: true }),
    ).toBeVisible();
    await inventory.remove(basket[1]);
    await expect(inventory.badge).toHaveCount(0);
    await inventory.openCart();
    await expect(cart.items).toHaveCount(0);
  },
);

test('[CART-01] single item can be removed from the cart', async ({ inventory, cart }) => {
  await inventory.add(productNames[0]);
  await expect(inventory.badge).toHaveText('1');
  await inventory.openCart();
  await cart.remove(productNames[0]);
  await expect(cart.items).toHaveCount(0);
  await expect(inventory.badge).toHaveCount(0);
});

test('[CART-01] empty cart has navigation controls without fabricated empty-cart policy', async ({
  inventory,
  cart,
  page,
}) => {
  await inventory.openCart();
  await expect(cart.items).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Checkout', exact: true })).toBeVisible();
  await cart.continueShopping();
  await expect(inventory.items).toHaveCount(6);
});
