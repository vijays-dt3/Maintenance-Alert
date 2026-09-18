// apps/backend/src/routes/dashboard.routes.ts
import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);

dashboardRouter.get('/overview', DashboardController.getOverview);
dashboardRouter.get('/summary', DashboardController.getOverview);
