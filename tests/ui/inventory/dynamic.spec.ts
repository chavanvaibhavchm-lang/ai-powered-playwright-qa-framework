import { test, expect } from '../../../fixtures/test';
test.beforeEach(async ({ signedIn: _signedIn }) => {});

test('[DYN-01] lazy catalog loads more product cards when scrolling to its sentinel', async ({
  page,
  menu,
}) => {
  await menu.open();
  await page.getByRole('button', { name: 'Dynamic Catalog', exact: true }).click();
  await page.getByRole('button', { name: 'Lazy Load', exact: true }).click();
  await expect(page).toHaveURL(/dynamic-catalog-lazy-load\.html$/);
  const names = page.locator('[data-test^="lazy-load-item-"][data-test$="-name"]');
  await expect.poll(() => names.count()).toBeGreaterThanOrEqual(6);
  const initiallyLoaded = await names.count();
  await page.locator('[data-test="dynamic-catalog-lazy-load-sentinel"]').scrollIntoViewIfNeeded();
  await expect.poll(() => names.count()).toBeGreaterThan(initiallyLoaded);
});

test('[DYN-01] spinner disappears and loaded product content becomes visible', async ({
  page,
  menu,
}) => {
  await menu.open();
  await page.getByRole('button', { name: 'Dynamic Catalog', exact: true }).click();
  await page.getByRole('button', { name: 'Spinner', exact: true }).click();
  await expect(page).toHaveURL(/dynamic-catalog-spinner\.html$/);
  await expect(page.locator('[data-test="dynamic-catalog-spinner"]')).toHaveCount(0, {
    timeout: 20_000,
  });
  await expect(page.locator('[data-test="dynamic-catalog-spinner-container"]')).toContainText(
    'Sauce Labs',
  );
});

test('[DYN-01] slider selects the requested product with a named control', async ({
  page,
  menu,
}) => {
  await menu.open();
  await page.getByRole('button', { name: 'Dynamic Catalog', exact: true }).click();
  await page.getByRole('button', { name: 'Slider', exact: true }).click();
  await expect(page).toHaveURL(/dynamic-catalog-slider\.html$/);
  await page.getByRole('button', { name: 'Show Sauce Labs Backpack', exact: true }).click();
  await expect(page.locator('[data-test="dynamic-catalog-slider-item-name"]')).toHaveText(
    'Sauce Labs Backpack',
  );
  await expect(page.locator('[data-test="dynamic-catalog-slider-item-price"]')).toHaveText(
    '$29.99',
  );
});
