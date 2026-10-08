import { type Page } from '@playwright/test';
import { moneyCents, type Product } from '../utils/products';
export class ProductDetailsPage {
  constructor(readonly page: Page) {}
  async product(): Promise<Product> {
    return {
      name: await this.page.locator('[data-test="inventory-item-name"]').innerText(),
      description: await this.page.locator('[data-test="inventory-item-desc"]').innerText(),
      priceCents: moneyCents(
        await this.page.locator('[data-test="inventory-item-price"]').innerText(),
      ),
    };
  }
  async add() {
    await this.page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  }
  async remove() {
    await this.page.getByRole('button', { name: 'Remove', exact: true }).click();
  }
  async back() {
    await this.page.getByRole('button', { name: 'Back to products' }).click();
  }
}
