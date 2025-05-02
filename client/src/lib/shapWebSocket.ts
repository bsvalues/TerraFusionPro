/**
 * TerraFusion SHAP WebSocket Client
 * Connects to the SHAP WebSocket server to receive real-time SHAP values
 */

// Define the event types
export type ShapWebSocketEventType = 
  | 'connection_established'
  | 'shap_update'
  | 'error'
  | 'disconnected';

// Define the event data structures
export interface ShapData {
  condition: string;
  base_score: number;
  final_score: number;
  features: string[];
  values: number[];
  image_path: string;
}

export interface ShapMessage {
  type: 'shap_update';
  data: ShapData | Record<string, ShapData>;
  timestamp: number;
}

export interface ConnectionEstablishedMessage {
  type: 'connection_established';
  clientId: string;
  timestamp: number;
  message: string;
}

export interface ErrorMessage {
  type: 'error';
  timestamp: number;
  error: string;
}

export type ShapWebSocketMessage = 
  | ShapMessage
  | ConnectionEstablishedMessage
  | ErrorMessage;

// Define event handler type
export type ShapWebSocketEventHandler = (data: any) => void;

/**
 * SHAP WebSocket client for receiving real-time SHAP values
 */
class ShapWebSocketClient {
  private socket: WebSocket | null = null;
  private connected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000; // Start with 2s delay
  private eventHandlers: Map<ShapWebSocketEventType, Set<ShapWebSocketEventHandler>> = new Map();
  private clientId: string | null = null;
  private pendingRequests: Map<string, { resolve: Function, reject: Function }> = new Map();
  private wsUrl: string = '';

  /**
   * Initialize the WebSocket connection
   */
  connect(customUrl?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Close existing connection if any
        if (this.socket) {
          this.socket.close();
        }

        // Determine WebSocket URL
        if (customUrl) {
          this.wsUrl = customUrl;
        } else {
          const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
          this.wsUrl = `${protocol}//${window.location.host}/shap-ws`;
        }

        console.log(`[SHAP WebSocket] Connecting to ${this.wsUrl}...`);
        
        // Create new WebSocket
        this.socket = new WebSocket(this.wsUrl);
        
        // Set up event handlers
        this.socket.onopen = () => {
          console.log('[SHAP WebSocket] Connection established');
          this.connected = true;
          this.reconnectAttempts = 0;
          resolve();
        };
        
        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as ShapWebSocketMessage;
            this.handleMessage(message);
          } catch (error) {
            console.error('[SHAP WebSocket] Error parsing message:', error);
          }
        };
        
        this.socket.onclose = (event) => {
          console.log(`[SHAP WebSocket] Connection closed: ${event.code} - ${event.reason || 'No reason provided'}`);
          this.connected = false;
          this.triggerEvent('disconnected', { code: event.code, reason: event.reason });
          
          // Try to reconnect if not deliberately closed
          if (event.code !== 1000) {
            this.scheduleReconnect();
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('[SHAP WebSocket] WebSocket error:', error);
          this.connected = false;
          reject(error);
        };
      } catch (error) {
        console.error('[SHAP WebSocket] Error setting up connection:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: ShapWebSocketMessage): void {
    // Update client ID if this is a connection established message
    if (message.type === 'connection_established') {
      this.clientId = message.clientId;
    }
    
    // Trigger event handlers
    this.triggerEvent(message.type as ShapWebSocketEventType, message);
  }
  
  /**
   * Register event handler
   */
  on(event: ShapWebSocketEventType, handler: ShapWebSocketEventHandler): void {
    // Get or create the handlers set for this event
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    // Add the handler
    this.eventHandlers.get(event)!.add(handler);
  }
  
  /**
   * Remove event handler
   */
  off(event: ShapWebSocketEventType, handler: ShapWebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }
  
  /**
   * Trigger event handlers
   */
  private triggerEvent(event: ShapWebSocketEventType, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          console.error(`[SHAP WebSocket] Error in ${event} handler:`, error);
        }
      }
    }
  }
  
  /**
   * Request SHAP values for a specific condition
   */
  requestShapForCondition(condition: string): void {
    if (!this.connected || !this.socket) {
      console.warn('[SHAP WebSocket] Cannot request SHAP values: not connected');
      return;
    }
    
    const request = {
      type: 'request_shap',
      condition,
      clientId: this.clientId,
      timestamp: Date.now()
    };
    
    this.socket.send(JSON.stringify(request));
  }
  
  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[SHAP WebSocket] Max reconnect attempts reached, giving up');
      return;
    }
    
    // Calculate delay with exponential backoff
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    
    console.log(`[SHAP WebSocket] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`[SHAP WebSocket] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      // Try alternate endpoint on even-numbered attempts
      if (this.reconnectAttempts % 2 === 0) {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const altUrl = `${protocol}//${window.location.host}/shap-ws-alt`;
        console.log(`[SHAP WebSocket] Switching to alternate endpoint: /shap-ws-alt`);
        this.connect(altUrl).catch(() => {
          // Failed to connect to alternate endpoint
          this.scheduleReconnect();
        });
      } else {
        // Try primary endpoint
        this.connect(this.wsUrl).catch(() => {
          // Failed to connect to primary endpoint
          this.scheduleReconnect();
        });
      }
    }, delay);
  }
  
  /**
   * Check if the client is connected
   */
  isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Close the WebSocket connection
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, "Client disconnect");
      this.socket = null;
      this.connected = false;
      this.clientId = null;
    }
  }
  
  /**
   * Get client ID
   */
  getClientId(): string | null {
    return this.clientId;
  }
}

// Export singleton instance
export const shapWebSocketClient = new ShapWebSocketClient();