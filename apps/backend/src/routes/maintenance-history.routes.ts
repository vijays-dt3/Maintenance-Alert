// apps/backend/src/routes/maintenance-history.routes.ts
import { Router } from 'express';
import { MaintenanceHistoryController } from '../controllers/maintenance-history.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

export const maintenanceHistoryRouter = Router();

maintenanceHistoryRouter.use(authMiddleware);

maintenanceHistoryRouter.get('/', MaintenanceHistoryController.list);
maintenanceHistoryRouter.get('/:id', MaintenanceHistoryController.getById);
