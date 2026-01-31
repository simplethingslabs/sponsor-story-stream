import { toast } from '@/hooks/use-toast';

interface NotifyOptions {
  title: string;
  message: string;
  variant?: 'default' | 'destructive';
}

/**
 * Hook for showing toast notifications.
 * Note: In-app notifications are now managed server-side and 
 * displayed via NotificationDropdown with real-time polling.
 */
export function useNotify() {
  const notify = ({
    title,
    message,
    variant = 'default',
  }: NotifyOptions) => {
    toast({
      title,
      description: message,
      variant,
    });
  };

  const notifySuccess = (title: string, message: string) => {
    notify({ title, message, variant: 'default' });
  };

  const notifyError = (title: string, message: string) => {
    notify({ title, message, variant: 'destructive' });
  };

  const notifyWarning = (title: string, message: string) => {
    notify({ title, message, variant: 'default' });
  };

  const notifyInfo = (title: string, message: string) => {
    notify({ title, message, variant: 'default' });
  };

  return {
    notify,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
  };
}
