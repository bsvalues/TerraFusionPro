import React, { useState } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Bell,
  Info,
  Check,
  CheckCheck,
  BellRing,
  Brain
} from 'lucide-react';
import { useLocation } from 'wouter';

export const NotificationPanel: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const { notifications, markAsRead, markAllAsRead, connected } = useWebSocket();
  const [, setLocation] = useLocation();
  
  // Only show 3 most recent in collapsed view
  const recentNotifications = notifications.slice(0, 3);
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <Brain className="h-4 w-4 text-primary" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'update':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Format timestamp to a readable format
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    
    return date.toLocaleDateString();
  };
  
  return (
    <Card className="shadow-md overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="h-5 w-5 text-primary" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                >
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Notifications</CardTitle>
              <CardDescription>System and AI model updates</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => markAllAsRead()}
                className="text-xs h-7 px-2"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Mark all read
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-xs h-7 px-2"
            >
              {expanded ? 'Collapse' : 'See all'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-0">
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {(expanded ? notifications : recentNotifications).map((notification) => (
            <div
              key={notification.id}
              className={`py-2 px-3 flex items-start justify-between gap-2 text-sm rounded-md transition-colors ${
                notification.read ? 'bg-background' : 'bg-muted/30'
              } hover:bg-muted/50`}
            >
              <div className="flex gap-2">
                <div className="mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div>
                  <p className={notification.read ? 'text-muted-foreground' : 'font-medium'}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimestamp(notification.timestamp)}
                  </p>
                </div>
              </div>
              {!notification.read && (
                <Button
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => markAsRead(notification.id)}
                >
                  <Check className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <BellRing className="mx-auto h-8 w-8 mb-2 opacity-20" />
              <p>No notifications yet</p>
              <p className="text-xs mt-1">
                {connected ? 'You\'re all caught up!' : 'Connecting to notification service...'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      {notifications.length > 0 && !expanded && (
        <CardFooter className="pt-0 pb-3 flex justify-center">
          <Button 
            variant="link" 
            size="sm" 
            onClick={() => setExpanded(true)}
            className="text-xs"
          >
            Show {notifications.length - recentNotifications.length} more notification(s)
          </Button>
        </CardFooter>
      )}
      <CardFooter className="pt-2 pb-3 border-t">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLocation('/system-monitor')}
          className="text-xs"
        >
          <Brain className="h-3.5 w-3.5 mr-1" />
          View AI Model Status
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NotificationPanel;