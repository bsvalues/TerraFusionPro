import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Storage keys
const NOTIFICATIONS_SETTINGS_KEY = 'terrafield_notifications_settings';

// Notification channels
enum NotificationChannels {
  SYNC = 'sync_notifications',
  FIELD_NOTES = 'field_notes_notifications',
  SYSTEM = 'system_notifications',
}

// Notification settings interface
interface NotificationSettings {
  syncEnabled: boolean;
  fieldNotesEnabled: boolean;
  systemEnabled: boolean;
}

// Default notification settings
const DEFAULT_SETTINGS: NotificationSettings = {
  syncEnabled: true,
  fieldNotesEnabled: true,
  systemEnabled: true,
};

/**
 * Service to handle notifications
 */
export class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private pushToken: string | null = null;
  private initialized: boolean = false;

  /**
   * Private constructor to implement singleton pattern
   */
  private constructor() {
    this.initializeService();
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
   * Initialize service
   */
  private async initializeService(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Load notification settings
      await this.loadSettings();

      // Configure notification handler
      await this.configureNotifications();

      // Register notification channels (Android only)
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      // Register for push notifications
      await this.registerForPushNotifications();

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing NotificationService:', error);
    }
  }

  /**
   * Load notification settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const settingsJson = await AsyncStorage.getItem(NOTIFICATIONS_SETTINGS_KEY);
      if (settingsJson) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) };
      } else {
        this.settings = DEFAULT_SETTINGS;
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      this.settings = DEFAULT_SETTINGS;
    }
  }

  /**
   * Save notification settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  /**
   * Configure notification handler
   */
  private async configureNotifications(): Promise<void> {
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  /**
   * Create notification channels (Android only)
   */
  private async createNotificationChannels(): Promise<void> {
    if (Platform.OS === 'android') {
      // Sync channel
      await Notifications.setNotificationChannelAsync(NotificationChannels.SYNC, {
        name: 'Sync Notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      // Field notes channel
      await Notifications.setNotificationChannelAsync(NotificationChannels.FIELD_NOTES, {
        name: 'Field Notes Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      // System channel
      await Notifications.setNotificationChannelAsync(NotificationChannels.SYSTEM, {
        name: 'System Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }

  /**
   * Register for push notifications
   */
  private async registerForPushNotifications(): Promise<void> {
    try {
      if (Constants.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return;
        }

        // Get push token
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        this.pushToken = token;
      } else {
        console.log('Must use physical device for push notifications');
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  }

  /**
   * Send local notification
   */
  private async sendLocalNotification(
    title: string,
    body: string,
    data?: any,
    channel?: NotificationChannels,
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          ...(Platform.OS === 'android' ? { channelId: channel } : {}),
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  /**
   * Send sync success notification
   */
  public async sendSyncSuccessNotification(
    parcelId: string,
    count: number,
  ): Promise<void> {
    if (!this.settings.syncEnabled) {
      return;
    }

    await this.sendLocalNotification(
      'Sync Complete',
      `Successfully synchronized ${count} field notes for parcel ${parcelId}`,
      { type: 'sync', parcelId },
      NotificationChannels.SYNC,
    );
  }

  /**
   * Send sync error notification
   */
  public async sendSyncErrorNotification(
    parcelId: string,
    count: number,
  ): Promise<void> {
    if (!this.settings.syncEnabled) {
      return;
    }

    await this.sendLocalNotification(
      'Sync Failed',
      `Failed to synchronize ${count} field notes for parcel ${parcelId}. Will retry later.`,
      { type: 'sync_error', parcelId },
      NotificationChannels.SYNC,
    );
  }

  /**
   * Send field note notification
   */
  public async sendFieldNoteNotification(
    parcelId: string,
    createdBy: string,
    text: string,
  ): Promise<void> {
    if (!this.settings.fieldNotesEnabled) {
      return;
    }

    // Truncate text if too long
    const truncatedText = text.length > 50 ? `${text.substring(0, 47)}...` : text;

    await this.sendLocalNotification(
      `New field note by ${createdBy}`,
      truncatedText,
      { type: 'field_note', parcelId },
      NotificationChannels.FIELD_NOTES,
    );
  }

  /**
   * Send system notification
   */
  public async sendSystemNotification(
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    if (!this.settings.systemEnabled) {
      return;
    }

    await this.sendLocalNotification(
      title,
      body,
      { type: 'system', ...data },
      NotificationChannels.SYSTEM,
    );
  }

  /**
   * Set notification settings
   */
  public async setSettings(settings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveSettings();
  }

  /**
   * Get notification settings
   */
  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Get push token
   */
  public getPushToken(): string | null {
    return this.pushToken;
  }
}