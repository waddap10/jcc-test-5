// components/NotificationBell.tsx
import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, User, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Notification {
  id: string;
  type: string;
  data: {
    type: string;
    title: string;
    message: string;
    order_id: number;
    order_code: string;
    event_name: string;
    approved_by: string;
    approved_by_id: number;
    is_pic_notification: boolean;
    pic_department: string | null;
    action_url: string;
    icon: string;
    color: string;
  };
  created_at: string;
  read_at: string | null;
}

interface NotificationBellProps {
  notifications: Notification[];
}

export default function NotificationBell({ notifications }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const unreadCount = notifications.filter(n => !n.read_at).length;

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const refreshNotifications = () => {
      setIsRefreshing(true);
      router.reload({ 
        only: ['notifications'],
        onFinish: () => setIsRefreshing(false)
      });
    };

    const interval = setInterval(refreshNotifications, 30000);
    const handleFocus = () => {
      if (document.hidden === false) {
        refreshNotifications();
      }
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const markAsRead = async (notificationId: string, actionUrl?: string) => {
    try {
      const response = await fetch(`/notifications/${notificationId}/mark-read`, {
        method: 'PATCH',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        router.reload({ only: ['notifications'] });
        
        if (actionUrl && actionUrl !== '#') {
          setTimeout(() => router.visit(actionUrl), 100);
        }
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        router.reload({ only: ['notifications'] });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'check-circle':
        return <Check className="h-5 w-5 text-green-600" />;
      case 'alert-circle':
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      case 'user-check':
        return <User className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationTypeColor = (type: string, isUnread: boolean) => {
    const baseClasses = isUnread ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'bg-white';
    
    switch (type) {
      case 'order_approved_pic':
        return `${baseClasses} hover:bg-blue-100`;
      case 'order_approved':
        return `${baseClasses} hover:bg-green-50`;
      case 'order_needs_review':
        return `${baseClasses} hover:bg-amber-50`;
      default:
        return `${baseClasses} hover:bg-gray-50`;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative hover:bg-white/10">
          <Bell className={`h-5 w-5 text-white ${isRefreshing ? 'animate-pulse' : ''}`} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white border-2 border-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-96 max-h-[500px] overflow-hidden shadow-lg" align="end">
        {/* Header */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600">{unreadCount} unread</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsRefreshing(true);
                  router.reload({ 
                    only: ['notifications'],
                    onFinish: () => setIsRefreshing(false)
                  });
                }}
                disabled={isRefreshing}
                className="text-xs h-7 px-2"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs h-7 px-2 text-blue-600 hover:text-blue-700"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 cursor-pointer transition-colors ${getNotificationTypeColor(
                  notification.data.type, 
                  !notification.read_at
                )}`}
                onClick={() => {
                  setIsOpen(false);
                  if (!notification.read_at) {
                    markAsRead(notification.id, notification.data.action_url);
                  } else if (notification.data.action_url) {
                    router.visit(notification.data.action_url);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getIconComponent(notification.data.icon)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-gray-900 text-sm leading-tight">
                        {notification.data.title}
                      </h4>
                      {!notification.read_at && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                      {notification.data.message}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span className="font-medium text-blue-600">
                        {notification.data.order_code}
                      </span>
                      <span>•</span>
                      <span>{formatRelativeTime(notification.created_at)}</span>
                      {notification.data.is_pic_notification && (
                        <>
                          <span>•</span>
                          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-medium">
                            PIC Assignment
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 bg-gray-50 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-sm text-gray-600 hover:text-gray-900"
              onClick={() => router.visit('/notifications')}
            >
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}