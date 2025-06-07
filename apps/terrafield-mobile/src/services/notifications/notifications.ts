import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SettingsService } from '../settings/settings';

interface Notification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  timestamp: string;
  read: boolean;
}

interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  showInApp: boolean;
  categories: {
    sync: boolean;
    updates: boolean;
    alerts: boolean;
    reminders: boolean;
  };
}

export class NotificationService {
  private static instance: NotificationService;
  private settingsService: SettingsService;
  private notificationsKey = '@notifications';
  private fcmTokenKey = '@fcm_token';

  private constructor() {
    this.settingsService = SettingsService.getInstance();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await messaging().requestPermission();
      }

      const token = await this.getFCMToken();
      if (token) {
        await this.updateFCMToken(token);
      }

      messaging().onTokenRefresh(async (token) => {
        await this.updateFCMToken(token);
      });

      messaging().onMessage(async (remoteMessage) => {
        await this.handleMessage(remoteMessage);
      });

      messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        await this.handleMessage(remoteMessage);
      });
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      throw error;
    }
  }

  private async getFCMToken(): Promise<string | null> {
    try {
      return await messaging().getToken();
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }

  private async updateFCMToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.fcmTokenKey, token);
      // TODO: Send token to backend
    } catch (error) {
      console.error('Failed to update FCM token:', error);
      throw error;
    }
  }

  private async handleMessage(message: any): Promise<void> {
    try {
      const settings = await this.settingsService.getNotificationSettings();
      if (!settings.enabled) return;

      const notification: Notification = {
        id: message.messageId,
        title: message.notification?.title || 'New Notification',
        body: message.notification?.body || '',
        data: message.data,
        timestamp: new Date().toISOString(),
        read: false,
      };

      await this.saveNotification(notification);

      if (settings.showInApp) {
        // TODO: Show in-app notification
      }
    } catch (error) {
      console.error('Failed to handle message:', error);
      throw error;
    }
  }

  private async saveNotification(notification: Notification): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      notifications.unshift(notification);
      await AsyncStorage.setItem(this.notificationsKey, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notification:', error);
      throw error;
    }
  }

  async getNotifications(): Promise<Notification[]> {
    try {
      const data = await AsyncStorage.getItem(this.notificationsKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const index = notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        notifications[index].read = true;
        await AsyncStorage.setItem(this.notificationsKey, JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      notifications.forEach(n => n.read = true);
      await AsyncStorage.setItem(this.notificationsKey, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const filtered = notifications.filter(n => n.id !== id);
      await AsyncStorage.setItem(this.notificationsKey, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  async clearNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.notificationsKey);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getNotifications();
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
    } catch (error) {
      console.error('Failed to subscribe to topic:', error);
      throw error;
    }
  }

  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
    } catch (error) {
      console.error('Failed to unsubscribe from topic:', error);
      throw error;
    }
  }
} 