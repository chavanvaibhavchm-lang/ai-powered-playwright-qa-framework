import { test, expect } from '../../../fixtures/test';
import { basket, customer } from '../../../test-data/products';

test('[PERS-01] performance persona reaches inventory with a generous timeout', async ({
  loginPage,
  inventory,
}, info) => {
  test.setTimeout(45_000);
  await loginPage.navigate();
  const start = Date.now();
  await loginPage.login('performance_glitch_user', 'secret_sauce');
  await expect(inventory.items).toHaveCount(6, { timeout: 20_000 });
  await info.attach('login-duration', {
    body: JSON.stringify({
      durationMs: Date.now() - start,
      note: 'Observation, not a performance SLA/load test',
    }),
    contentType: 'application/json',
  });
});

test(
  '[DEF-01] problem persona cannot retain last name and is blocked at checkout',
  { tag: '@known-defect' },
  async ({ loginPage, inventory, cart, checkout, page }, info) => {
    await loginPage.navigate();
    await loginPage.login('problem_user', 'secret_sauce');
    await inventory.add(basket[0]);
    await inventory.openCart();
    await cart.checkout();
    await checkout.fill(customer);
    await expect(page.locator('[data-test="lastName"]')).toHaveValue('');
    await checkout.continue();
    await expect(page.locator('[data-test="error"]')).toContainText('Last Name is required');
    await info.attach('defect-DEF-01', { body: await page.screenshot(), contentType: 'image/png' });
  },
);

test(
  '[DEF-02] error persona advances with rejected empty last name',
  { tag: '@known-defect' },
  async ({ loginPage, inventory, cart, checkout, page }, info) => {
    await loginPage.navigate();
    await loginPage.login('error_user', 'secret_sauce');
    await inventory.add(basket[0]);
    await inventory.openCart();
    await cart.checkout();
    await checkout.fill(customer);
    await expect(page.locator('[data-test="lastName"]')).toHaveValue('');
    await checkout.continue();
    await expect(page).toHaveURL(/checkout-step-two\.html$/);
    await info.attach('defect-DEF-02', { body: await page.screenshot(), contentType: 'image/png' });
  },
);

test(
  '[DEF-03] visual persona substitutes the backpack image',
  { tag: '@known-defect' },
  async ({ loginPage, inventory }, info) => {
    await loginPage.navigate();
    await loginPage.login('standard_user', 'secret_sauce');
    const standardImage = await inventory.card(basket[0]).locator('img').getAttribute('src');
    await loginPage.navigate();
    await loginPage.login('visual_user', 'secret_sauce');
    const actualImage = await inventory.card(basket[0]).locator('img').getAttribute('src');
    expect(actualImage).not.toBe(standardImage);
    expect(actualImage).toContain('sl-404');
    await info.attach('image-comparison', {
      body: JSON.stringify({ standardImage, actualImage }),
      contentType: 'application/json',
    });
  },
);
