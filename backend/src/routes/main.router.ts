import router from 'express';
import { orderRouter } from './order.routes.js';
import { healthRouter } from './health.routes.js';


const mainRouter = router();

mainRouter.use('/orders', orderRouter);
mainRouter.use('/health', healthRouter);

export { mainRouter };