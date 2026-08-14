import { Router } from 'express';
import { PaymentTransactionController } from '../controllers/payment-transaction.controller.js';

const router = Router();

router.get('/order/:orderId', PaymentTransactionController.getByOrderId);
router.get('/', PaymentTransactionController.list);
router.get('/:id', PaymentTransactionController.getById);
router.post('/', PaymentTransactionController.create);
router.put('/:id', PaymentTransactionController.update);
router.delete('/:id', PaymentTransactionController.remove);

export const paymentTransactionRouter = router;
