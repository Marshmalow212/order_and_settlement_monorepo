import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';

const router = Router();

router.get('/', OrderController.list);
router.get('/:id', OrderController.getById);
router.post('/', OrderController.create);

export const orderRouter = router;
