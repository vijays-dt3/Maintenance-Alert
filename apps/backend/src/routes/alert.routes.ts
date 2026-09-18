// apps/backend/src/routes/alert.routes.ts
import { Router } from 'express';
import { AlertController } from '../controllers/alert.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { resolveAlertSchema } from '../validators/alert.validator.js';

export const alertRouter = Router();

alertRouter.use(authMiddleware);

alertRouter.get('/', AlertController.list);
alertRouter.get('/:id', AlertController.getById);

alertRouter.put(
  '/:id/acknowledge',
  requireRole('MAINTENANCE_ENGINEER'),
  AlertController.acknowledge
);

alertRouter.put(
  '/:id/resolve',
  requireRole('MAINTENANCE_ENGINEER'),
  validateBody(resolveAlertSchema),
  AlertController.resolve
);
