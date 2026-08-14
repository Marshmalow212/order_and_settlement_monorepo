import router from 'express';
import { auditLogRouter } from './audit-log.routes.js';
import { authRouter } from './auth.routes.js';
import { healthRouter } from './health.routes.js';
import { lineItemRouter } from './line-item.routes.js';
import { orderRouter } from './order.routes.js';
import { paymentTransactionRouter } from './payment-transaction.routes.js';
import { userRouter } from './user.routes.js';

const mainRouter = router();

mainRouter.use('/auth', authRouter);
mainRouter.use('/users', userRouter);
mainRouter.use('/orders', orderRouter);
mainRouter.use('/line-items', lineItemRouter);
mainRouter.use('/payments', paymentTransactionRouter);
mainRouter.use('/audit-logs', auditLogRouter);
mainRouter.use('/health', healthRouter);

export { mainRouter };