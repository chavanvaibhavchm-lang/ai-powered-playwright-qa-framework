# Independent local companion API

This service demonstrates offline API/SQLite testing. It is **not SauceDemo's
backend**. Seeded products use their own names and database. No real payments,
authentication, production scaling or deployment are provided.

Requires Node 24; `node:sqlite` is built in and emits an experimental warning on
the verified Node 24.14.0 runtime. No native addon build or external database is required.

```powershell
npm run test:api
# Optional interactive development service:
npm run companion:start
```

Interactive service binds `127.0.0.1:3001` and persists `.local/orders.sqlite`.
API tests instead use port 0 (OS assigns a free port) and a fresh SQLite file per
test in ignored test artifacts. Teardown closes HTTP server and database even
when assertions fail. Persistence is verified by closing and reopening SQLite.

| Method | Route         | Behavior                                                         |
| ------ | ------------- | ---------------------------------------------------------------- |
| GET    | `/health`     | 200 and independent service identity                             |
| GET    | `/products`   | 200, deterministic read-only products, integer cents             |
| GET    | `/orders`     | 200, persisted orders                                            |
| POST   | `/orders`     | 201, validated customer/items, calculated total, Location header |
| GET    | `/orders/:id` | 200 existing / 404 missing                                       |
| PATCH  | `/orders/:id` | 200, status pending/completed/cancelled; 400 invalid             |
| DELETE | `/orders/:id` | 204 deleted / 404 missing                                        |

POST shape:

```json
{
  "customer": { "firstName": "Ada", "lastName": "Lovelace", "postalCode": "560001" },
  "items": [{ "productId": 1, "quantity": 2 }]
}
```

Validation: nonblank customer fields ≤100 characters, 1–10 unique product lines,
integer quantity 1–100, known products, no extra properties. Wrong media type:
415; malformed JSON/schema: 400; body larger than 16 KiB: 413; unimplemented
routes: 404; unsupported methods: 405. Status changes have no business workflow
restriction beyond the enum; the service is a test companion, not an order system.
Totals use integer cents with no fabricated SauceDemo tax/backend relationship.
