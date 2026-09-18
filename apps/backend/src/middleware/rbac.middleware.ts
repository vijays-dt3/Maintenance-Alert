// apps/backend/src/middleware/rbac.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@maintenance/shared';
import { sendError } from '../utils/response.js';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        'FORBIDDEN',
        `Access denied. Role ${req.user.role} does not have required permissions for this action.`,
        403
      );
    }

    next();
  };
}
