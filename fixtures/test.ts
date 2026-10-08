import { test as base, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { createHash } from 'node:crypto';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { MenuComponent } from '../pages/MenuComponent';
interface Fixtures {
  loginPage: LoginPage;
  inventory: InventoryPage;
  details: ProductDetailsPage;
  cart: CartPage;
  checkout: CheckoutPage;
  menu: MenuComponent;
  signedIn: void;
  reportMetadata: void;
}
export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventory: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  details: async ({ page }, use) => {
    await use(new ProductDetailsPage(page));
  },
  cart: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkout: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  menu: async ({ page }, use) => {
    await use(new MenuComponent(page));
  },
  signedIn: async ({ loginPage, page }, use) => {
    await test.step('Sign in with the public standard demo persona', async () => {
      await loginPage.navigate();
      await loginPage.login('standard_user', 'secret_sauce');
      await expect(page.locator('[data-test="title"]')).toHaveText('Products');
    });
    await use();
  },
  reportMetadata: [
    async ({}, use, info) => {
      const requirement = info.title.match(/\[([A-Z]+-\d+)\]/)?.[1] ?? 'AUTH-01';
      const parts = info.file.replaceAll('\\', '/').split('/tests/')[1]?.split('/') ?? [];
      const feature =
        parts[0] === 'ui'
          ? (parts[1] ?? 'UI')
          : parts[0] === 'login.spec.ts'
            ? 'Authentication'
            : (parts[0] ?? 'Framework');
      await allure.epic(
        info.project.name === 'api'
          ? 'Independent companion service'
          : info.project.name === 'ai'
            ? 'AI quality'
            : 'SauceDemo',
      );
      await allure.feature(feature);
      await allure.story(requirement);
      await allure.owner('QA Framework Maintainers');
      await allure.parameter('project', info.project.name);
      await allure.severity(info.tags.includes('@smoke') ? 'critical' : 'normal');
      await allure.testCaseId(
        createHash('sha256').update(`${requirement}:${info.title}`).digest('hex').slice(0, 16),
      );
      await allure.description(
        `Requirement: ${requirement}. See docs/requirements-traceability.md. ${info.title}`,
      );
      info.annotations.push({ type: 'requirement', description: requirement });
      await use();
    },
    { auto: true },
  ],
});
export { expect };
