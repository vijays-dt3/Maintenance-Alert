// apps/backend/src/routes/spare-parts.routes.ts
import { Router } from 'express';
import { SparePartsController } from '../controllers/spare-parts.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  createSparePartSchema,
  updateSparePartSchema,
} from '../validators/spare-parts.validator.js';

export const sparePartsRouter = Router();

sparePartsRouter.use(authMiddleware);

sparePartsRouter.get('/', SparePartsController.list);
sparePartsRouter.get('/:id', SparePartsController.getById);

sparePartsRouter.post(
  '/',
  requireRole('MAINTENANCE_ENGINEER'),
  validateBody(createSparePartSchema),
  SparePartsController.create
);

sparePartsRouter.put(
  '/:id',
  requireRole('MAINTENANCE_ENGINEER'),
  validateBody(updateSparePartSchema),
  SparePartsController.update
);
