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
- No authentication header is enforced by these endpoints in the current implementation. If you have an authenticated front-end, include the user's id in request bodies where relevant (see flows below).
- The database stores `order_status` as an integer. API responses map that integer to a string label: 0 = `pending`, 1 = `partially_paid`, 2 = `paid`, 3 = `overdue`.
- Where the backend does not record `userId` directly on an `Order` or `PaymentTransaction`, we recommend using `AuditLog` entries to link a user to an order/payment.

Common headers
- `Content-Type: application/json`

Models (summary)
- Order (response): { id, customerName, status, total, createdAt, dueDate, amountPaid, amountDue, totalItems }
- LineItem (create payload): { description, unitPrice, quantity, orderId }
- Payment create payload: { orderId, paymentAmount, note }
- AuditLog (create payload): { userId?, orderId?, amount, items, status, lastPaymentDate? }

---

1) Order creation with line items

- Endpoint
  - POST /orders
  - Full path: `{base}/orders`

- Request body
```json
{
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
  - The backend also creates an `AuditLog` entry for the creation (userId currently null by default). If you want to record which user created the order, make a separate `POST /audit-logs` after order creation with `userId` and `orderId`.

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

There is no direct `GET /orders?userId=...` endpoint in the current implementation because the `Order` model does not contain `userId`. Recommended frontend approaches:

A) Find orders touched by a user using AuditLog (recommended):
  1. GET /audit-logs/user/{userId} → receives audit entries containing `orderId`.
  2. For each unique `orderId` call GET /orders/{id} to fetch order details.

- Endpoints used
  - GET /audit-logs/user/{userId}
  - GET /orders/{id}

- Example sequence (pseudo-code)
```js
// 1) Get audit log entries for user
const logs = await fetch(`${base}/audit-logs/user/${userId}`).then(r => r.json());
const orderIds = [...new Set(logs.map(l => l.orderId).filter(Boolean))];
// 2) Fetch orders concurrently
const orders = await Promise.all(orderIds.map(id => fetch(`${base}/orders/${id}`).then(r => r.json())));
```

B) If you control backend changes: add a `userId` on `Order` or a dedicated `GET /orders?userId=` route — the repo currently does not provide this.

---

4) Payment Listing based on User

Payments do not include `userId` in the `PaymentTransaction` model. To list payments related to a user, tie the user to orders (via `AuditLog` or by adding `userId` to `Order`) and fetch payments per order:

- Recommended flow
  1. Get user-related orders (see step 3)
  2. For each order call GET /payments/order/{orderId}

- Endpoint
  - GET /payments/order/{orderId}

- Example (pseudo-code)
```js
const payments = [];
for (const order of orders) {
  const p = await fetch(`${base}/payments/order/${order.id}`).then(r => r.json());
  payments.push(...p);
}
```

---

5) Payment create based on User and Order

- Endpoint
  - POST /payments
  - Body: `{ orderId, paymentAmount, note? }`

- Example request
```json
{
  "orderId": 12,
  "paymentAmount": 50.0,
  "note": "Partial payment"
}
```

- Response (201)
```json
{
  "id": 7,
  "orderId": 12,
  "paymentAmount": 50.0,
  "paymentDate": "2026-08-14T12:15:00.000Z",
  "note": "Partial payment",
  "createdAt": "2026-08-14T12:15:00.000Z",
  "updatedAt": "2026-08-14T12:15:00.000Z"
}
```

- Recording the acting user
  - The payment model currently does not record `userId`. To associate the payment with a user in the frontend flow, POST an `AuditLog` after creating the payment:
    - POST /audit-logs with `{ userId, orderId, amount: paymentAmount, items: 0, status: currentOrderStatus }`.

---

6) Audit logs listing based on User

- Endpoint(s)
  - GET /audit-logs/user/{userId}            — all audit logs for a user
  - GET /audit-logs/user/{userId}/order/{orderId} — audit logs for a user filtered to a specific order

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

async function getOrdersForUser(userId) {
  const logs = await fetch(`${base}/audit-logs/user/${userId}`).then(r => r.json());
  const ids = [...new Set(logs.map(l => l.orderId).filter(Boolean))];
  return Promise.all(ids.map(id => fetch(`${base}/orders/${id}`).then(r => r.json())));
}
```

Notes & next steps
- If your frontend requires first-class `userId` on `Order` and `PaymentTransaction`, consider a small backend change to add `userId` to `orders` or `payments` or provide query endpoints like `GET /orders?userId=` and `GET /payments?userId=`. That will simplify list operations and avoid multiple round-trips.
- If you want, I can also generate OpenAPI/Swagger snippets or Postman collection from the current `src/swagger.ts` definitions.

---

File created: `docs/API_INTEGRATION.md`
