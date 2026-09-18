// apps/backend/src/routes/reading.routes.ts
import { Router } from 'express';
import { ReadingController } from '../controllers/reading.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createReadingSchema } from '../validators/reading.validator.js';

export const readingRouter = Router();

readingRouter.use(authMiddleware);

readingRouter.get('/', ReadingController.list);
readingRouter.get('/equipment/:id', ReadingController.listByEquipment);

readingRouter.post(
  '/',
  requireRole('MAINTENANCE_ENGINEER'),
  validateBody(createReadingSchema),
  ReadingController.create
);
