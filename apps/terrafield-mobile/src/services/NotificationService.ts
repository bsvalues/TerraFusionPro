/**
 * NotificationService
 * 
 * This service handles in-app notifications and WebSocket communication
 * for real-time updates.
 */

import { ApiService } from './ApiService';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Notification types
export enum NotificationType {
  NEW_ASSIGNMENT = 'new_assignment',
  SYNC_COMPLETED = 'sync_completed',
  SYNC_STARTED = 'sync_started',
  SYNC_FAILED = 'sync_failed',
  PROPERTY_UPDATED = 'property_updated',
  REPORT_UPDATED = 'report_updated',
  COMMENT_ADDED = 'comment_added',
  COLLABORATION_INVITE = 'collaboration_invite',
  FIELD_NOTE_ADDED = 'field_note_added',
  FIELD_NOTE_UPDATED = 'field_note_updated',
  PHOTO_UPLOADED = 'photo_uploaded',
  SYSTEM_MESSAGE = 'system_message'
}

// Notification interface
export interface Notification {
  id: string;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

type NotificationCallback = (notification: Notification) => void;

export class NotificationService {
  private static instance: NotificationService;
  private apiService: ApiService;
  private wsConnection: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000; // ms
  private isReconnecting: boolean = false;
  private observers: Set<NotificationCallback> = new Set();
  private notifications: Notification[] = [];
  private storageKey: string = 'terrafield_notifications';
  
  private constructor() {
    this.apiService = ApiService.getInstance();
    
    // Load notifications from storage
    this.loadNotifications();
    
    // Monitor network connectivity
    this.monitorConnectivity();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  /**
   * Monitor network connectivity
   */
  private monitorConnectivity() {
    NetInfo.addEventListener(state => {
      if (state.isConnected) {
        if (!this.isConnected && !this.isReconnecting) {
          this.connect();
        }
      } else {
        this.isConnected = false;
      }
    });
  }
  
  /**
   * Connect to the notification WebSocket
   */
  public async connect(userId?: number): Promise<void> {
    if (this.isConnected || this.isReconnecting) return;
    
    try {
      this.isReconnecting = true;
      
      // Get WebSocket URL from API service
      const wsUrl = this.apiService.config.wsBaseUrl;
      if (!wsUrl) {
        throw new Error('WebSocket URL not configured');
      }
      
      // Close existing connection if any
      if (this.wsConnection) {
        this.wsConnection.close();
        this.wsConnection = null;
      }
      
      // Create new WebSocket connection
      this.wsConnection = new WebSocket(`${wsUrl}/notifications`);
      
      // Set up event handlers
      this.wsConnection.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        
        console.log('Connected to notification WebSocket');
        
        // Register with userId if available
        if (userId) {
          this.registerUserId(userId);
        }
      };
      
      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'notification' && data.notification) {
            const notification = data.notification as Notification;
            this.addNotification(notification);
          }
        } catch (error) {
          console.error('Error processing notification message:', error);
        }
      };
      
      this.wsConnection.onclose = () => {
        this.isConnected = false;
        this.wsConnection = null;
        console.log('Notification WebSocket connection closed');
        
        // Attempt to reconnect
        this.attemptReconnect();
      };
      
      this.wsConnection.onerror = (error) => {
        console.error('Notification WebSocket error:', error);
        this.isConnected = false;
        
        // Attempt to reconnect
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Error connecting to notification WebSocket:', error);
      this.isConnected = false;
      this.isReconnecting = false;
      
      // Attempt to reconnect
      this.attemptReconnect();
    }
  }
  
  /**
   * Attempt to reconnect to the WebSocket
   */
  private attemptReconnect(): void {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) return;
    
    this.reconnectAttempts++;
    this.isReconnecting = true;
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.isReconnecting = false;
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }
  
  /**
   * Register user ID with the notification server
   */
  private registerUserId(userId: number): void {
    if (!this.isConnected || !this.wsConnection) return;
    
    try {
      this.wsConnection.send(JSON.stringify({
        type: 'register',
        userId: userId
      }));
      
      console.log(`Registered for notifications with user ID: ${userId}`);
    } catch (error) {
      console.error('Error registering user ID for notifications:', error);
    }
  }
  
  /**
   * Subscribe to notifications
   */
  public subscribe(callback: NotificationCallback): () => void {
    this.observers.add(callback);
    
    // Immediately notify with current notifications
    this.notifications.forEach(notification => {
      callback(notification);
    });
    
    // Return unsubscribe function
    return () => {
      this.observers.delete(callback);
    };
  }
  
  /**
   * Add a notification
   */
  private addNotification(notification: Notification): void {
    // Add to local collection
    this.notifications.unshift(notification);
    
    // Limit to 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
    
    // Save to storage
    this.saveNotifications();
    
    // Notify observers
    this.observers.forEach(callback => {
      callback(notification);
    });
  }
  
  /**
   * Load notifications from storage
   */
  private async loadNotifications(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      if (data) {
        this.notifications = JSON.parse(data);
        console.log(`Loaded ${this.notifications.length} notifications from storage`);
      }
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
    }
  }
  
  /**
   * Save notifications to storage
   */
  private async saveNotifications(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
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
    return this.notifications.filter(notification => !notification.read);
  }
  
  /**
   * Mark a notification as read
   */
  public async markAsRead(notificationId: string): Promise<void> {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    
    if (index !== -1) {
      this.notifications[index].read = true;
      await this.saveNotifications();
    }
  }
  
  /**
   * Mark all notifications as read
   */
  public async markAllAsRead(): Promise<void> {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    
    await this.saveNotifications();
  }
  
  /**
   * Clear all notifications
   */
  public async clearNotifications(): Promise<void> {
    this.notifications = [];
    await this.saveNotifications();
  }
  
  /**
   * Send a notification to a user
   */
  public async sendNotification(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<Notification | null> {
    try {
      // Create notification object
      const notificationData = {
        userId,
        type,
        title,
        message,
        metadata
      };
      
      // Try to send to server if online
      if (this.isConnected) {
        const response = await this.apiService.post<Notification>(
          '/api/notifications', 
          notificationData
        );
        
        if (response) {
          // Add to local collection
          this.addNotification(response);
          return response;
        }
      } else {
        // Generate local notification if offline
        const localNotification: Notification = {
          id: Date.now().toString(36) + Math.random().toString(36).substring(2),
          userId,
          type,
          title,
          message,
          metadata,
          read: false,
          createdAt: new Date().toISOString()
        };
        
        // Add to local collection
        this.addNotification(localNotification);
        return localNotification;
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
    
    return null;
  }
}