/**
 * Adaptive Long Polling Fallback
 * 
 * This module provides an adaptive long-polling fallback mechanism for when WebSocket
 * connections are unavailable or unstable in the Replit environment.
 * 
 * Features:
 * - Automatically adjusts polling intervals based on activity
 * - Implements exponential backoff on failures
 * - Batches messages to reduce network overhead
 * - Provides transparent reconnection
 */

interface PollingOptions {
  initialInterval?: number;
  minInterval?: number;
  maxInterval?: number;
  inactivityThreshold?: number;
  maxConsecutiveErrors?: number;
  backoffFactor?: number;
}

export class PollingFallback {
  private baseUrl: string;
  private clientId: string;
  private messageHandler: (message: any) => void;
  private connectionHandler: (state: 'connected' | 'disconnected' | 'error', reason?: string) => void;
  
  private pollInterval: number;
  private minInterval: number;
  private maxInterval: number;
  private inactivityThreshold: number;
  private maxConsecutiveErrors: number;
  private backoffFactor: number;
  
  private pollTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private lastActivityTimestamp: number = Date.now();
  private isPolling: boolean = false;
  private consecutiveErrors: number = 0;
  private messageBatch: any[] = [];
  private batchTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private consecutiveEmptyResponses: number = 0;
  private adaptiveInterval: number;
  
  constructor(
    baseUrl: string,
    clientId: string,
    messageHandler: (message: any) => void,
    connectionHandler: (state: 'connected' | 'disconnected' | 'error', reason?: string) => void,
    options: PollingOptions = {}
  ) {
    this.baseUrl = baseUrl;
    this.clientId = clientId;
    this.messageHandler = messageHandler;
    this.connectionHandler = connectionHandler;
    
    // Initialize polling parameters with defaults
    this.minInterval = options.minInterval || 1000;
    this.maxInterval = options.maxInterval || 10000;
    this.pollInterval = options.initialInterval || 2000;
    this.adaptiveInterval = this.pollInterval;
    this.inactivityThreshold = options.inactivityThreshold || 10000;
    this.maxConsecutiveErrors = options.maxConsecutiveErrors || 5;
    this.backoffFactor = options.backoffFactor || 1.5;
    
    // Log initialization
    console.log(`[PollingFallback] Initialized with URL: ${baseUrl}, Client ID: ${clientId}`);
  }
  
  /**
   * Start long polling
   */
  public start(): void {
    if (this.isPolling) {
      console.log('[PollingFallback] Already polling, ignoring start request');
      return;
    }
    
    console.log('[PollingFallback] Starting long polling fallback...');
    this.isPolling = true;
    this.consecutiveErrors = 0;
    this.adaptiveInterval = this.pollInterval;
    
    // Notify connection handler
    this.connectionHandler('connected', 'Long polling started');
    
    // Start polling immediately
    this.poll();
  }
  
  /**
   * Stop long polling
   */
  public stop(reason: string = 'Manually stopped'): void {
    if (!this.isPolling) {
      return;
    }
    
    console.log('[PollingFallback] Stopping long polling');
    this.isPolling = false;
    
    // Clear any pending timeouts
    if (this.pollTimeoutId) {
      clearTimeout(this.pollTimeoutId);
      this.pollTimeoutId = null;
    }
    
    if (this.batchTimeoutId) {
      clearTimeout(this.batchTimeoutId);
      this.batchTimeoutId = null;
    }
    
    // Notify connection handler
    this.connectionHandler('disconnected', reason);
  }
  
  /**
   * Send a message to the server using POST
   */
  public send(message: any): void {
    if (!this.isPolling) {
      console.warn('[PollingFallback] Attempting to send while not polling');
      return;
    }
    
    // Record activity
    this.recordActivity();
    
    // Add message to batch
    this.messageBatch.push(message);
    
    // If this is the first message in the batch, set up a timeout to send the batch
    if (this.messageBatch.length === 1 && !this.batchTimeoutId) {
      this.batchTimeoutId = setTimeout(() => {
        this.sendBatch();
      }, 50); // Short delay to batch messages
    }
  }
  
  /**
   * Send batched messages to the server
   */
  private async sendBatch(): void {
    if (this.messageBatch.length === 0) {
      this.batchTimeoutId = null;
      return;
    }
    
    const batch = [...this.messageBatch];
    this.messageBatch = [];
    this.batchTimeoutId = null;
    
    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: this.clientId,
          messages: batch
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      // Successfully sent batch
      this.consecutiveErrors = 0;
    } catch (error) {
      console.error('[PollingFallback] Error sending batch:', error);
      this.consecutiveErrors++;
      
      // If too many consecutive errors, stop polling
      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        this.stop('Too many send errors');
      }
    }
  }
  
  /**
   * Poll for messages
   */
  private async poll(): void {
    if (!this.isPolling) {
      return;
    }
    
    try {
      // Add timestamp to avoid caching
      const timestamp = Date.now();
      const url = `${this.baseUrl}?clientId=${encodeURIComponent(this.clientId)}&t=${timestamp}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      // Reset consecutive errors on success
      this.consecutiveErrors = 0;
      
      const data = await response.json();
      
      // Process messages
      if (data && data.messages && Array.isArray(data.messages)) {
        if (data.messages.length > 0) {
          // Reset consecutive empty responses counter
          this.consecutiveEmptyResponses = 0;
          
          // Record activity when messages are received
          this.recordActivity();
          
          // Process each message
          data.messages.forEach((message: any) => {
            this.messageHandler(message);
          });
          
          // Adjust polling interval down when there's activity
          this.adjustPollingInterval(true);
        } else {
          this.consecutiveEmptyResponses++;
          
          // Adjust polling interval up after consecutive empty responses
          if (this.consecutiveEmptyResponses > 3) {
            this.adjustPollingInterval(false);
          }
        }
      }
      
      // Schedule next poll
      this.schedulePoll();
    } catch (error) {
      console.error('[PollingFallback] Polling error:', error);
      this.consecutiveErrors++;
      
      // Use exponential backoff for errors
      const backoffDelay = Math.min(
        this.adaptiveInterval * Math.pow(this.backoffFactor, this.consecutiveErrors),
        this.maxInterval
      );
      
      // If too many consecutive errors, stop polling
      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        this.stop('Too many polling errors');
        return;
      }
      
      // Schedule next poll with backoff
      this.pollTimeoutId = setTimeout(() => {
        this.poll();
      }, backoffDelay);
    }
  }
  
  /**
   * Schedule the next poll based on activity
   */
  private schedulePoll(): void {
    if (!this.isPolling) {
      return;
    }
    
    // Clear any existing timeout
    if (this.pollTimeoutId) {
      clearTimeout(this.pollTimeoutId);
    }
    
    // Check inactivity
    const inactiveDuration = Date.now() - this.lastActivityTimestamp;
    
    // Adjust interval based on activity
    if (inactiveDuration > this.inactivityThreshold) {
      // Slow down polling during inactivity
      this.adaptiveInterval = Math.min(this.adaptiveInterval + 500, this.maxInterval);
      console.log(`[PollingFallback] Increasing poll interval to ${this.adaptiveInterval}ms due to inactivity`);
    }
    
    // Schedule next poll
    this.pollTimeoutId = setTimeout(() => {
      this.poll();
    }, this.adaptiveInterval);
  }
  
  /**
   * Record user activity to adjust polling frequency
   */
  public recordActivity(): void {
    this.lastActivityTimestamp = Date.now();
  }
  
  /**
   * Adjust polling interval based on activity
   */
  private adjustPollingInterval(hasActivity: boolean): void {
    if (hasActivity) {
      // Decrease interval when there's activity (faster polling)
      this.adaptiveInterval = Math.max(this.adaptiveInterval - 500, this.minInterval);
      console.log(`[PollingFallback] Adjusting poll interval to ${this.adaptiveInterval}ms`);
    } else {
      // Increase interval when there's no activity (slower polling)
      this.adaptiveInterval = Math.min(this.adaptiveInterval + 500, this.maxInterval);
      console.log(`[PollingFallback] Increasing poll interval to ${this.adaptiveInterval}ms due to inactivity`);
    }
  }
  
  /**
   * Check if currently polling
   */
  public isActive(): boolean {
    return this.isPolling;
  }
  
  /**
   * Get the current polling interval
   */
  public getCurrentInterval(): number {
    return this.adaptiveInterval;
  }
}