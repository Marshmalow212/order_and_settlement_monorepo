import { Router } from 'express';
import { LineItemController } from '../controllers/line-item.controller.js';

const router = Router();

router.get('/order/:orderId', LineItemController.getByOrderId);
router.get('/', LineItemController.list);
router.get('/:id', LineItemController.getById);
router.post('/', LineItemController.create);
router.put('/:id', LineItemController.update);
router.delete('/:id', LineItemController.remove);

export const lineItemRouter = router;
