// apps/backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { sendError } from '../utils/response.js';
import { UserRole } from '@maintenance/shared';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // Support demo / development testing headers if configured
  const devRole = req.headers['x-dev-role'] as UserRole | undefined;
  if (process.env.NODE_ENV === 'development' && devRole) {
    req.user = {
      id: devRole === 'MAINTENANCE_ENGINEER' ? '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000002',
      email: devRole === 'MAINTENANCE_ENGINEER' ? 'engineer@plant.com' : 'manager@plant.com',
      role: devRole,
      full_name: devRole === 'MAINTENANCE_ENGINEER' ? 'Alex Rivera (Engineer)' : 'Marcus Vance (Manager)',
    };
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'UNAUTHORIZED', 'Authentication token missing or invalid', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return sendError(res, 'UNAUTHORIZED', 'Invalid or expired session token', 401);
    }

    // Fetch user profile and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, roles(name)')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Fallback to metadata if profile record hasn't completed sync
      const metaRole = (user.user_metadata?.role as UserRole) || 'MAINTENANCE_ENGINEER';
      req.user = {
        id: user.id,
        email: user.email || '',
        role: metaRole,
        full_name: user.user_metadata?.full_name || 'Plant Staff',
      };
      return next();
    }

    const roleName = (profile.roles as any)?.name as UserRole || 'MAINTENANCE_ENGINEER';

    req.user = {
      id: profile.id,
      email: profile.email,
      role: roleName,
      full_name: profile.full_name,
    };

    next();
  } catch (err: any) {
    return sendError(res, 'INTERNAL_SERVER_ERROR', 'Authentication failed', 500, err.message);
  }
}
