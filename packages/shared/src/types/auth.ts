// packages/shared/src/types/auth.ts
import { UserRole } from '../constants/roles.js';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}
