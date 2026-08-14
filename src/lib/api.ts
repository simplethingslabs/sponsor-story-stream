import type { ApiResponse } from '@/types';

// Configure your backend API URL here
// After deploying to Railway, update this to your Railway API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://sponsor-story-stream-production.up.railway.app/api';

// Token refresh state
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeToRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onRefreshComplete(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.accessToken = localStorage.getItem('auth_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  setTokens(accessToken: string | null, refreshToken?: string | null) {
    this.accessToken = accessToken;
    if (accessToken) {
      localStorage.setItem('auth_token', accessToken);
    } else {
      localStorage.removeItem('auth_token');
    }

    if (refreshToken !== undefined) {
      this.refreshToken = refreshToken;
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      } else {
        localStorage.removeItem('refresh_token');
      }
    }
  }

  getToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const newAccessToken = data.access_token || data.token;
      const newRefreshToken = data.refresh_token;

      this.setTokens(newAccessToken, newRefreshToken);
      return newAccessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      // Redirect to login
      window.location.href = '/login';
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && retry && this.refreshToken) {
        // If already refreshing, wait for the refresh to complete
        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeToRefresh(async (newToken) => {
              (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
              const retryResponse = await this.request<T>(endpoint, options, false);
              resolve(retryResponse);
            });
          });
        }

        isRefreshing = true;
        const newToken = await this.refreshAccessToken();
        isRefreshing = false;

        if (newToken) {
          onRefreshComplete(newToken);
          // Retry the original request with new token
          return this.request<T>(endpoint, options, false);
        }

        return { error: 'Session expired. Please login again.' };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || data.message || `Request failed with status ${response.status}`,
        };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error. Please check your connection.',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // File upload helper
  async uploadFile(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {};

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Upload failed' };
      }

      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }
}

export const api = new ApiClient(API_BASE_URL);
