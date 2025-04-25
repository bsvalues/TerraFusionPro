import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for notification object
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'system' | 'task' | 'sync';
  data?: any;
}

/**
 * Interface for notification listener
 */
type NotificationListener = (notification: Notification) => void;

/**
 * Service to handle notifications
 */
export class NotificationService {
  private static instance: NotificationService;
  private notifications: Notification[] = [];
  private listeners: NotificationListener[] = [];
  private MAX_NOTIFICATIONS = 100;
  
  /**
   * Private constructor to implement singleton pattern
   */
  private constructor() {
    this.loadNotifications();
  }
  
  /**
   * Get instance of NotificationService (Singleton)
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  /**
   * Load notifications from storage
   */
  private async loadNotifications(): Promise<void> {
    try {
      const notificationsJson = await AsyncStorage.getItem('terrafield_notifications');
      if (notificationsJson) {
        this.notifications = JSON.parse(notificationsJson);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }
  
  /**
   * Save notifications to storage
   */
  private async saveNotifications(): Promise<void> {
    try {
      await AsyncStorage.setItem('terrafield_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }
  
  /**
   * Add a listener for notifications
   */
  public addListener(listener: NotificationListener): void {
    this.listeners.push(listener);
  }
  
  /**
   * Remove a listener
   */
  public removeListener(listener: NotificationListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  /**
   * Get all notifications
   */
  public getNotifications(): Notification[] {
    return [...this.notifications];
  }
  
  /**
   * Get unread notifications
   */
  public getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.isRead);
  }
  
  /**
   * Mark a notification as read
   */
  public async markAsRead(id: string): Promise<void> {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications[index].isRead = true;
      await this.saveNotifications();
    }
  }
  
  /**
   * Mark all notifications as read
   */
  public async markAllAsRead(): Promise<void> {
    this.notifications.forEach(n => (n.isRead = true));
    await this.saveNotifications();
  }
  
  /**
   * Clear all notifications
   */
  public async clearAll(): Promise<void> {
    this.notifications = [];
    await this.saveNotifications();
  }
  
  /**
   * Send a notification
   */
  private async sendNotification(
    title: string,
    message: string,
    type: 'system' | 'task' | 'sync',
    data?: any
  ): Promise<Notification> {
    // Create notification object
    const notification: Notification = {
      id: uuidv4(),
      title,
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
      type,
      data,
    };
    
    // Add to notifications list
    this.notifications.unshift(notification);
    
    // Trim to max size
    if (this.notifications.length > this.MAX_NOTIFICATIONS) {
      this.notifications = this.notifications.slice(0, this.MAX_NOTIFICATIONS);
    }
    
    // Save to storage
    await this.saveNotifications();
    
    // Notify listeners
    this.notifyListeners(notification);
    
    return notification;
  }
  
  /**
   * Notify all listeners
   */
  private notifyListeners(notification: Notification): void {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }
  
  /**
   * Send a system notification
   */
  public async sendSystemNotification(
    title: string,
    message: string,
    data?: any
  ): Promise<Notification> {
    return await this.sendNotification(title, message, 'system', data);
  }
  
  /**
   * Send a task notification
   */
  public async sendTaskNotification(
    title: string,
    message: string,
    data?: any
  ): Promise<Notification> {
    return await this.sendNotification(title, message, 'task', data);
  }
  
  /**
   * Send a sync success notification
   */
  public async sendSyncSuccessNotification(
    resource: string,
    count: number
  ): Promise<Notification> {
    const title = 'Sync Complete';
    const message = count === 1
      ? `Successfully synchronized ${resource}`
      : `Successfully synchronized ${count} items for ${resource}`;
    
    return await this.sendNotification(title, message, 'sync', { resource, count });
  }
  
  /**
   * Send a sync error notification
   */
  public async sendSyncErrorNotification(
    resource: string,
    errorMessage: string
  ): Promise<Notification> {
    const title = 'Sync Error';
    const message = `Failed to synchronize ${resource}: ${errorMessage}`;
    
    return await this.sendNotification(title, message, 'sync', { resource, error: errorMessage });
  }
}