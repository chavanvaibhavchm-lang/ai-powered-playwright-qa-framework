import { type Page } from '@playwright/test';
import { moneyCents, readProducts } from '../utils/products';
export interface Customer {
  firstName: string;
  lastName: string;
  postalCode: string;
}
export class CheckoutPage {
  constructor(readonly page: Page) {}
  async fill(customer: Customer) {
    await this.page.locator('[data-test="firstName"]').fill(customer.firstName);
    await this.page.locator('[data-test="lastName"]').fill(customer.lastName);
    await this.page.locator('[data-test="postalCode"]').fill(customer.postalCode);
  }
  async continue() {
    await this.page.getByRole('button', { name: 'Continue', exact: true }).click();
  }
  async cancel() {
    await this.page.getByRole('button', { name: 'Cancel', exact: true }).click();
  }
  async finish() {
    await this.page.getByRole('button', { name: 'Finish', exact: true }).click();
  }
  async products() {
    return readProducts(this.page.locator('[data-test="inventory-item"]'));
  }
  async totals() {
    return {
      subtotal: moneyCents(await this.page.locator('[data-test="subtotal-label"]').innerText()),
      tax: moneyCents(await this.page.locator('[data-test="tax-label"]').innerText()),
      total: moneyCents(await this.page.locator('[data-test="total-label"]').innerText()),
    };
  }
}
