import { test, expect } from '../../../fixtures/test';
import { productNames } from '../../../test-data/products';

test.beforeEach(async ({ signedIn: _signedIn }) => {});

test(
  '[INV-01] catalog contains six complete products with loaded images',
  { tag: '@smoke' },
  async ({ inventory }) => {
    await expect(inventory.items).toHaveCount(6);
    const products = await inventory.products();
    expect(products.map((product) => product.name)).toEqual([...productNames]);
    expect(
      products.every((product) => product.description.length > 20 && product.priceCents > 0),
    ).toBe(true);
    await expect
      .poll(() =>
        inventory.items
          .locator('img')
          .evaluateAll((images) =>
            images.every(
              (image) =>
                image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
  },
);

test('[INV-02] all four dropdown choices sort actual names and numeric prices', async ({
  inventory,
}) => {
  const choices = await inventory.sort
    .locator('option')
    .evaluateAll((options) =>
      options.map((option) => ({ value: option.getAttribute('value'), text: option.textContent })),
    );
  expect(choices).toEqual([
    { value: 'az', text: 'Name (A to Z)' },
    { value: 'za', text: 'Name (Z to A)' },
    { value: 'lohi', text: 'Price (low to high)' },
    { value: 'hilo', text: 'Price (high to low)' },
  ]);
  const baseline = await inventory.products();
  for (const value of ['az', 'za', 'lohi', 'hilo']) {
    await test.step(`Verify ${value} order using product values`, async () => {
      await inventory.sort.selectOption(value);
      const products = await inventory.products();
      if (value === 'az' || value === 'za') {
        const sorted = baseline.map((product) => product.name).sort();
        expect(products.map((product) => product.name)).toEqual(
          value === 'az' ? sorted : sorted.reverse(),
        );
      } else {
        const sorted = baseline.map((product) => product.priceCents).sort((a, b) => a - b);
        expect(products.map((product) => product.priceCents)).toEqual(
          value === 'lohi' ? sorted : sorted.reverse(),
        );
      }
    });
  }
});

test('[INV-01] every product detail matches its inventory card and back returns', async ({
  inventory,
  details,
  page,
}) => {
  const products = await inventory.products();
  for (const product of products) {
    await test.step(`Compare details for ${product.name}`, async () => {
      await inventory.details(product.name);
      await expect(page).toHaveURL(/inventory-item\.html\?id=\d+/);
      expect(await details.product()).toEqual(product);
      await details.back();
      await expect(inventory.items).toHaveCount(6);
    });
  }
});

test('[CART-01] details add/remove stays consistent with inventory and cart', async ({
  inventory,
  details,
  cart,
}) => {
  const [backpack] = await inventory.products();
  expect(backpack).toBeDefined();
  await inventory.details(productNames[0]);
  await details.add();
  await expect(inventory.badge).toHaveText('1');
  await details.remove();
  await expect(inventory.badge).toHaveCount(0);
  await details.add();
  await details.back();
  await expect(
    inventory.card(productNames[0]).getByRole('button', { name: 'Remove', exact: true }),
  ).toBeVisible();
  await inventory.openCart();
  expect(await cart.products()).toEqual([backpack]);
});
