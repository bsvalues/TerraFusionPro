import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notifications globally
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Service to handle notifications for the app
 */
export class NotificationService {
  private static instance: NotificationService;
  private isInitialized: boolean = false;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

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
   * Initialize the notification service
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // If we don't have permission, request it
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for notifications');
        return false;
      }

      // Set up notification listener
      Notifications.addNotificationReceivedListener(this.handleNotification);

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  /**
   * Send a local notification
   */
  public async sendLocalNotification(
    title: string,
    body: string,
    data: any = {}
  ): Promise<void> {
    try {
      // Check if notifications are enabled in user preferences
      const notificationsEnabled = await this.areNotificationsEnabled();
      
      if (!notificationsEnabled) {
        console.log('Notifications are disabled by user');
        return;
      }

      await this.initialize();

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Send a field note update notification
   */
  public async sendFieldNoteUpdateNotification(
    propertyAddress: string,
    updaterName: string
  ): Promise<void> {
    await this.sendLocalNotification(
      'Field Notes Updated',
      `${updaterName} updated notes for ${propertyAddress}`,
      {
        type: 'field_note_update',
        propertyAddress,
        updaterName,
      }
    );
  }

  /**
   * Send a sync error notification
   */
  public async sendSyncErrorNotification(
    propertyAddress: string,
    pendingChanges: number
  ): Promise<void> {
    await this.sendLocalNotification(
      'Sync Error',
      `Failed to sync ${pendingChanges} changes for ${propertyAddress}. They will be synced when connection is restored.`,
      {
        type: 'sync_error',
        propertyAddress,
        pendingChanges,
      }
    );
  }

  /**
   * Send a sync success notification
   */
  public async sendSyncSuccessNotification(
    propertyAddress: string,
    changesCount: number
  ): Promise<void> {
    if (changesCount <= 0) return;

    await this.sendLocalNotification(
      'Sync Complete',
      `Successfully synced ${changesCount} changes for ${propertyAddress}.`,
      {
        type: 'sync_success',
        propertyAddress,
        changesCount,
      }
    );
  }

  /**
   * Send a notification when someone else is editing the same document
   */
  public async sendCollaborationNotification(
    propertyAddress: string,
    collaboratorName: string
  ): Promise<void> {
    await this.sendLocalNotification(
      'New Collaborator',
      `${collaboratorName} is now editing notes for ${propertyAddress}.`,
      {
        type: 'new_collaborator',
        propertyAddress,
        collaboratorName,
      }
    );
  }

  /**
   * Handle incoming notifications
   */
  private handleNotification = (notification: Notifications.Notification) => {
    console.log('Notification received:', notification);
    
    // Handle specific notification types
    const data = notification.request.content.data;
    
    if (data?.type === 'field_note_update') {
      // Could trigger a refresh of field notes
      console.log('Field note update notification received');
    }
  };

  /**
   * Check if notifications are enabled in user preferences
   */
  public async areNotificationsEnabled(): Promise<boolean> {
    try {
      const notificationsPreference = await AsyncStorage.getItem(
        'notificationsEnabled'
      );
      // Default to enabled if preference not set
      return notificationsPreference !== 'false';
    } catch (error) {
      console.error('Error checking notification preference:', error);
      return true; // Default to enabled
    }
  }

  /**
   * Set notifications enabled/disabled
   */
  public async setNotificationsEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'notificationsEnabled',
        enabled ? 'true' : 'false'
      );
    } catch (error) {
      console.error('Error setting notification preference:', error);
    }
  }
}