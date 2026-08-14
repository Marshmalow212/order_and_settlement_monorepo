import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config.js';

const basePath = `/api/${config.server.version}`;

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Order Settlement API',
    version: '1.0.0',
    description: 'API documentation for auth, users, orders, line items, payments, and audit logs.',
  },
  servers: [
    {
      url: `http://localhost:${config.server.port}${basePath}`,
      description: 'Local development server (container)',
    },{
      url: `http://localhost:7101${basePath}`,
      description: 'Local development server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Users', description: 'User management endpoints' },
    { name: 'Orders', description: 'Order management endpoints' },
    { name: 'Line Items', description: 'Line item management endpoints' },
    { name: 'Payments', description: 'Payment transaction endpoints' },
    { name: 'Audit Logs', description: 'Audit log management endpoints' },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'john@example.com' },
                  password: { type: 'string', example: 'secret123' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User registered successfully' },
          '400': { description: 'Validation error' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'john@example.com' },
                  password: { type: 'string', example: 'secret123' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users',
        responses: { '200': { description: 'Users retrieved successfully' } },
      },
      post: {
        tags: ['Users'],
        summary: 'Create user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'User created' }, '400': { description: 'Bad request' } },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'User found' }, '404': { description: 'User not found' } },
      },
      put: {
        tags: ['Users'],
        summary: 'Update user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '200': { description: 'User updated' }, '404': { description: 'User not found' } },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '204': { description: 'User deleted' }, '404': { description: 'User not found' } },
      },
    },
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List orders for acting user',
        description: 'Returns orders owned by the acting user (middleware injects userId for now).',
        responses: { '200': { description: 'Orders retrieved successfully' } },
      },
      post: {
        tags: ['Orders'],
        summary: 'Create an order with nested line items',
        description: 'Create the order and its line items in one request. The order total and status are recalculated after creation.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customerName', 'lineItems'],
                properties: {
                  userId: { type: 'integer', nullable: true, example: 1 },
                  customerName: { type: 'string', example: 'Alice Smith' },
                  status: {
                    type: 'string',
                    enum: ['pending', 'partially_paid', 'paid', 'overdue'],
                    example: 'pending',
                  },
                  dueDate: { type: 'string', format: 'date-time', example: '2026-08-25T00:00:00.000Z' },
                  total: { type: 'number', example: 145 },
                  lineItems: {
                    type: 'array',
                    example: [
                      { description: 'Keyboard', unitPrice: 40, quantity: 1 },
                      { description: 'Mouse', unitPrice: 25, quantity: 2 },
                      { description: 'Monitor', unitPrice: 55, quantity: 1 },
                    ],
                    items: {
                      type: 'object',
                      required: ['description', 'unitPrice', 'quantity'],
                      properties: {
                        description: { type: 'string', example: 'Keyboard' },
                        unitPrice: { type: 'number', example: 40 },
                        quantity: { type: 'integer', example: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Order created' }, '400': { description: 'Bad request' } },
      },
    },
    '/orders/operation_summary': {
      get: {
        tags: ['Orders'],
        summary: 'Operation summary for acting user',
        description: 'Returns aggregated metrics for the acting user: counts and sums for orders and payments.',
        responses: {
          '200': {
            description: 'Operation summary retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ordersCount: { type: 'integer', example: 12 },
                    ordersTotalAmount: { type: 'number', example: 1250.5 },
                    paymentsTotalAmount: { type: 'number', example: 800.25 },
                    ordersPaid: { type: 'integer', example: 5 },
                    ordersPending: { type: 'integer', example: 6 },
                    ordersOverdue: { type: 'integer', example: 1 },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Order found' },
          '404': { description: 'Order not found' },
        },
      },
      put: {
        tags: ['Orders'],
        summary: 'Update order details or replace line items while the order is pending',
        description: 'This update is allowed only when the current order status is pending. You may update fields or replace the full lineItems list for that order.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  customerName: { type: 'string', example: 'Alice Smith' },
                  status: {
                    type: 'string',
                    enum: ['pending', 'partially_paid', 'paid', 'overdue'],
                    example: 'pending',
                  },
                  total: { type: 'number', example: 145 },
                  amountPaid: { type: 'number', example: 80 },
                  dueDate: { type: 'string', format: 'date-time', example: '2026-08-25T00:00:00.000Z' },
                  lineItems: {
                    type: 'array',
                    description: 'Replace the order line items only when the order is pending',
                    items: {
                      type: 'object',
                      required: ['description', 'unitPrice', 'quantity'],
                      properties: {
                        description: { type: 'string', example: 'Keyboard' },
                        unitPrice: { type: 'number', example: 40 },
                        quantity: { type: 'integer', example: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Order updated' }, '404': { description: 'Order not found or update not allowed' } },
      },
      delete: {
        tags: ['Orders'],
        summary: 'Delete order',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '204': { description: 'Order deleted' }, '404': { description: 'Order not found' } },
      },
    },
    '/line-items': {
      get: {
        tags: ['Line Items'],
        summary: 'List all line items',
        responses: { '200': { description: 'Line items retrieved successfully' } },
      },
      post: {
        tags: ['Line Items'],
        summary: 'Add a line item to an existing order',
        description: 'Create a line item using an existing orderId. The parent order total, amount due, and status are recalculated automatically.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['description', 'unitPrice', 'quantity', 'orderId'],
                properties: {
                  description: { type: 'string', example: 'Keyboard' },
                  unitPrice: { type: 'number', example: 40 },
                  quantity: { type: 'integer', example: 1 },
                  orderId: { type: 'integer', example: 1 },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Line item created' } },
      },
    },
    '/line-items/order/{orderId}': {
      get: {
        tags: ['Line Items'],
        summary: 'Get line items by order id',
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Line items for the order retrieved successfully' }, '400': { description: 'Invalid orderId parameter' } },
      },
    },
    '/line-items/{id}': {
      get: {
        tags: ['Line Items'],
        summary: 'Get line item by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Line item found' }, '404': { description: 'Line item not found' } },
      },
      put: {
        tags: ['Line Items'],
        summary: 'Update line item',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '200': { description: 'Line item updated' }, '404': { description: 'Line item not found' } },
      },
      delete: {
        tags: ['Line Items'],
        summary: 'Delete line item',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '204': { description: 'Line item deleted' }, '404': { description: 'Line item not found' } },
      },
    },
    '/payments': {
      get: {
        tags: ['Payments'],
        summary: 'List all payment transactions',
        responses: { '200': { description: 'Payment transactions retrieved successfully' } },
      },
      post: {
        tags: ['Payments'],
        summary: 'Create payment transaction',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['orderId', 'paymentAmount'],
                properties: {
                  userId: { type: 'integer', nullable: true, example: 1 },
                  orderId: { type: 'integer', example: 1 },
                  paymentAmount: { type: 'number', example: 75.25 },
                  note: { type: 'string', nullable: true, example: 'Partial payment' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Payment created' }, '400': { description: 'Bad request' } },
      },
    },
    '/payments/order/{orderId}': {
      get: {
        tags: ['Payments'],
        summary: 'Get payment transactions by order id',
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Payment transactions for the order retrieved successfully' }, '400': { description: 'Invalid orderId parameter' } },
      },
    },
    '/payments/{id}': {
      get: {
        tags: ['Payments'],
        summary: 'Get payment by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Payment found' }, '404': { description: 'Payment not found' } },
      },
      put: {
        tags: ['Payments'],
        summary: 'Update payment',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '200': { description: 'Payment updated' }, '404': { description: 'Payment not found' } },
      },
      delete: {
        tags: ['Payments'],
        summary: 'Delete payment',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '204': { description: 'Payment deleted' }, '404': { description: 'Payment not found' } },
      },
    },
    '/audit-logs': {
      get: {
        tags: ['Audit Logs'],
        summary: 'List audit logs',
        responses: { '200': { description: 'Audit logs retrieved successfully' } },
      },
      post: {
        tags: ['Audit Logs'],
        summary: 'Create audit log',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount', 'items', 'status'],
                properties: {
                  userId: { type: 'integer', nullable: true, example: 1 },
                  orderId: { type: 'integer', nullable: true, example: 1 },
                  amount: { type: 'number', example: 25.5 },
                  items: { type: 'integer', example: 2 },
                  status: { type: 'integer', example: 1 },
                  lastPaymentDate: { type: 'string', format: 'date-time', nullable: true },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Audit log created' }, '400': { description: 'Bad request' } },
      },
    },
    '/audit-logs/user/{userId}': {
      get: {
        tags: ['Audit Logs'],
        summary: 'Get audit logs by user id',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Audit logs for user retrieved successfully' }, '400': { description: 'Invalid userId parameter' } },
      },
    },
    '/audit-logs/user/{userId}/order/{orderId}': {
      get: {
        tags: ['Audit Logs'],
        summary: 'Get audit logs by user id and order id',
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'orderId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Audit logs for user+order retrieved successfully' }, '400': { description: 'Invalid parameters' } },
      },
    },
    '/audit-logs/{id}': {
      get: {
        tags: ['Audit Logs'],
        summary: 'Get audit log by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Audit log found' }, '404': { description: 'Audit log not found' } },
      },
      put: {
        tags: ['Audit Logs'],
        summary: 'Update audit log',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '200': { description: 'Audit log updated' }, '404': { description: 'Audit log not found' } },
      },
      delete: {
        tags: ['Audit Logs'],
        summary: 'Delete audit log',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '204': { description: 'Audit log deleted' }, '404': { description: 'Audit log not found' } },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [],
});
