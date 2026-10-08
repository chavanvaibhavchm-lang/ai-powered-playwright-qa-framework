import { test, expect } from '../../../fixtures/test';

test('[AUTH-03] password is masked and keyboard login works', async ({ loginPage, page }) => {
  await loginPage.navigate();
  await expect(loginPage.password).toHaveAttribute('type', 'password');
  await loginPage.username.fill('standard_user');
  await loginPage.username.press('Tab');
  await expect(loginPage.password).toBeFocused();
  await loginPage.password.fill('secret_sauce');
  await loginPage.password.press('Enter');
  await expect(page).toHaveURL(/inventory\.html$/);
});

test('[AUTH-03] inventory refresh preserves session and logout revokes access', async ({
  signedIn: _signedIn,
  page,
  menu,
  loginPage,
}) => {
  await page.reload();
  await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  await menu.logout();
  await expect(loginPage.loginButton).toBeVisible();
  await page.goto('/inventory.html');
  await expect(loginPage.error).toContainText(
    "You can only access '/inventory.html' when you are logged in.",
  );
});

test('[AUTH-03] unauthenticated direct inventory navigation is rejected', async ({
  page,
  loginPage,
}) => {
  await page.goto('/inventory.html');
  await expect(loginPage.loginButton).toBeVisible();
  await expect(loginPage.error).toContainText('You can only access');
});
