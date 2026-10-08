import { test, expect } from '../../../fixtures/test';
import { basket, customer } from '../../../test-data/products';
test.beforeEach(async ({ signedIn: _signedIn }) => {});

for (const names of [[basket[0]], [...basket]]) {
  test(
    `[CHECK-02] completes ${names.length}-item checkout with verified arithmetic`,
    { tag: '@smoke' },
    async ({ inventory, cart, checkout, page }) => {
      const expected = (await inventory.products()).filter((product) =>
        names.includes(product.name as (typeof basket)[number]),
      );
      await test.step('Build a basket from displayed products', async () => {
        for (const name of names) await inventory.add(name);
        await inventory.openCart();
        expect(await cart.products()).toEqual(expected);
      });
      await cart.checkout();
      await checkout.fill(customer);
      await checkout.continue();
      await test.step('Verify line items and total without assuming a tax rate', async () => {
        expect(await checkout.products()).toEqual(expected);
        const totals = await checkout.totals();
        expect(totals.subtotal).toBe(
          expected.reduce((sum, product) => sum + product.priceCents, 0),
        );
        expect(totals.tax).toBeGreaterThanOrEqual(0);
        expect(totals.total).toBe(totals.subtotal + totals.tax);
        await expect(page.locator('[data-test="payment-info-value"]')).not.toBeEmpty();
        await expect(page.locator('[data-test="shipping-info-value"]')).not.toBeEmpty();
      });
      await checkout.finish();
      await expect(page.locator('[data-test="complete-header"]')).toHaveText(
        'Thank you for your order!',
      );
      await expect(inventory.badge).toHaveCount(0);
      await page.getByRole('button', { name: 'Back Home' }).click();
      await expect(inventory.items).toHaveCount(6);
    },
  );
}

test('[CHECK-02] cancel from information returns to cart and overview returns to inventory', async ({
  inventory,
  cart,
  checkout,
  page,
}) => {
  await inventory.add(basket[0]);
  await inventory.openCart();
  await cart.checkout();
  await checkout.cancel();
  await expect(page).toHaveURL(/cart\.html$/);
  await expect(cart.items).toHaveCount(1);
  await cart.checkout();
  await checkout.fill(customer);
  await checkout.continue();
  await checkout.cancel();
  await expect(page).toHaveURL(/inventory\.html$/);
  await expect(inventory.badge).toHaveText('1');
});
