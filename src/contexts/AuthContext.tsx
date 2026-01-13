import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { UserWithRoles, LoginCredentials, RegisterData, AuthState, UserRole } from '@/types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; error?: string }>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for development (remove in production)
const DEMO_USERS: Record<string, { user: UserWithRoles; password: string }> = {
  'admin@school.org': {
    password: 'admin123',
    user: {
      id: '1',
      email: 'admin@school.org',
      full_name: 'School Administrator',
      roles: ['super_admin'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'teacher@school.org': {
    password: 'teacher123',
    user: {
      id: '2',
      email: 'teacher@school.org',
      full_name: 'Priya Sharma',
      roles: ['teacher'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'sponsor@example.com': {
    password: 'sponsor123',
    user: {
      id: '3',
      email: 'sponsor@example.com',
      full_name: 'Rajesh Kumar',
      roles: ['sponsor'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getToken();
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          // In production, verify token with backend
          // const { data, error } = await api.get<UserWithRoles>('/auth/me');
          // For now, use stored user
          const user = JSON.parse(storedUser) as UserWithRoles;
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          api.setToken(null);
          localStorage.removeItem('user');
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true }));

    // Demo mode - check demo users first
    const demoUser = DEMO_USERS[credentials.email.toLowerCase()];
    if (demoUser && demoUser.password === credentials.password) {
      api.setToken('demo_token_' + demoUser.user.id);
      localStorage.setItem('user', JSON.stringify(demoUser.user));
      setState({
        user: demoUser.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    }

    // Production API call
    const { data, error } = await api.post<{ user: UserWithRoles; token: string }>(
      '/auth/login',
      credentials
    );

    if (error || !data) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: error || 'Login failed' };
    }

    api.setToken(data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setState({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
    });

    return { success: true };
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setState(prev => ({ ...prev, isLoading: true }));

    const { data: responseData, error } = await api.post<{ user: UserWithRoles; token: string }>(
      '/auth/register',
      data
    );

    if (error || !responseData) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: error || 'Registration failed' };
    }

    api.setToken(responseData.token);
    localStorage.setItem('user', JSON.stringify(responseData.user));
    setState({
      user: responseData.user,
      isAuthenticated: true,
      isLoading: false,
    });

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    api.setToken(null);
    localStorage.removeItem('user');
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const { error } = await api.post('/auth/forgot-password', { email });
    if (error) {
      return { success: false, error };
    }
    return { success: true };
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    const { error } = await api.post('/auth/reset-password', { token, password });
    if (error) {
      return { success: false, error };
    }
    return { success: true };
  }, []);

  const hasRole = useCallback(
    (role: UserRole) => {
      return state.user?.roles.includes(role) ?? false;
    },
    [state.user]
  );

  const hasAnyRole = useCallback(
    (roles: UserRole[]) => {
      return roles.some(role => state.user?.roles.includes(role));
    },
    [state.user]
  );

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        hasRole,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
