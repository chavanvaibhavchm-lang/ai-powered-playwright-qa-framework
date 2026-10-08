import { type Page, type Locator } from '@playwright/test';
import { readProducts } from '../utils/products';
export class CartPage {
  readonly items: Locator;
  constructor(readonly page: Page) {
    this.items = page.locator('[data-test="inventory-item"]');
  }
  async products() {
    return readProducts(this.items);
  }
  async remove(name: string) {
    await this.items
      .filter({ has: this.page.getByText(name, { exact: true }) })
      .getByRole('button', { name: 'Remove', exact: true })
      .click();
  }
  async continueShopping() {
    await this.page.getByRole('button', { name: 'Continue Shopping' }).click();
  }
  async checkout() {
    await this.page.getByRole('button', { name: 'Checkout', exact: true }).click();
  }
}
