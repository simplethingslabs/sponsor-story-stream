import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { UserWithRoles, LoginCredentials, RegisterData, AuthState, UserRole } from '@/types';

// Demo mode users for testing when backend is unavailable
const DEMO_USERS: Record<string, { password: string; user: UserWithRoles }> = {
  'sponsor@example.com': {
    password: 'sponsor123',
    user: {
      id: 'sponsor-1',
      email: 'sponsor@example.com',
      full_name: 'Sarah Johnson',
      phone: '+1234567890',
      avatar_url: undefined,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      roles: ['sponsor'],
    },
  },
  'admin@school.org': {
    password: 'admin123',
    user: {
      id: 'admin-1',
      email: 'admin@school.org',
      full_name: 'Admin User',
      phone: '+1234567890',
      avatar_url: undefined,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      roles: ['admin'],
    },
  },
  'teacher@school.org': {
    password: 'teacher123',
    user: {
      id: 'teacher-1',
      email: 'teacher@school.org',
      full_name: 'Teacher User',
      phone: '+1234567890',
      avatar_url: undefined,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      roles: ['teacher'],
    },
  },
  'anantvalleypublicschool@gmail.com': {
    password: 'admin123',
    user: {
      id: 'admin-2',
      email: 'anantvalleypublicschool@gmail.com',
      full_name: 'Anant Valley Admin',
      phone: '+1234567890',
      avatar_url: undefined,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      roles: ['admin'],
    },
  },
};

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; error?: string }>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
          // If it's a demo token, just use stored user
          if (token.startsWith('demo-token-')) {
            const user = JSON.parse(storedUser) as UserWithRoles;
            setState({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }

          // Verify token with backend
          const { data, error } = await api.get<UserWithRoles>('/auth/me');

          if (error || !data) {
            // If backend unavailable but we have stored demo user, use it
            if (error?.includes('Network error') || error?.includes('Failed to fetch')) {
              const user = JSON.parse(storedUser) as UserWithRoles;
              setState({
                user,
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            }
            // Token invalid, clear everything
            api.clearTokens();
            setState({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          // Update stored user with latest data
          localStorage.setItem('user', JSON.stringify(data));
          setState({
            user: data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          api.clearTokens();
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };

    checkAuth();
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<UserWithRoles>('/auth/me');
    if (data) {
      localStorage.setItem('user', JSON.stringify(data));
      setState((prev) => ({ ...prev, user: data }));
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    const { data, error } = await api.post<{
      user: UserWithRoles;
      access_token?: string;
      token?: string;
      refresh_token?: string;
    }>('/auth/login', credentials);

    // If API call succeeded, use the response
    if (data) {
      const accessToken = data.access_token || data.token;
      api.setTokens(accessToken!, data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true };
    }

    // Fallback to demo mode if API is unavailable (connection refused, etc.)
    const demoUser = DEMO_USERS[credentials.email.toLowerCase()];
    if (demoUser && demoUser.password === credentials.password) {
      // Demo login successful
      const mockToken = 'demo-token-' + Date.now();
      api.setTokens(mockToken, undefined);
      localStorage.setItem('user', JSON.stringify(demoUser.user));

      setState({
        user: demoUser.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true };
    }

    // Check if it was a network error (demo mode applicable) or auth error
    if (error?.includes('Network error') || error?.includes('Failed to fetch') || error?.includes('net::ERR')) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Invalid email or password (Demo mode)' };
    }

    setState((prev) => ({ ...prev, isLoading: false }));
    return { success: false, error: error || 'Login failed' };
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    const { data: responseData, error } = await api.post<{
      user: UserWithRoles;
      access_token?: string;
      token?: string;
      refresh_token?: string;
      message?: string;
    }>('/auth/register', data);

    if (error || !responseData) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return { success: false, error: error || 'Registration failed' };
    }

    // Check if registration requires approval (sponsor registration)
    if (responseData.message && !responseData.access_token && !responseData.token) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return { success: true }; // User needs to wait for approval
    }

    const accessToken = responseData.access_token || responseData.token;
    if (accessToken) {
      api.setTokens(accessToken, responseData.refresh_token);
      localStorage.setItem('user', JSON.stringify(responseData.user));

      setState({
        user: responseData.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    // Optionally call logout endpoint
    api.post('/auth/logout').catch(() => {
      // Ignore errors, just clear local state
    });

    api.clearTokens();
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
      return roles.some((role) => state.user?.roles.includes(role));
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
        refreshUser,
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
