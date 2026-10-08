import { type Page } from '@playwright/test';
export class MenuComponent {
  constructor(readonly page: Page) {}
  async open() {
    await this.page.getByRole('button', { name: 'Open Menu' }).click();
  }
  async close() {
    await this.page.getByRole('button', { name: 'Close Menu' }).click();
  }
  async logout() {
    await this.open();
    await this.page.getByRole('button', { name: 'Logout', exact: true }).click();
  }
  async reset() {
    await this.open();
    await this.page.getByRole('button', { name: 'Reset App State' }).click();
    await this.close();
  }
}
