import { DatabaseSync } from 'node:sqlite';

export interface LocalProduct {
  id: number;
  name: string;
  priceCents: number;
}
export interface OrderInput {
  customer: { firstName: string; lastName: string; postalCode: string };
  items: { productId: number; quantity: number }[];
}
export interface Order extends OrderInput {
  id: number;
  status: 'pending' | 'completed' | 'cancelled';
  totalCents: number;
}
interface OrderRow {
  id: number;
  status: Order['status'];
  customer: string;
  items: string;
  totalCents: number;
}

export class OrderStore {
  private readonly db: DatabaseSync;
  constructor(filename: string) {
    this.db = new DatabaseSync(filename);
    this.db.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, priceCents INTEGER NOT NULL CHECK(priceCents > 0));
      CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT,
        status TEXT NOT NULL CHECK(status IN ('pending','completed','cancelled')),
        customer TEXT NOT NULL, items TEXT NOT NULL, totalCents INTEGER NOT NULL CHECK(totalCents > 0));
      INSERT OR IGNORE INTO products VALUES (1, 'Companion Backpack', 2999), (2, 'Companion Bike Light', 999);
    `);
  }
  products(): LocalProduct[] {
    return this.db.prepare('SELECT * FROM products ORDER BY id').all() as unknown as LocalProduct[];
  }
  private map(row: OrderRow): Order {
    return {
      id: row.id,
      status: row.status,
      customer: JSON.parse(row.customer) as OrderInput['customer'],
      items: JSON.parse(row.items) as OrderInput['items'],
      totalCents: row.totalCents,
    };
  }
  orders(): Order[] {
    return (this.db.prepare('SELECT * FROM orders ORDER BY id').all() as unknown as OrderRow[]).map(
      (row) => this.map(row),
    );
  }
  get(id: number): Order | undefined {
    const row = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as unknown as
      OrderRow | undefined;
    return row ? this.map(row) : undefined;
  }
  create(input: OrderInput): Order {
    const products = this.products();
    let totalCents = 0;
    for (const item of input.items) {
      const product = products.find((product) => product.id === item.productId);
      if (!product) throw new Error('Unknown product');
      totalCents += product.priceCents * item.quantity;
    }
    const result = this.db
      .prepare('INSERT INTO orders (status, customer, items, totalCents) VALUES (?, ?, ?, ?)')
      .run('pending', JSON.stringify(input.customer), JSON.stringify(input.items), totalCents);
    const order = this.get(Number(result.lastInsertRowid));
    if (!order) throw new Error('Inserted order could not be read');
    return order;
  }
  update(id: number, status: Order['status']): Order | undefined {
    this.db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    return this.get(id);
  }
  delete(id: number): boolean {
    return this.db.prepare('DELETE FROM orders WHERE id = ?').run(id).changes > 0;
  }
  close() {
    this.db.close();
  }
}
