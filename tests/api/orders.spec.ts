import { test, expect } from '../../fixtures/api';
import { OrderStore } from '../../companion/store';
import { Ajv } from 'ajv';

const orderInput = {
  customer: { firstName: 'Ada', lastName: 'Lovelace', postalCode: '560001' },
  items: [
    { productId: 1, quantity: 2 },
    { productId: 2, quantity: 1 },
  ],
};
const validateResponse = new Ajv().compile({
  type: 'object',
  additionalProperties: false,
  required: ['id', 'status', 'customer', 'items', 'totalCents'],
  properties: {
    id: { type: 'integer', minimum: 1 },
    status: { enum: ['pending', 'completed', 'cancelled'] },
    customer: { type: 'object' },
    items: { type: 'array', minItems: 1 },
    totalCents: { type: 'integer', minimum: 1 },
  },
});

test('[API-01] health and deterministic products are independent of SauceDemo', async ({
  service,
  request,
}) => {
  const health = await request.get(`${service.url}/health`);
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({ status: 'ok', service: 'independent-companion' });
  const response = await request.get(`${service.url}/products`);
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual([
    { id: 1, name: 'Companion Backpack', priceCents: 2999 },
    { id: 2, name: 'Companion Bike Light', priceCents: 999 },
  ]);
  expect(await (await request.get(`${service.url}/orders`)).json()).toEqual([]);
});

test('[API-01] create, read, update and delete order with calculated cents', async ({
  service,
  request,
}) => {
  const create = await request.post(`${service.url}/orders`, { data: orderInput });
  expect(create.status()).toBe(201);
  const order = (await create.json()) as { id: number; totalCents: number };
  expect(validateResponse(order)).toBe(true);
  expect(order.totalCents).toBe(6997);
  expect(create.headers()['location']).toBe(`/orders/${order.id}`);
  const read = await request.get(`${service.url}/orders/${order.id}`);
  expect(read.status()).toBe(200);
  expect(await read.json()).toEqual(order);
  const update = await request.patch(`${service.url}/orders/${order.id}`, {
    data: { status: 'completed' },
  });
  expect(update.status()).toBe(200);
  expect(await update.json()).toEqual({ ...order, status: 'completed' });
  expect((await request.delete(`${service.url}/orders/${order.id}`)).status()).toBe(204);
  expect((await request.get(`${service.url}/orders/${order.id}`)).status()).toBe(404);
  expect(await (await request.get(`${service.url}/orders`)).json()).toEqual([]);
});

test('[API-02] SQLite order survives closing and reopening its database', async ({
  service,
  databasePath,
  request,
}) => {
  const response = await request.post(`${service.url}/orders`, { data: orderInput });
  expect(response.status()).toBe(201);
  const order = (await response.json()) as { id: number };
  await service.close();
  const reopened = new OrderStore(databasePath);
  try {
    expect(reopened.get(order.id)).toEqual(order);
  } finally {
    reopened.close();
  }
});

for (const invalid of [
  { name: 'empty items', input: { ...orderInput, items: [] } },
  { name: 'zero quantity', input: { ...orderInput, items: [{ productId: 1, quantity: 0 }] } },
  {
    name: 'fractional quantity',
    input: { ...orderInput, items: [{ productId: 1, quantity: 1.5 }] },
  },
  { name: 'excess quantity', input: { ...orderInput, items: [{ productId: 1, quantity: 101 }] } },
  { name: 'unknown product', input: { ...orderInput, items: [{ productId: 999, quantity: 1 }] } },
  {
    name: 'duplicate product',
    input: {
      ...orderInput,
      items: [
        { productId: 1, quantity: 1 },
        { productId: 1, quantity: 2 },
      ],
    },
  },
  {
    name: 'blank customer',
    input: { ...orderInput, customer: { ...orderInput.customer, firstName: '   ' } },
  },
  { name: 'unexpected property', input: { ...orderInput, admin: true } },
]) {
  test(`[API-01] rejects ${invalid.name} without persisting an order`, async ({
    service,
    request,
  }) => {
    const response = await request.post(`${service.url}/orders`, { data: invalid.input });
    expect(response.status()).toBe(400);
    expect(await response.json()).toHaveProperty('error');
    expect(await (await request.get(`${service.url}/orders`)).json()).toEqual([]);
  });
}

test('[API-01] malformed JSON, media type, payload size and routes return explicit errors', async ({
  service,
  request,
}) => {
  expect(
    (
      await request.post(`${service.url}/orders`, {
        data: '{broken',
        headers: { 'content-type': 'application/json' },
      })
    ).status(),
  ).toBe(400);
  expect((await request.post(`${service.url}/orders`, { data: 'plain' })).status()).toBe(415);
  expect(
    (
      await request.post(`${service.url}/orders`, {
        data: JSON.stringify({ value: 'a'.repeat(17000) }),
        headers: { 'content-type': 'application/json' },
      })
    ).status(),
  ).toBe(413);
  expect((await request.get(`${service.url}/unknown`)).status()).toBe(404);
  expect((await request.put(`${service.url}/products`, { data: {} })).status()).toBe(405);
});

test('[API-01] invalid updates and nonexistent order operations do not change persisted state', async ({
  service,
  request,
}) => {
  const response = await request.post(`${service.url}/orders`, { data: orderInput });
  const order = (await response.json()) as { id: number };
  expect(
    (
      await request.patch(`${service.url}/orders/${order.id}`, { data: { status: 'fake' } })
    ).status(),
  ).toBe(400);
  expect(await (await request.get(`${service.url}/orders/${order.id}`)).json()).toEqual(order);
  expect((await request.get(`${service.url}/orders/0`)).status()).toBe(400);
  expect(
    (await request.patch(`${service.url}/orders/999`, { data: { status: 'completed' } })).status(),
  ).toBe(404);
  expect((await request.delete(`${service.url}/orders/999`)).status()).toBe(404);
});
