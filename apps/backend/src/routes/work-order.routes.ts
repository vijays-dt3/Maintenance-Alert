// apps/backend/src/routes/work-order.routes.ts
import { Router } from 'express';
import { WorkOrderController } from '../controllers/work-order.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  closeWorkOrderSchema,
  createWorkOrderSchema,
  updateWorkOrderSchema,
  updateWorkOrderStatusSchema,
  workOrderPartItemSchema,
} from '../validators/work-order.validator.js';

export const workOrderRouter = Router();

workOrderRouter.use(authMiddleware);

workOrderRouter.get('/', WorkOrderController.list);
workOrderRouter.get('/:id', WorkOrderController.getById);

workOrderRouter.post(
  '/',
  requireRole('MAINTENANCE_ENGINEER'),
  validateBody(createWorkOrderSchema),
  WorkOrderController.create
);

workOrderRouter.put(
  '/:id',
  requireRole('MAINTENANCE_ENGINEER'),
  validateBody(updateWorkOrderSchema),
  WorkOrderController.update
);

workOrderRouter.put(
  '/:id/status',
  requireRole('MAINTENANCE_ENGINEER'),
  validateBody(updateWorkOrderStatusSchema),
  WorkOrderController.updateStatus
);

workOrderRouter.put(
  '/:id/close',
  requireRole('MAINTENANCE_ENGINEER'),
  validateBody(closeWorkOrderSchema),
  WorkOrderController.close
);

workOrderRouter.post(
  '/:id/parts',
  requireRole('MAINTENANCE_ENGINEER'),
  validateBody(workOrderPartItemSchema),
  WorkOrderController.addPart
);

workOrderRouter.delete(
  '/:id/parts/:partId',
  requireRole('MAINTENANCE_ENGINEER'),
  WorkOrderController.removePart
);
