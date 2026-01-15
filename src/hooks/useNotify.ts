import { useNotifications, NotificationType } from '@/contexts/NotificationContext';
import { toast } from '@/hooks/use-toast';

interface NotifyOptions {
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
  showToast?: boolean;
}

export function useNotify() {
  const { addNotification } = useNotifications();

  const notify = ({
    title,
    message,
    type = 'info',
    link,
    showToast = true,
  }: NotifyOptions) => {
    // Add to notification center
    addNotification({ title, message, type, link });

    // Also show a toast notification for immediate feedback
    if (showToast) {
      toast({
        title,
        description: message,
        variant: type === 'error' ? 'destructive' : 'default',
      });
    }
  };

  const notifySuccess = (title: string, message: string, link?: string) => {
    notify({ title, message, type: 'success', link });
  };

  const notifyError = (title: string, message: string, link?: string) => {
    notify({ title, message, type: 'error', link });
  };

  const notifyWarning = (title: string, message: string, link?: string) => {
    notify({ title, message, type: 'warning', link });
  };

  const notifyInfo = (title: string, message: string, link?: string) => {
    notify({ title, message, type: 'info', link });
  };

  return {
    notify,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
  };
}
