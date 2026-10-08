import { test, expect } from '../../../fixtures/test';
import { basket, customer } from '../../../test-data/products';

test(
  '[RESP-01] small mobile viewport supports login, cart and checkout',
  { tag: '@smoke' },
  async ({ page, loginPage, inventory, cart, checkout }) => {
    await loginPage.navigate();
    await expect(loginPage.loginButton).toBeInViewport();
    await loginPage.login('standard_user', 'secret_sauce');
    await expect(inventory.sort).toBeInViewport();
    await inventory.add(basket[0]);
    await inventory.openCart();
    await expect(cart.items).toHaveCount(1);
    await cart.checkout();
    await checkout.fill(customer);
    await checkout.continue();
    const totals = await checkout.totals();
    expect(totals.total).toBe(totals.subtotal + totals.tax);
    await checkout.finish();
    await expect(page.locator('[data-test="complete-header"]')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  },
);
