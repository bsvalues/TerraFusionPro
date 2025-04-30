/**
 * WebSocketManager
 * A robust WebSocket client for managing real-time connections
 * with automatic reconnection and event handling
 */
export class WebSocketManager {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10; // Increased to handle more reconnection attempts
  private reconnectInterval = 3000;
  private reconnectTimeoutId: number | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private intentionalDisconnect = false;
  
  constructor(path = '/ws') {
    // Build WebSocket URL with a distinct path to avoid conflicts with Vite's HMR
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    
    // In development, we need to use the raw WebSocket endpoint
    // Format: ws://host/ws
    this.url = `${protocol}//${host}${path}`;
    
    console.log(`WebSocket URL: ${this.url}`);
  }
  
  /**
   * Get the current connection state
   */
  getState() {
    return this.connectionState;
  }
  
  /**
   * Connect to the WebSocket server with improved error handling
   */
  connect() {
    // Clear any existing reconnect timeout
    if (this.reconnectTimeoutId !== null) {
      window.clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    // If already connected or connecting, don't create a new connection
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    // Reset the intentional disconnect flag
    this.intentionalDisconnect = false;
    
    // Update connection state
    this.connectionState = 'connecting';
    this.emit('connection', { status: 'connecting' });
    
    try {
      // Create a new WebSocket connection
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected successfully');
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        this.emit('connection', { status: 'connected' });
      };
      
      this.socket.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code}, reason: ${event.reason || 'No reason provided'}`);
        this.connectionState = 'disconnected';
        this.emit('connection', { 
          status: 'disconnected', 
          code: event.code, 
          reason: event.reason 
        });
        
        // Only attempt to reconnect if not intentionally disconnected
        if (!this.intentionalDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
          
          // Use exponential backoff for reconnection
          const delay = Math.min(30000, this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts));
          
          this.reconnectTimeoutId = window.setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, delay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Maximum reconnection attempts reached. Please refresh the page.');
          this.connectionState = 'error';
          this.emit('connection', { 
            status: 'error', 
            message: 'Maximum reconnection attempts reached' 
          });
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionState = 'error';
        this.emit('error', error);
        
        // Let the onclose handler handle reconnection
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('message', data);
          if (data.type) {
            this.emit(data.type, data);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
          this.emit('error', { 
            type: 'parse_error', 
            error: e,
            rawData: event.data
          });
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.connectionState = 'error';
      this.emit('error', { 
        type: 'connection_error', 
        error 
      });
      
      // Still try to reconnect on connection creation error
      if (!this.intentionalDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectTimeoutId = window.setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, this.reconnectInterval);
      }
    }
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    this.intentionalDisconnect = true;
    
    // Clear any pending reconnection attempts
    if (this.reconnectTimeoutId !== null) {
      window.clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    if (this.socket) {
      // Only attempt to close if the socket is not already closed
      if (this.socket.readyState !== WebSocket.CLOSED && this.socket.readyState !== WebSocket.CLOSING) {
        try {
          this.socket.close(1000, 'Intentional disconnection');
        } catch (e) {
          console.error('Error closing WebSocket connection:', e);
        }
      }
      this.socket = null;
      this.connectionState = 'disconnected';
      this.emit('connection', { status: 'disconnected', code: 1000, reason: 'Intentional disconnection' });
    }
  }
  
  /**
   * Send data through the WebSocket connection with improved error handling
   */
  send(data: any) {
    if (!this.socket) {
      console.error('Cannot send message, WebSocket is not initialized');
      this.emit('error', { 
        type: 'send_error', 
        message: 'WebSocket is not initialized',
        data 
      });
      return false;
    }
    
    if (this.socket.readyState === WebSocket.OPEN) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        this.socket.send(message);
        return true;
      } catch (e) {
        console.error('Error sending WebSocket message:', e);
        this.emit('error', { 
          type: 'send_error', 
          error: e,
          data 
        });
        return false;
      }
    } else if (this.socket.readyState === WebSocket.CONNECTING) {
      console.warn('WebSocket is still connecting, message will be queued');
      // Queue the message to be sent when the connection opens
      this.once('connection', (connectionData: any) => {
        if (connectionData.status === 'connected') {
          this.send(data);
        }
      });
      return true;
    } else {
      console.error(`Cannot send message, WebSocket is in state: ${this.getReadyStateString()}`);
      // Try to reconnect if disconnected
      if (this.socket.readyState === WebSocket.CLOSED && !this.intentionalDisconnect) {
        this.connect();
        // Queue the message to be sent when the connection opens
        this.once('connection', (connectionData: any) => {
          if (connectionData.status === 'connected') {
            this.send(data);
          }
        });
        return true;
      }
      
      this.emit('error', { 
        type: 'send_error', 
        message: `WebSocket is in state: ${this.getReadyStateString()}`,
        data 
      });
      return false;
    }
  }
  
  /**
   * Register an event listener
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
    return this; // Enable chaining
  }
  
  /**
   * Register a one-time event listener
   */
  once(event: string, callback: Function) {
    const onceCallback = (data: any) => {
      this.off(event, onceCallback);
      callback(data);
    };
    
    this.on(event, onceCallback);
    return this; // Enable chaining
  }
  
  /**
   * Remove an event listener
   */
  off(event: string, callback: Function) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event) || [];
      this.listeners.set(
        event, 
        callbacks.filter(cb => cb !== callback)
      );
    }
    return this; // Enable chaining
  }
  
  /**
   * Get a string representation of the WebSocket readyState
   */
  private getReadyStateString(): string {
    if (!this.socket) return 'UNINITIALIZED';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }
  
  /**
   * Emit an event to all registered listeners
   */
  private emit(event: string, data: any) {
    if (this.listeners.has(event)) {
      const callbacks = [...this.listeners.get(event) || []];
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`Error in ${event} listener:`, e);
        }
      });
    }
  }
}

// Create singleton instance
export const websocketManager = new WebSocketManager();