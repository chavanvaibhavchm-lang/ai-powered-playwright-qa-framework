import { test, expect } from '../../../fixtures/test';

const cases = [
  {
    name: 'wrong username',
    username: 'unknown_user',
    password: 'secret_sauce',
    message: 'Username and password do not match',
  },
  {
    name: 'wrong password',
    username: 'standard_user',
    password: 'incorrect',
    message: 'Username and password do not match',
  },
  {
    name: 'missing username',
    username: '',
    password: 'secret_sauce',
    message: 'Username is required',
  },
  {
    name: 'missing password',
    username: 'standard_user',
    password: '',
    message: 'Password is required',
  },
  { name: 'both fields empty', username: '', password: '', message: 'Username is required' },
  {
    name: 'locked account',
    username: 'locked_out_user',
    password: 'secret_sauce',
    message: 'Sorry, this user has been locked out',
  },
  {
    name: 'whitespace credentials',
    username: '   ',
    password: '   ',
    message: 'Username and password do not match',
  },
  {
    name: 'special characters',
    username: "<script>alert('qa')</script>",
    password: '!?<>',
    message: 'Username and password do not match',
  },
  {
    name: 'long username',
    username: 'u'.repeat(256),
    password: 'secret_sauce',
    message: 'Username and password do not match',
  },
] as const;
for (const input of cases) {
  test(`[AUTH-02] rejects ${input.name}`, { tag: '@negative' }, async ({ loginPage, page }) => {
    await loginPage.navigate();
    await test.step('Submit invalid demo credentials', async () => {
      await loginPage.login(input.username, input.password);
    });
    await expect(loginPage.error).toContainText(input.message);
    await expect(page.locator('[data-test="inventory-item"]')).toHaveCount(0);
    await page.locator('[data-test="error-button"]').click();
    await expect(loginPage.error).toHaveCount(0);
  });
}
