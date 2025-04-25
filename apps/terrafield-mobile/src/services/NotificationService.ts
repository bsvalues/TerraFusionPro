/**
 * Notification Service for handling in-app notifications
 * in the TerraField Mobile application
 */

// Notification Types
export enum NotificationType {
  SYNC_STARTED = 'sync_started',
  SYNC_COMPLETED = 'sync_completed',
  SYNC_FAILED = 'sync_failed',
  FIELD_NOTE_ADDED = 'field_note_added',
  FIELD_NOTE_DELETED = 'field_note_deleted',
  FIELD_NOTE_UPDATED = 'field_note_updated',
  CONFLICT_DETECTED = 'conflict_detected',
  PROPERTY_UPDATED = 'property_updated',
  REPORT_GENERATED = 'report_generated',
  PHOTO_ENHANCED = 'photo_enhanced',
  MEASUREMENT_COMPLETED = 'measurement_completed',
}

// Notification interface
export interface Notification {
  id: string;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

// Notification service using the singleton pattern
export class NotificationService {
  private static instance: NotificationService;
  private notifications: Map<string, Notification> = new Map();
  private listeners: ((notifications: Notification[]) => void)[] = [];

  // Private constructor to prevent direct instantiation
  private constructor() {}

  // Get singleton instance
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Register a listener for notification updates
  public registerListener(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.push(callback);
    
    // Return unregister function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all registered listeners
  private notifyListeners(): void {
    const notificationsList = Array.from(this.notifications.values());
    this.listeners.forEach(listener => listener(notificationsList));
  }

  // Send a notification
  public sendNotification(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    data?: any
  ): Notification {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    const notification: Notification = {
      id,
      userId,
      type,
      title,
      message,
      timestamp,
      read: false,
      data,
    };
    
    this.notifications.set(id, notification);
    this.notifyListeners();
    
    // Display the notification (in a real app, this would use the OS notification system)
    console.log(`NOTIFICATION: ${title} - ${message}`);
    
    return notification;
  }

  // Get all notifications for a user
  public getNotificationsByUser(userId: number): Notification[] {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Get unread notifications count for a user
  public getUnreadCount(userId: number): number {
    return this.getNotificationsByUser(userId)
      .filter(notification => !notification.read)
      .length;
  }

  // Mark a notification as read
  public markAsRead(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    
    if (notification) {
      notification.read = true;
      this.notifications.set(notificationId, notification);
      this.notifyListeners();
      return true;
    }
    
    return false;
  }

  // Mark all notifications as read for a user
  public markAllAsRead(userId: number): number {
    let count = 0;
    
    this.getNotificationsByUser(userId).forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        this.notifications.set(notification.id, notification);
        count++;
      }
    });
    
    if (count > 0) {
      this.notifyListeners();
    }
    
    return count;
  }

  // Delete a notification
  public deleteNotification(notificationId: string): boolean {
    const deleted = this.notifications.delete(notificationId);
    
    if (deleted) {
      this.notifyListeners();
    }
    
    return deleted;
  }

  // Clear all notifications for a user
  public clearNotifications(userId: number): number {
    const userNotifications = this.getNotificationsByUser(userId);
    let count = 0;
    
    userNotifications.forEach(notification => {
      if (this.notifications.delete(notification.id)) {
        count++;
      }
    });
    
    if (count > 0) {
      this.notifyListeners();
    }
    
    return count;
  }
}