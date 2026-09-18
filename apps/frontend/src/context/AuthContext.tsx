import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@maintenance/shared';
import { api } from '../lib/api';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  token: string | null;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => Promise<void>;
  switchPersona: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Default demo user: Maintenance Engineer
    return {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'engineer@plant.com',
      full_name: 'Alex Rivera (Engineer)',
      role_id: '1',
      role: 'MAINTENANCE_ENGINEER',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token') || 'demo-token');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user_profile', JSON.stringify(user));
      localStorage.setItem('dev_role', user.role);
    } else {
      localStorage.removeItem('user_profile');
      localStorage.removeItem('dev_role');
    }
  }, [user]);

  const login = async (email: string, requestedRole?: UserRole) => {
    setIsLoading(true);
    try {
      const res: any = await api.post('/auth/login', {
        email,
        password: 'Password123!',
      });

      if (res?.data?.user) {
        setUser(res.data.user);
        setToken(res.data.accessToken || 'demo-token');
        localStorage.setItem('token', res.data.accessToken || 'demo-token');
      } else {
        // Dev fallback
        const role = requestedRole || (email.includes('manager') ? 'PLANT_MANAGER' : 'MAINTENANCE_ENGINEER');
        switchPersona(role);
      }
    } catch {
      // Fallback directly to role selection for offline demo
      const role = requestedRole || (email.includes('manager') ? 'PLANT_MANAGER' : 'MAINTENANCE_ENGINEER');
      switchPersona(role);
    } finally {
      setIsLoading(false);
    }
  };

  const switchPersona = (role: UserRole) => {
    const newUser: UserProfile = {
      id: role === 'PLANT_MANAGER' ? '00000000-0000-0000-0000-000000000002' : '00000000-0000-0000-0000-000000000001',
      email: role === 'PLANT_MANAGER' ? 'manager@plant.com' : 'engineer@plant.com',
      full_name: role === 'PLANT_MANAGER' ? 'Marcus Vance (Plant Manager)' : 'Alex Rivera (Maintenance Engineer)',
      role_id: role === 'PLANT_MANAGER' ? '2' : '1',
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUser(newUser);
    setToken('demo-token');
    localStorage.setItem('token', 'demo-token');
    localStorage.setItem('dev_role', role);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('dev_role');
    localStorage.removeItem('user_profile');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'MAINTENANCE_ENGINEER',
        token,
        isLoading,
        login,
        switchPersona,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
