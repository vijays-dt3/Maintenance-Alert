// apps/backend/src/routes/index.ts
import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { equipmentRouter } from './equipment.routes.js';
import { parameterRouter } from './parameter.routes.js';
import { readingRouter } from './reading.routes.js';
import { alertRouter } from './alert.routes.js';
import { workOrderRouter } from './work-order.routes.js';
import { sparePartsRouter } from './spare-parts.routes.js';
import { maintenanceHistoryRouter } from './maintenance-history.routes.js';
import { dashboardRouter } from './dashboard.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/equipment', equipmentRouter);
apiRouter.use('/parameters', parameterRouter);
apiRouter.use('/readings', readingRouter);
apiRouter.use('/alerts', alertRouter);
apiRouter.use('/work-orders', workOrderRouter);
apiRouter.use('/spare-parts', sparePartsRouter);
apiRouter.use('/maintenance-history', maintenanceHistoryRouter);
apiRouter.use('/dashboard', dashboardRouter);
