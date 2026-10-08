import { readFile } from 'node:fs/promises';
import { test, expect } from '../../../fixtures/test';
import { basket, customer } from '../../../test-data/products';

test('[PDF-01] completed demo order downloads a nonempty PDF artifact', async ({
  signedIn: _signedIn,
  inventory,
  cart,
  checkout,
  page,
}, info) => {
  await inventory.add(basket[0]);
  await inventory.openCart();
  await cart.checkout();
  await checkout.fill(customer);
  await checkout.continue();
  await checkout.finish();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Generate PDF order', exact: true }).click();
  const download = await downloadPromise;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  const filename = info.outputPath('demo-order.pdf');
  await download.saveAs(filename);
  const bytes = await readFile(filename);
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(bytes.length).toBeGreaterThan(100);
  await info.attach('demo-order-pdf', { path: filename, contentType: 'application/pdf' });
  // Checks download validity only; PDF content/layout certification is outside this suite.
});
