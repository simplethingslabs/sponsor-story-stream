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
          // Verify token with backend
          const { data, error } = await api.get<UserWithRoles>('/auth/me');

          if (error || !data) {
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

    if (error || !data) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return { success: false, error: error || 'Login failed' };
    }

    const accessToken = data.access_token || data.token;
    api.setTokens(accessToken!, data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));

    setState({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
    });

    return { success: true };
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
