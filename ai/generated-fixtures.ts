import { test as base, expect } from '@playwright/test';
import { applicationConfig, restrictContext } from './application';
// This trusted fixture is used only by the explicit generated-test runner.
export const test = base.extend({
  page: async ({ page, context }, use) => {
    const config = applicationConfig(JSON.parse(process.env.PRD_RUN_CONFIG ?? '{}'));
    await restrictContext(context, config);
    await use(page);
  },
});
export { expect };
