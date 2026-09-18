// apps/backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rate-limit.middleware.js';

export const authRouter = Router();

authRouter.post('/login', authLimiter, AuthController.login);
authRouter.get('/me', authMiddleware, AuthController.me);
authRouter.post('/logout', authMiddleware, AuthController.logout);
