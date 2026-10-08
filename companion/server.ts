import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { once } from 'node:events';
import { Ajv } from 'ajv';
import { OrderStore, type OrderInput, type Order } from './store';

const ajv = new Ajv({ allErrors: true });
const nonempty = { type: 'string', minLength: 1, maxLength: 100, pattern: '\\S' };
const validateOrder = ajv.compile<OrderInput>({
  type: 'object',
  additionalProperties: false,
  required: ['customer', 'items'],
  properties: {
    customer: {
      type: 'object',
      additionalProperties: false,
      required: ['firstName', 'lastName', 'postalCode'],
      properties: { firstName: nonempty, lastName: nonempty, postalCode: nonempty },
    },
    items: {
      type: 'array',
      minItems: 1,
      maxItems: 10,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['productId', 'quantity'],
        properties: {
          productId: { type: 'integer', minimum: 1 },
          quantity: { type: 'integer', minimum: 1, maximum: 100 },
        },
      },
    },
  },
});
const validateStatus = ajv.compile<{ status: Order['status'] }>({
  type: 'object',
  additionalProperties: false,
  required: ['status'],
  properties: { status: { enum: ['pending', 'completed', 'cancelled'] } },
});
class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function body(request: IncomingMessage): Promise<unknown> {
  if (!request.headers['content-type']?.startsWith('application/json'))
    throw new ApiError(415, 'Use application/json');
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk as Uint8Array);
    size += buffer.length;
    if (size > 16_384) throw new ApiError(413, 'Body too large');
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString()) as unknown;
  } catch {
    throw new ApiError(400, 'Malformed JSON');
  }
}
function send(response: ServerResponse, status: number, value?: unknown) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(value === undefined ? undefined : JSON.stringify(value));
}

export async function startCompanion(filename: string, port = 0) {
  const store = new OrderStore(filename);
  const server = createServer((request, response) => {
    void (async () => {
      const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
      const method = request.method ?? 'GET';
      if (pathname === '/health' && method === 'GET')
        return send(response, 200, { status: 'ok', service: 'independent-companion' });
      if (pathname === '/products' && method === 'GET')
        return send(response, 200, store.products());
      if (pathname === '/orders' && method === 'GET') return send(response, 200, store.orders());
      if (pathname === '/orders' && method === 'POST') {
        const input = await body(request);
        if (!validateOrder(input)) throw new ApiError(400, 'Invalid order schema');
        if (new Set(input.items.map((item) => item.productId)).size !== input.items.length)
          throw new ApiError(400, 'Duplicate product');
        if (
          input.items.some(
            (item) => !store.products().some((product) => product.id === item.productId),
          )
        )
          throw new ApiError(400, 'Unknown product');
        const order = store.create(input);
        response.setHeader('location', `/orders/${order.id}`);
        return send(response, 201, order);
      }
      const match = pathname.match(/^\/orders\/(\d+)$/);
      if (match) {
        const id = Number(match[1]);
        if (!Number.isSafeInteger(id) || id < 1) throw new ApiError(400, 'Invalid order ID');
        const existing = store.get(id);
        if (!existing) throw new ApiError(404, 'Order not found');
        if (method === 'GET') return send(response, 200, existing);
        if (method === 'PATCH') {
          const input = await body(request);
          if (!validateStatus(input)) throw new ApiError(400, 'Invalid status schema');
          return send(response, 200, store.update(id, input.status));
        }
        if (method === 'DELETE') {
          store.delete(id);
          return send(response, 204);
        }
        throw new ApiError(405, 'Method not allowed');
      }
      if (['/health', '/products', '/orders'].includes(pathname))
        throw new ApiError(405, 'Method not allowed');
      throw new ApiError(404, 'Route not found');
    })().catch((error: unknown) => {
      if (error instanceof ApiError) send(response, error.status, { error: error.message });
      else {
        console.error('Companion server error', error);
        send(response, 500, { error: 'Internal server error' });
      }
    });
  });
  server.listen(port, '127.0.0.1');
  try {
    await once(server, 'listening');
  } catch (error) {
    store.close();
    throw error;
  }
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing companion address');
  let closed = false;
  return {
    url: `http://127.0.0.1:${address.port}`,
    store,
    close: async () => {
      if (closed) return;
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      store.close();
      closed = true;
    },
  };
}
