import router from 'express';
import {HealthController} from '../controllers/health.controller.js';


const healthRouter = router();

healthRouter.get('/check', HealthController.check);

export { healthRouter };