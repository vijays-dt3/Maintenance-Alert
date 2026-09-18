// apps/backend/src/middleware/error-handler.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[Error Handler]:', err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error occurred';
  const code = err.code || 'INTERNAL_ERROR';

  return sendError(
    res,
    code,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? err.stack : undefined
  );
}
