# API Integration Guide

This document describes the HTTP API surface and recommended frontend integration patterns for:

1. Order creation with line items
2. Order update including line items update
3. Order listing based on user
4. Payment listing based on user
5. Payment create based on user and order
6. Audit logs listing based on user

Base URL
- Local (browser / host machine): `http://localhost:{PORT}/api/{VERSION}`
  - Example local defaults: `http://localhost:3001/api/v1` (replace `{PORT}` and `{VERSION}` depending on deployment or `src/config.ts`).
- Container-to-container (internal network): use the container name as the host and the service's internal port.
  - Example when calling from another container on the same Docker network: `http://order-settlement-backend:3000/api/v1` (container name `order-settlement-backend`, internal port `3000` per `docker-compose.yml`).

Notes
- Authentication & user scoping: all `Order`, `PaymentTransaction`, and `AuditLog` operations are user-scoped. The app currently uses a temporary acting-user middleware that injects `userId = 1` into every request; replace this with real auth in production. For now the frontend does not need to pass credentials — the server treats requests as coming from the acting user.
- Ownership enforcement: read/update/delete and list operations are restricted to resources owned by the acting user. Attempts to access or modify resources owned by another user will return `404` (or `403` for specific audit-log endpoints where applicable).
- Creation behavior: create endpoints accept an optional `userId` in the request body but will default to the acting user if omitted. The backend persists `userId` on created `Order` and `PaymentTransaction` records and includes it in responses.
- The database stores `order_status` as an integer. API responses map that integer to a string label: 0 = `pending`, 1 = `partially_paid`, 2 = `paid`, 3 = `overdue`.

Common headers
- `Content-Type: application/json`

Models (summary)
- Order (response): { id, userId?, customerName, status, total, createdAt, dueDate, amountPaid, amountDue, totalItems }
- LineItem (create payload): { description, unitPrice, quantity, orderId }
- Payment create payload: { userId?, orderId, paymentAmount, note }
- AuditLog (create payload): { userId?, orderId?, amount, items, status, lastPaymentDate? }

---

1) Order creation with line items

- Endpoint
  - POST /orders
  - Full path: `{base}/orders`

- Request body
```json
{
  "userId": 1,                 // optional: acting user will be used if omitted
  "customerName": "Jane Doe",
  "status": "pending",          // optional; accepts number or string
  "total": 0,                    // optional: derived on backend from lineItems
  "dueDate": "2026-12-31T00:00:00Z", // optional
  "lineItems": [
    { "description": "Keyboard", "unitPrice": 40, "quantity": 1 },
    { "description": "Mouse", "unitPrice": 25, "quantity": 2 }
  ]
}
```

- Response (201 Created)
```json
{
  "id": 12,
  "userId": 1,
  "customerName": "Jane Doe",
  "status": "pending",
  "total": 90.0,
  "createdAt": "2026-08-14T12:00:00.000Z",
  "dueDate": "2026-12-31T00:00:00.000Z",
  "amountPaid": 0,
  "amountDue": 90.0,
  "totalItems": 3
}
```

- Frontend notes
  - Backend creates the Order record, then creates the provided LineItems and recalculates totals.
  - The backend persists `userId` on the created order when provided, otherwise the acting user (1) is used.
  - The backend also creates an `AuditLog` entry for the creation and includes the order's `userId` (falls back to acting user 1).

---

2) Order update including line items update

- Endpoint
  - PUT /orders/{id}
  - Full path: `{base}/orders/{id}`

- Behavior / Constraints
  - If the order is not in `pending` status (DB numeric 0), replacing `lineItems` is disallowed and the update will fail.
  - You may update partial fields (customerName, status, total, amountPaid, dueDate) without sending lineItems.
  - To replace line items, send `lineItems` array; backend will delete existing items and recreate new ones.

- Request body (example replacing line items)
```json
{
  "customerName": "Jane Doe",
  "lineItems": [
    { "description": "Monitor", "unitPrice": 200, "quantity": 1 }
  ]
}
```

- Response (200)
Same shape as the Order response shown in (1).

- Frontend notes
  - Check `status` before attempting to replace line items. If the displayed `status` is not `pending`, disable line-item replacement UI or surface an error when the API returns 404 (update not allowed).
  - After a successful update the backend recalculates totals and may emit an audit log entry if `order_status` changed.

---

3) Order Listing based on User

GET /orders returns orders for the acting user (middleware-injected user). The frontend should call GET /orders (no userId query required) to list the current user's orders.

Example (pseudo-code) — current recommended flow to list the acting user's orders:
```js
const orders = await fetch(`${base}/orders`).then(r => r.json());
```

---

4) Payment Listing based on User

Payments persist an optional `userId` on creation. `GET /payments` and `GET /payments/order/{orderId}` return only payments belonging to the acting user. To list payments for the acting user:

```js
const payments = await fetch(`${base}/payments`).then(r => r.json());
```

To list payments for a specific order (acting user only):

```js
const payments = await fetch(`${base}/payments/order/${orderId}`).then(r => r.json());
```

---

5) Payment create based on User and Order

- Endpoint
  - POST /payments
  - Body: `{ userId?, orderId, paymentAmount, note? }`

- Example request
```json
{
  "userId": 1,
  "orderId": 12,
  "paymentAmount": 50.0,
  "note": "Partial payment"
}
```

- Response (201)
```json
{
  "id": 7,
  "userId": 1,
  "orderId": 12,
  "paymentAmount": 50.0,
  "paymentDate": "2026-08-14T12:15:00.000Z",
  "note": "Partial payment",
  "createdAt": "2026-08-14T12:15:00.000Z",
  "updatedAt": "2026-08-14T12:15:00.000Z"
}
```

- Recording the acting user
  - If `userId` is omitted when creating a payment, the acting user (1) is recorded. You may pass `userId` in the create body for clarity, but the server will use the acting user if omitted.
  - The backend also creates/maintains `AuditLog` records for payments and status changes.

Note: Payments that would exceed the order's `amountDue` are rejected with a 400 and message: "Payment amount exceeds amount due".
Also, `paymentAmount` must be numeric and greater than 0.1; otherwise the API returns 400 with message: "paymentAmount must be greater than 0.1".

Payment side-effects
- Each successful payment updates the parent `Order`: `amountPaid` is incremented, `amountDue` is recalculated, and `status` is updated according to business rules (pending, partially_paid, paid, overdue). The backend also records an `AuditLog` entry with the payment date.

Operation summary endpoint
- `GET /orders/operation_summary` — Returns aggregated metrics for the acting user (filtered by `userId`):
  - `ordersCount`: number of orders owned by the acting user
  - `ordersTotalAmount`: sum of all order totals for the acting user
  - `paymentsTotalAmount`: sum of all payments made by the acting user
  - `ordersPaid`: number of orders in `paid` status
  - `ordersPending`: number of orders in `pending` status
  - `ordersOverdue`: number of orders in `overdue` status

Example: `GET /orders/operation_summary` returns a JSON object with the fields above for the acting user (middleware injects `userId=1` by default in development).

---

6) Audit logs listing based on User

- Endpoint(s)
  - GET /audit-logs/user/{userId}            — all audit logs for a user (only allowed for acting user)
  - GET /audit-logs/user/{userId}/order/{orderId} — audit logs for a user filtered to a specific order (only allowed for acting user)

- Example response (array)
```json
[
  {
    "id": 101,
    "userId": 5,
    "orderId": 12,
    "amount": 90.0,
    "items": 3,
    "status": 0,
    "lastPaymentDate": null,
    "createdAt": "2026-08-14T12:00:01.000Z",
    "updatedAt": "2026-08-14T12:00:01.000Z"
  }
]
```

- Frontend usage
  - Use these endpoints to build user history, display recent orders the user touched, and show payment/audit timelines.

---

Status mapping reminder
- Database stores `order_status` as integer; API responses already map integers to labels in `status`.
- If you ever need the numeric status, `AuditLog.status` stores an integer; the `Order` response `status` is a label string.

Error handling patterns
- Typical failure responses: 400 for invalid parameters, 404 when resource not found or update is disallowed, 201 for successful creates, 200 for successful reads, 204 for deletes.
- For order update when the server disallows `lineItems` changes (non-pending) the API returns a 404 with message: "Order not found or update is not allowed while order is not pending".

Useful examples (fetch wrapper)
```js
const base = 'http://localhost:3001/api/v1';
async function createOrder(payload) {
  const res = await fetch(`${base}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  return res.json();
}

async function getOrdersForUser() {
  return fetch(`${base}/orders`).then(r => r.json());
}
```

Notes & next steps
- If your frontend requires admin-style queries for other users, consider adding dedicated admin endpoints (e.g., `GET /orders?userId=`) or expanding `GET /audit-logs` filtering.
- If you want, I can also generate OpenAPI/Swagger snippets or Postman collection from the current `src/swagger.ts` definitions.

---

File updated: `docs/API_INTEGRATION.md`
