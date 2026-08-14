import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';

const router = Router();

router.get('/', OrderController.list);
router.get('/operation_summary', OrderController.operationSummary);
router.get('/:id', OrderController.getById);
router.post('/', OrderController.create);
router.put('/:id', OrderController.update);
router.delete('/:id', OrderController.remove);

export const orderRouter = router;
