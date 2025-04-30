/**
 * RealtimeService
 * A unified service that tries WebSockets first, then falls back to polling
 * This provides a consistent API for real-time updates regardless of the underlying technology
 */

import { websocketManager } from './websocket-manager';
import { fallbackPollingService, type PollingConfig } from './fallback-polling';

// How many connection attempts before falling back
const MAX_WS_ATTEMPTS_BEFORE_FALLBACK = 3;

// Event tracking
interface EventSubscription {
  id: string;
  event: string;
  callback: (data: any) => void;
}

export class RealtimeService {
  private useWebSockets: boolean = true;
  private wsAttempts: number = 0;
  private wsSubscriptions: EventSubscription[] = [];
  private pollingConfigs: Map<string, PollingConfig> = new Map();
  private initialized: boolean = false;
  
  constructor() {
    this.initialize();
  }
  
  /**
   * Initialize the service and setup event listeners
   */
  private initialize(): void {
    if (this.initialized) return;
    
    // Listen for WebSocket connection status
    websocketManager.on('connection', (data: any) => {
      if (data.status === 'error') {
        this.wsAttempts++;
        
        // If we've tried enough times, fall back to polling
        if (this.wsAttempts >= MAX_WS_ATTEMPTS_BEFORE_FALLBACK) {
          console.warn(`WebSocket connection failed ${this.wsAttempts} times, falling back to polling`);
          this.switchToPolling();
        }
      } else if (data.status === 'connected') {
        // We're connected, reset attempts and ensure we're using WebSockets
        this.wsAttempts = 0;
        this.useWebSockets = true;
      }
    });
    
    this.initialized = true;
    console.log('[RealtimeService] Initialized with WebSocket preferred, polling fallback');
  }
  
  /**
   * Switch from WebSockets to polling
   */
  private switchToPolling(): void {
    this.useWebSockets = false;
    
    // Start polling for all subscribed resources
    for (const [id, config] of this.pollingConfigs.entries()) {
      fallbackPollingService.startPolling(id, config);
    }
  }
  
  /**
   * Subscribe to a real-time event/resource
   */
  public subscribe(id: string, options: {
    event: string;
    endpoint: string;
    queryKey: string | string[];
    intervalMs?: number;
    callback: (data: any) => void;
  }): void {
    // Store the subscription for both mechanisms
    const subscription: EventSubscription = {
      id,
      event: options.event,
      callback: options.callback
    };
    
    // Add to WebSocket subscriptions
    this.wsSubscriptions.push(subscription);
    
    // Register with WebSocket manager
    if (this.useWebSockets) {
      websocketManager.on(options.event, options.callback);
    }
    
    // Prepare polling config for fallback
    const pollingConfig: PollingConfig = {
      enabled: true,
      intervalMs: options.intervalMs || 10000,
      endpoint: options.endpoint,
      queryKey: options.queryKey,
      onData: options.callback
    };
    
    // Store the polling config
    this.pollingConfigs.set(id, pollingConfig);
    
    // If we're already in polling mode, start polling
    if (!this.useWebSockets) {
      fallbackPollingService.startPolling(id, pollingConfig);
    }
  }
  
  /**
   * Unsubscribe from a real-time event/resource
   */
  public unsubscribe(id: string): void {
    // Find and remove WebSocket subscriptions
    const subscriptions = this.wsSubscriptions.filter(sub => sub.id === id);
    
    // Remove each subscription
    for (const sub of subscriptions) {
      websocketManager.off(sub.event, sub.callback);
    }
    
    // Remove from internal tracking
    this.wsSubscriptions = this.wsSubscriptions.filter(sub => sub.id !== id);
    
    // Stop polling if active
    fallbackPollingService.stopPolling(id);
    
    // Remove polling config
    this.pollingConfigs.delete(id);
  }
  
  /**
   * Send data/message through the real-time connection
   */
  public send(data: any): boolean {
    if (this.useWebSockets) {
      return websocketManager.send(data);
    } else {
      console.warn('[RealtimeService] Cannot send messages when in polling fallback mode');
      return false;
    }
  }
  
  /**
   * Connect to the real-time service
   */
  public connect(): void {
    if (this.useWebSockets) {
      websocketManager.connect();
    }
  }
  
  /**
   * Disconnect from the real-time service
   */
  public disconnect(): void {
    // Disconnect WebSocket if connected
    if (this.useWebSockets) {
      websocketManager.disconnect();
    }
    
    // Stop all polling tasks
    for (const id of this.pollingConfigs.keys()) {
      fallbackPollingService.stopPolling(id);
    }
  }
  
  /**
   * Get the current connection mechanism
   */
  public getConnectionMethod(): 'websocket' | 'polling' {
    return this.useWebSockets ? 'websocket' : 'polling';
  }
  
  /**
   * Get the current connection status
   */
  public getConnectionStatus(): string {
    if (this.useWebSockets) {
      return websocketManager.getState();
    } else {
      return 'polling';
    }
  }
  
  /**
   * Force use of polling (for testing)
   */
  public forcePolling(): void {
    this.switchToPolling();
  }
  
  /**
   * Force use of WebSockets (for testing)
   */
  public forceWebSockets(): void {
    this.useWebSockets = true;
    
    // Stop all polling
    for (const id of this.pollingConfigs.keys()) {
      fallbackPollingService.stopPolling(id);
    }
    
    // Reconnect WebSocket
    websocketManager.connect();
  }
}

// Create and export singleton
export const realtimeService = new RealtimeService();