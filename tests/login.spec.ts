import { test, expect } from '../fixtures/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Authentication', () => {
  test('Verify successful login to SauceDemo', { tag: '@smoke' }, async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step('Open the login page', async () => {
      await loginPage.navigate();
    });

    await test.step('Sign in as a standard user', async () => {
      await loginPage.login('standard_user', 'secret_sauce');
    });

    await test.step('Verify the products page is displayed', async () => {
      await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
      await expect(page.locator('[data-test="title"]')).toHaveText('Products');
    });
  });
});
