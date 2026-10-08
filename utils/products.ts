import { type Locator } from '@playwright/test';
export interface Product {
  name: string;
  description: string;
  priceCents: number;
}
export function moneyCents(text: string): number {
  const match = text.match(/\$(\d+)\.(\d{2})/);
  if (!match) throw new Error(`Not a USD amount: ${text}`);
  return Number(match[1]) * 100 + Number(match[2]);
}
export async function readProducts(items: Locator): Promise<Product[]> {
  const rows = await items.evaluateAll((elements) =>
    elements.map((element) => ({
      name: element.querySelector('[data-test="inventory-item-name"]')?.textContent?.trim(),
      description: element.querySelector('[data-test="inventory-item-desc"]')?.textContent?.trim(),
      price: element.querySelector('[data-test="inventory-item-price"]')?.textContent?.trim(),
    })),
  );
  return rows.map((row) => {
    if (!row.name || !row.description || !row.price) throw new Error('Incomplete product card');
    return { name: row.name, description: row.description, priceCents: moneyCents(row.price) };
  });
}
