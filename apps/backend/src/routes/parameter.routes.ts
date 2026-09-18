// apps/backend/src/routes/parameter.routes.ts
import { Router } from 'express';
import { ParameterController } from '../controllers/parameter.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { updateParameterSchema } from '../validators/parameter.validator.js';

export const parameterRouter = Router();

parameterRouter.use(authMiddleware);

parameterRouter.put(
  '/:id',
  requireRole('MAINTENANCE_ENGINEER'),
  validateBody(updateParameterSchema),
  ParameterController.update
);

parameterRouter.delete(
  '/:id',
  requireRole('MAINTENANCE_ENGINEER'),
  ParameterController.delete
);
