import { test, expect } from '../../fixtures/test';
for (const screen of ['login', 'inventory'] as const) {
  test(`[VIS-01] stable ${screen} appearance`, async ({ page, loginPage, inventory }) => {
    await loginPage.navigate();
    if (screen === 'inventory') {
      await loginPage.login('standard_user', 'secret_sauce');
      await expect(inventory.items).toHaveCount(6);
    }
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(() =>
        page
          .locator('img')
          .evaluateAll((images) =>
            images.every((image) => image instanceof HTMLImageElement && image.complete),
          ),
      )
      .toBe(true);
    await expect(page).toHaveScreenshot(`${screen}.png`, {
      animations: 'disabled',
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
}
