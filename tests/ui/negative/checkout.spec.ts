import { test, expect } from '../../../fixtures/test';
import { basket, customer } from '../../../test-data/products';
test.beforeEach(async ({ signedIn: _signedIn, inventory, cart }) => {
  await inventory.add(basket[0]);
  await inventory.openCart();
  await cart.checkout();
});
for (const input of [
  { field: 'firstName', message: 'First Name is required' },
  { field: 'lastName', message: 'Last Name is required' },
  { field: 'postalCode', message: 'Postal Code is required' },
] as const) {
  test(
    `[CHECK-01] missing ${input.field} blocks checkout`,
    { tag: '@negative' },
    async ({ checkout, page }) => {
      await checkout.fill({ ...customer, [input.field]: '' });
      await checkout.continue();
      await expect(page.locator('[data-test="error"]')).toContainText(input.message);
      await expect(page).toHaveURL(/checkout-step-one\.html$/);
    },
  );
}

for (const input of [
  {
    name: 'Unicode and special characters',
    values: { firstName: 'Zoë', lastName: "O'Connor-李", postalCode: 'SW1A 1AA' },
  },
  {
    name: 'long nonempty values',
    values: { firstName: 'A'.repeat(256), lastName: 'B'.repeat(256), postalCode: 'P'.repeat(256) },
  },
  {
    name: 'whitespace-only fields (observed demo behavior)',
    values: { firstName: '   ', lastName: '   ', postalCode: '   ' },
  },
]) {
  test(`[CHECK-01] observes ${input.name}`, { tag: '@negative' }, async ({ checkout, page }) => {
    await checkout.fill(input.values);
    await checkout.continue();
    // This documents nonempty-field behavior, not an assertion of postal validation.
    await expect(page).toHaveURL(/checkout-step-two\.html$/);
  });
}
