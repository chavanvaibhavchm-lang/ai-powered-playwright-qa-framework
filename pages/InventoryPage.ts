import { type Page, type Locator } from '@playwright/test';
import { readProducts } from '../utils/products';
export class InventoryPage {
  readonly items: Locator;
  readonly sort: Locator;
  readonly badge: Locator;
  constructor(readonly page: Page) {
    this.items = page.locator('[data-test="inventory-item"]');
    this.sort = page.locator('[data-test="product-sort-container"]');
    this.badge = page.locator('[data-test="shopping-cart-badge"]');
  }
  card(name: string): Locator {
    return this.items.filter({ has: this.page.getByText(name, { exact: true }) });
  }
  async products() {
    return readProducts(this.items);
  }
  async add(name: string) {
    await this.card(name).getByRole('button', { name: 'Add to cart', exact: true }).click();
  }
  async remove(name: string) {
    await this.card(name).getByRole('button', { name: 'Remove', exact: true }).click();
  }
  async details(name: string) {
    await this.card(name).getByText(name, { exact: true }).click();
  }
  async openCart() {
    await this.page.locator('[data-test="shopping-cart-link"]').click();
  }
}
