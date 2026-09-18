// apps/backend/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { sendError, sendSuccess } from '../utils/response.js';

export class AuthController {
  static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'VALIDATION_ERROR', 'Email and password are required', 400);
    }

    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Provide mock demo bypass login if Supabase auth credentials are not yet connected in dev
        if (
          process.env.NODE_ENV === 'development' &&
          (email.includes('engineer') || email.includes('manager'))
        ) {
          const role = email.includes('manager') ? 'PLANT_MANAGER' : 'MAINTENANCE_ENGINEER';
          return sendSuccess(res, {
            user: {
              id: role === 'PLANT_MANAGER' ? '00000000-0000-0000-0000-000000000002' : '00000000-0000-0000-0000-000000000001',
              email,
              full_name: role === 'PLANT_MANAGER' ? 'Marcus Vance (Manager)' : 'Alex Rivera (Engineer)',
              role,
            },
            accessToken: 'demo-dev-jwt-token',
          });
        }
        return sendError(res, 'INVALID_CREDENTIALS', error.message, 401);
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email, roles(name)')
        .eq('id', data.user.id)
        .single();

      return sendSuccess(res, {
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: profile?.full_name || data.user.user_metadata?.full_name || 'Plant User',
          role: (profile?.roles as any)?.name || 'MAINTENANCE_ENGINEER',
        },
        accessToken: data.session.access_token,
      });
    } catch (err: any) {
      return sendError(res, 'LOGIN_FAILED', err.message, 500);
    }
  }

  static async me(req: Request, res: Response) {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'Not authenticated', 401);
    }
    return sendSuccess(res, req.user);
  }

  static async logout(req: Request, res: Response) {
    return sendSuccess(res, { loggedOut: true });
  }
}
