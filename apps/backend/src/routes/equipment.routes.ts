// apps/backend/src/routes/equipment.routes.ts
import { Router } from 'express';
import { EquipmentController } from '../controllers/equipment.controller.js';
import { ParameterController } from '../controllers/parameter.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  createEquipmentSchema,
  updateEquipmentSchema,
} from '../validators/equipment.validator.js';
import { createParameterSchema } from '../validators/parameter.validator.js';

export const equipmentRouter = Router();

equipmentRouter.use(authMiddleware);

equipmentRouter.get('/', EquipmentController.list);
equipmentRouter.get('/:id', EquipmentController.getById);

equipmentRouter.post(
  '/',
  requireRole('MAINTENANCE_ENGINEER'),
  validateBody(createEquipmentSchema),
  EquipmentController.create
);

equipmentRouter.put(
  '/:id',
  requireRole('MAINTENANCE_ENGINEER'),
  validateBody(updateEquipmentSchema),
  EquipmentController.update
);

// Equipment parameters sub-routes
equipmentRouter.get('/:id/parameters', ParameterController.listByEquipment);
equipmentRouter.post(
  '/:id/parameters',
  requireRole('MAINTENANCE_ENGINEER'),
  validateBody(createParameterSchema.omit({ equipment_id: true })),
  ParameterController.create
);
