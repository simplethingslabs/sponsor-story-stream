import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useNotificationsQuery, 
  useMarkNotificationRead, 
  useMarkAllNotificationsRead, 
  useDeleteNotification,
  queryKeys 
} from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification, NotificationType } from '@/types';

// Re-export types for backward compatibility
export type { Notification, NotificationType };

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  refetch: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Polling interval: 30 seconds
const POLLING_INTERVAL = 30 * 1000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications with polling (only when authenticated)
  const { data, isLoading, refetch } = useNotificationsQuery(
    { limit: 50 },
    { refetchInterval: isAuthenticated ? POLLING_INTERVAL : undefined }
  );

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  // Transform API response to match expected format
  const notifications = useMemo(() => {
    if (!data?.data) return [];
    return data.data.map((n) => ({
      ...n,
      // Convert read_at to boolean for backward compatibility in UI
      read: !!n.read_at,
      createdAt: new Date(n.created_at),
    }));
  }, [data]);

  const unreadCount = data?.unread_count ?? 0;

  const markAsRead = useCallback((id: string) => {
    markReadMutation.mutate(id);
  }, [markReadMutation]);

  const markAllAsRead = useCallback(() => {
    markAllReadMutation.mutate();
  }, [markAllReadMutation]);

  const removeNotification = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const clearAll = useCallback(() => {
    // Delete all notifications one by one (or could implement batch delete on backend)
    notifications.forEach((n) => {
      deleteMutation.mutate(n.id);
    });
  }, [notifications, deleteMutation]);

  const handleRefetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
  }, [queryClient]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    isLoading: isLoading && isAuthenticated,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    refetch: handleRefetch,
  }), [
    notifications, 
    unreadCount, 
    isLoading, 
    isAuthenticated,
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll,
    handleRefetch,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
