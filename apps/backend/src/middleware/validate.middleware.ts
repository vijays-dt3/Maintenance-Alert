// apps/backend/src/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response.js';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return sendError(
          res,
          'VALIDATION_ERROR',
          'Request validation failed',
          400,
          err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        );
      }
      return sendError(res, 'VALIDATION_ERROR', 'Malformed request payload', 400);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return sendError(
          res,
          'VALIDATION_ERROR',
          'Query parameter validation failed',
          400,
          err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        );
      }
      return sendError(res, 'VALIDATION_ERROR', 'Malformed query parameters', 400);
    }
  };
}
