import { Router } from 'express';
import { AuditLogController } from '../controllers/audit-log.controller.js';

const router = Router();

router.get('/user/:userId/order/:orderId', AuditLogController.getByUserAndOrder);
router.get('/user/:userId', AuditLogController.getByUserId);
router.get('/', AuditLogController.list);
router.get('/:id', AuditLogController.getById);
router.post('/', AuditLogController.create);
router.put('/:id', AuditLogController.update);
router.delete('/:id', AuditLogController.remove);

export const auditLogRouter = router;
