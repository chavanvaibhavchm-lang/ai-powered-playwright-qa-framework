import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../../fixtures/test';

for (const screen of ['login', 'inventory', 'cart', 'checkout'] as const) {
  test(`[A11Y-01] WCAG-oriented audit of ${screen}`, async ({
    page,
    loginPage,
    inventory,
    cart,
  }, info) => {
    await loginPage.navigate();
    if (screen !== 'login') await loginPage.login('standard_user', 'secret_sauce');
    if (screen === 'cart' || screen === 'checkout') await inventory.openCart();
    if (screen === 'checkout') await cart.checkout();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    await info.attach('axe-audit', {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    });
    expect(results.violations, 'Limited automated audit; see attached axe evidence').toEqual([]);
  });
}

test('[A11Y-01] login controls follow keyboard focus order', async ({ loginPage, page }) => {
  await loginPage.navigate();
  await page.keyboard.press('Tab');
  await expect(loginPage.username).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(loginPage.password).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(loginPage.loginButton).toBeFocused();
});
