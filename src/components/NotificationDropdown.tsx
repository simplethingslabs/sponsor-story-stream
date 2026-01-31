import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, X, FileText, Calendar, Megaphone, Users, Settings, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/contexts/NotificationContext';
import type { NotificationType } from '@/types';
import { cn } from '@/lib/utils';

function getNotificationStyle(type: NotificationType) {
  const styles: Record<NotificationType, { bg: string; icon: React.ReactNode }> = {
    report: { bg: 'bg-blue-100 text-blue-600', icon: <FileText className="h-4 w-4" /> },
    newsletter: { bg: 'bg-green-100 text-green-600', icon: <Megaphone className="h-4 w-4" /> },
    event: { bg: 'bg-purple-100 text-purple-600', icon: <Calendar className="h-4 w-4" /> },
    sponsorship: { bg: 'bg-amber-100 text-amber-600', icon: <Users className="h-4 w-4" /> },
    system: { bg: 'bg-muted text-muted-foreground', icon: <Settings className="h-4 w-4" /> },
  };
  return styles[type] || styles.system;
}

export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full p-0 text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border p-3">
          <h4 className="font-semibold text-foreground">Notifications</h4>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 text-xs"
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const isRead = !!notification.read_at;
                const style = getNotificationStyle(notification.type);
                const createdAt = new Date(notification.created_at);
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'relative p-3 hover:bg-muted/50 transition-colors',
                      !isRead && 'bg-primary/5'
                    )}
                  >
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          'mt-0.5 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
                          style.bg
                        )}
                      >
                        {style.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!isRead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => markAsRead(notification.id)}
                                title="Mark as read"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => removeNotification(notification.id)}
                              title="Remove"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(createdAt, { addSuffix: true })}
                          </span>
                          {notification.link && (
                            <Link
                              to={notification.link}
                              className="text-xs text-primary hover:underline"
                              onClick={() => markAsRead(notification.id)}
                            >
                              View details
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                    {!isRead && (
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="border-t border-border p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="w-full text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Clear all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
