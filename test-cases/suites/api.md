# Independent companion REST / SQLite test cases

13 cases mapped to existing automation. [Catalog index](../README.md).

## TC-049 — health and deterministic products are independent of SauceDemo

| Field                     | Value                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Requirement               | API-01                                                                                                         |
| Priority                  | Normal                                                                                                         |
| Preconditions             | Node 24; a fresh fixture-owned companion database and loopback service. This is not SauceDemo backend testing. |
| Test data                 | See case steps and automation source.                                                                          |
| Automation                | [tests/api/orders.spec.ts](../../tests/api/orders.spec.ts)                                                     |
| Project                   | api                                                                                                            |
| Run suite                 | `npm run test:api`                                                                                             |
| Last saved outcome        | passed                                                                                                         |
| Previous headless outcome | passed                                                                                                         |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                                         |

Steps:

1. Start an isolated local companion service/database.
2. GET /health; GET /products; GET /orders.

Expected results:

- Health is 200 with {status:ok, service:independent-companion}.
- Products is 200 with Companion Backpack (id 1, 2999 cents) and Companion Bike Light (id 2, 999 cents).
- Initial order list is empty.

## TC-050 — create, read, update and delete order with calculated cents

| Field                     | Value                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Requirement               | API-01                                                                                                         |
| Priority                  | Normal                                                                                                         |
| Preconditions             | Node 24; a fresh fixture-owned companion database and loopback service. This is not SauceDemo backend testing. |
| Test data                 | Customer Ada / Lovelace / 560001; items [{productId:1, quantity:2}, {productId:2, quantity:1}]                 |
| Automation                | [tests/api/orders.spec.ts](../../tests/api/orders.spec.ts)                                                     |
| Project                   | api                                                                                                            |
| Run suite                 | `npm run test:api`                                                                                             |
| Last saved outcome        | passed                                                                                                         |
| Previous headless outcome | passed                                                                                                         |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                                         |

Steps:

1. POST /orders with valid order data.
2. Check response schema, totalCents and Location.
3. GET the created order.
4. PATCH status to completed.
5. DELETE the order, then GET it and list orders.

Expected results:

- POST is 201 with a valid ID/status/customer/items/totalCents response and totalCents = 6997.
- Location points to /orders/<id>; GET is 200 with the same body.
- PATCH is 200 and status is completed.
- DELETE is 204, subsequent GET is 404 and list is empty.

## TC-051 — SQLite order survives closing and reopening its database

| Field                     | Value                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Requirement               | API-02                                                                                                         |
| Priority                  | Normal                                                                                                         |
| Preconditions             | Node 24; a fresh fixture-owned companion database and loopback service. This is not SauceDemo backend testing. |
| Test data                 | Customer Ada / Lovelace / 560001; items [{productId:1, quantity:2}, {productId:2, quantity:1}]                 |
| Automation                | [tests/api/orders.spec.ts](../../tests/api/orders.spec.ts)                                                     |
| Project                   | api                                                                                                            |
| Run suite                 | `npm run test:api`                                                                                             |
| Last saved outcome        | passed                                                                                                         |
| Previous headless outcome | passed                                                                                                         |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                                         |

Steps:

1. POST a valid order into an isolated database.
2. Save the returned order; close the service and database.
3. Reopen the same SQLite file through OrderStore and fetch the order.
4. Close the reopened database.

Expected results:

- POST returns 201.
- Reopened SQLite returns the same persisted order.

## TC-052 — rejects empty items without persisting an order

| Field                     | Value                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Requirement               | API-01                                                                                                              |
| Priority                  | Normal                                                                                                              |
| Preconditions             | Node 24; a fresh fixture-owned companion database and loopback service. This is not SauceDemo backend testing.      |
| Test data                 | Customer Ada / Lovelace / 560001; items [{productId:1, quantity:2}, {productId:2, quantity:1}]; override: items: [] |
| Automation                | [tests/api/orders.spec.ts](../../tests/api/orders.spec.ts)                                                          |
| Project                   | api                                                                                                                 |
| Run suite                 | `npm run test:api`                                                                                                  |
| Last saved outcome        | passed                                                                                                              |
| Previous headless outcome | passed                                                                                                              |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                                              |

Steps:

1. Start an isolated empty local companion database.
2. POST /orders with valid data modified by the specified invalid input.
3. Inspect response; GET /orders.

Expected results:

- POST is 400 with an error property.
- Order list remains empty; invalid data is not persisted.

## TC-053 — rejects zero quantity without persisting an order

| Field                     | Value                                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Requirement               | API-01                                                                                                                            |
| Priority                  | Normal                                                                                                                            |
| Preconditions             | Node 24; a fresh fixture-owned companion database and loopback service. This is not SauceDemo backend testing.                    |
| Test data                 | Customer Ada / Lovelace / 560001; items [{productId:1, quantity:2}, {productId:2, quantity:1}]; override: productId 1, quantity 0 |
| Automation                | [tests/api/orders.spec.ts](../../tests/api/orders.spec.ts)                                                                        |
| Project                   | api                                                                                                                               |
| Run suite                 | `npm run test:api`                                                                                                                |
| Last saved outcome        | passed                                                                                                                            |
| Previous headless outcome | passed                                                                                                                            |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                                                            |

Steps:

1. Start an isolated empty local companion database.
2. POST /orders with valid data modified by the specified invalid input.
3. Inspect response; GET /orders.

Expected results:

- POST is 400 with an error property.
- Order list remains empty; invalid data is not persisted.

## TC-054 — rejects fractional quantity without persisting an order

| Field                     | Value                                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Requirement               | API-01                                                                                                                              |
| Priority                  | Normal                                                                                                                              |
| Preconditions             | Node 24; a fresh fixture-owned companion database and loopback service. This is not SauceDemo backend testing.                      |
| Test data                 | Customer Ada / Lovelace / 560001; items [{productId:1, quantity:2}, {productId:2, quantity:1}]; override: productId 1, quantity 1.5 |
| Automation                | [tests/api/orders.spec.ts](../../tests/api/orders.spec.ts)                                                                          |
| Project                   | api                                                                                                                                 |
| Run suite                 | `npm run test:api`                                                                                                                  |
| Last saved outcome        | passed                                                                                                                              |
| Previous headless outcome | passed                                                                                                                              |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                                                              |

Steps:

1. Start an isolated empty local companion database.
2. POST /orders with valid data modified by the specified invalid input.
3. Inspect response; GET /orders.

Expected results:

- POST is 400 with an error property.
- Order list remains empty; invalid data is not persisted.

## TC-055 — rejects excess quantity without persisting an order

| Field                     | Value                                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Requirement               | API-01                                                                                                                              |
| Priority                  | Normal                                                                                                                              |
| Preconditions             | Node 24; a fresh fixture-owned companion database and loopback service. This is not SauceDemo backend testing.                      |
| Test data                 | Customer Ada / Lovelace / 560001; items [{productId:1, quantity:2}, {productId:2, quantity:1}]; override: productId 1, quantity 101 |
| Automation                | [tests/api/orders.spec.ts](../../tests/api/orders.spec.ts)                                                                          |
| Project                   | api                                                                                                                                 |
| Run suite                 | `npm run test:api`                                                                                                                  |
| Last saved outcome        | passed                                                                                                                              |
| Previous headless outcome | passed                                                                                                                              |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                                                              |

Steps:

1. Start an isolated empty local companion database.
2. POST /orders with valid data modified by the specified invalid input.
3. Inspect response; GET /orders.

Expected results:

- POST is 400 with an error property.
- Order list remains empty; invalid data is not persisted.

## TC-056 — rejects unknown product without persisting an order

| Field                     | Value                                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Requirement               | API-01                                                                                                                              |
| Priority                  | Normal                                                                                                                              |
| Preconditions             | Node 24; a fresh fixture-owned companion database and loopback service. This is not SauceDemo backend testing.                      |
| Test data                 | Customer Ada / Lovelace / 560001; items [{productId:1, quantity:2}, {productId:2, quantity:1}]; override: productId 999, quantity 1 |
| Automation                | [tests/api/orders.spec.ts](../../tests/api/orders.spec.ts)                                                                          |
| Project                   | api                                                                                                                                 |
| Run suite                 | `npm run test:api`                                                                                                                  |
| Last saved outcome        | passed                                                                                                                              |
| Previous headless outcome | passed                                                                                                                              |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                                                              |

Steps:

1. Start an isolated empty local companion database.
2. POST /orders with valid data modified by the specified invalid input.
3. Inspect response; GET /orders.

Expected results:

- POST is 400 with an error property.
- Order list remains empty; invalid data is not persisted.

## TC-057 — rejects duplicate product without persisting an order

| Field                     | Value                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requirement               | API-01                                                                                                                                                  |
| Priority                  | Normal                                                                                                                                                  |
| Preconditions             | Node 24; a fresh fixture-owned companion database and loopback service. This is not SauceDemo backend testing.                                          |
| Test data                 | Customer Ada / Lovelace / 560001; items [{productId:1, quantity:2}, {productId:2, quantity:1}]; override: productId 1 appears twice, quantities 1 and 2 |
| Automation                | [tests/api/orders.spec.ts](../../tests/api/orders.spec.ts)                                                                                              |
| Project                   | api                                                                                                                                                     |
| Run suite                 | `npm run test:api`                                                                                                                                      |
| Last saved outcome        | passed                                                                                                                                                  |
| Previous headless outcome | passed                                                                                                                                                  |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                                                                                  |

Steps:

1. Start an isolated empty local companion database.
2. POST /orders with valid data modified by the specified invalid input.
3. Inspect response; GET /orders.

Expected results:

- POST is 400 with an error property.
- Order list remains empty; invalid data is not persisted.

## TC-058 — rejects blank customer without persisting an order

| Field                     | Value                                                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Requirement               | API-01                                                                                                                                    |
| Priority                  | Normal                                                                                                                                    |
| Preconditions             | Node 24; a fresh fixture-owned companion database and loopback service. This is not SauceDemo backend testing.                            |
| Test data                 | Customer Ada / Lovelace / 560001; items [{productId:1, quantity:2}, {productId:2, quantity:1}]; override: firstName contains three spaces |
| Automation                | [tests/api/orders.spec.ts](../../tests/api/orders.spec.ts)                                                                                |
| Project                   | api                                                                                                                                       |
| Run suite                 | `npm run test:api`                                                                                                                        |
| Last saved outcome        | passed                                                                                                                                    |
| Previous headless outcome | passed                                                                                                                                    |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                                                                    |

Steps:

1. Start an isolated empty local companion database.
2. POST /orders with valid data modified by the specified invalid input.
3. Inspect response; GET /orders.

Expected results:

- POST is 400 with an error property.
- Order list remains empty; invalid data is not persisted.

## TC-059 — rejects unexpected property without persisting an order

| Field                     | Value                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Requirement               | API-01                                                                                                                                |
| Priority                  | Normal                                                                                                                                |
| Preconditions             | Node 24; a fresh fixture-owned companion database and loopback service. This is not SauceDemo backend testing.                        |
| Test data                 | Customer Ada / Lovelace / 560001; items [{productId:1, quantity:2}, {productId:2, quantity:1}]; override: extra top-level admin: true |
| Automation                | [tests/api/orders.spec.ts](../../tests/api/orders.spec.ts)                                                                            |
| Project                   | api                                                                                                                                   |
| Run suite                 | `npm run test:api`                                                                                                                    |
| Last saved outcome        | passed                                                                                                                                |
| Previous headless outcome | passed                                                                                                                                |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                                                                |

Steps:

1. Start an isolated empty local companion database.
2. POST /orders with valid data modified by the specified invalid input.
3. Inspect response; GET /orders.

Expected results:

- POST is 400 with an error property.
- Order list remains empty; invalid data is not persisted.

## TC-060 — malformed JSON, media type, payload size and routes return explicit errors

| Field                     | Value                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Requirement               | API-01                                                                                                         |
| Priority                  | Normal                                                                                                         |
| Preconditions             | Node 24; a fresh fixture-owned companion database and loopback service. This is not SauceDemo backend testing. |
| Test data                 | See case steps and automation source.                                                                          |
| Automation                | [tests/api/orders.spec.ts](../../tests/api/orders.spec.ts)                                                     |
| Project                   | api                                                                                                            |
| Run suite                 | `npm run test:api`                                                                                             |
| Last saved outcome        | passed                                                                                                         |
| Previous headless outcome | passed                                                                                                         |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                                         |

Steps:

1. POST /orders with {broken as application/json.
2. POST plain text with its default media type.
3. POST JSON containing a 17000-character value.
4. GET /unknown; PUT /products.

Expected results:

- Responses are respectively 400, 415, 413, 404 and 405.

## TC-061 — invalid updates and nonexistent order operations do not change persisted state

| Field                     | Value                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Requirement               | API-01                                                                                                         |
| Priority                  | Normal                                                                                                         |
| Preconditions             | Node 24; a fresh fixture-owned companion database and loopback service. This is not SauceDemo backend testing. |
| Test data                 | Customer Ada / Lovelace / 560001; items [{productId:1, quantity:2}, {productId:2, quantity:1}]                 |
| Automation                | [tests/api/orders.spec.ts](../../tests/api/orders.spec.ts)                                                     |
| Project                   | api                                                                                                            |
| Run suite                 | `npm run test:api`                                                                                             |
| Last saved outcome        | passed                                                                                                         |
| Previous headless outcome | passed                                                                                                         |
| Evidence                  | [Saved execution](../../docs/evidence/headed-portfolio-execution.json)                                         |

Steps:

1. Create a valid order.
2. PATCH its status to fake, then GET it.
3. GET /orders/0.
4. PATCH and DELETE /orders/999.

Expected results:

- Invalid PATCH is 400 and the existing order is unchanged.
- Invalid ID 0 is 400.
- Nonexistent PATCH and DELETE are 404.
