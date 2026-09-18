// apps/backend/src/app.ts
import express, { Express } from 'express';
import { corsMiddleware } from './config/cors.js';
import { apiLimiter } from './middleware/rate-limit.middleware.js';
import { errorHandler } from './middleware/error-handler.middleware.js';
import { apiRouter } from './routes/index.js';

export function createApp(): Express {
  const app = express();

  // Basic security and parsing
  app.use(corsMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Predictive Maintenance Alert & Work Order API',
    });
  });

  // Main API routes with rate limiter
  app.use('/api', apiLimiter, apiRouter);

  // Global error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
