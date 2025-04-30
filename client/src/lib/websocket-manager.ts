/**
 * WebSocketManager
 * A robust WebSocket client for managing real-time connections
 * with automatic reconnection and event handling
 */
export class WebSocketManager {
  private socket: WebSocket | null = null;
  private url: string;
  private altUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 12; // Increased to handle more reconnection attempts
  private baseReconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 60000; // Max 60 seconds delay between attempts
  private reconnectBackoffFactor = 1.5; // Exponential backoff multiplier
  private reconnectJitter = 0.1; // Add randomness to prevent all clients reconnecting simultaneously
  private reconnectTimeoutId: number | null = null;
  private useAltEndpoint = false; // Flag to track if we're using the alternative endpoint
  private altEndpointFailed = false; // Flag to track if alt endpoint has failed
  private connectionFailCount = 0; // Counter to track consecutive failures
  private maxFailsBeforeAlt = 3; // How many fails before trying alternative endpoint
  
  // Heartbeat mechanism
  private heartbeatInterval = 15000; // Send a heartbeat every 15 seconds
  private heartbeatTimeoutId: number | null = null;
  private lastHeartbeatResponse: number | null = null;
  private heartbeatTimeout = 30000; // If no heartbeat response in 30 seconds, consider connection dead
  
  private listeners: Map<string, Function[]> = new Map();
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private intentionalDisconnect = false;
  
  constructor(path = '/ws') {
    // WebSocket connection URL needs to use the same host and port
    // that served the frontend to work properly in Replit environment
    
    // Build the WebSocket URL using the current window location
    // Do not specify the port manually as Replit handles port forwarding internally
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host; // host includes hostname and port if present
    
    // Use the same host:port that served the page for WebSocket connection
    this.url = `${protocol}//${host}${path}`;
    
    // Store the alternative WebSocket URL for fallback
    this.altUrl = `${protocol}//${host}/ws-alt`;
    
    console.log(`Primary WebSocket URL: ${this.url}`);
    console.log(`Alternative WebSocket URL: ${this.altUrl}`);
  }
  
  /**
   * Get the current connection state
   */
  getState() {
    return this.connectionState;
  }
  
  /**
   * Starts the heartbeat mechanism for connection monitoring
   */
  private startHeartbeat() {
    // Clear any existing heartbeat
    this.stopHeartbeat();
    
    // Set the last heartbeat response time
    this.lastHeartbeatResponse = Date.now();
    
    // Start sending regular heartbeats
    this.heartbeatTimeoutId = window.setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatInterval);
    
    console.log('Heartbeat monitoring started');
  }
  
  /**
   * Stops the heartbeat mechanism
   */
  private stopHeartbeat() {
    if (this.heartbeatTimeoutId !== null) {
      window.clearInterval(this.heartbeatTimeoutId);
      this.heartbeatTimeoutId = null;
    }
  }
  
  /**
   * Sends a heartbeat ping to the server
   */
  private sendHeartbeat() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    // Check if we haven't received a heartbeat response in too long
    const now = Date.now();
    if (this.lastHeartbeatResponse && (now - this.lastHeartbeatResponse > this.heartbeatTimeout)) {
      console.warn(`No heartbeat response received in ${this.heartbeatTimeout / 1000}s, connection may be dead`);
      
      // Force close and reconnect
      if (this.socket) {
        console.log('Forcing connection reset due to heartbeat timeout');
        
        try {
          // Close the socket normally if possible (will trigger reconnect via onclose)
          this.socket.close(4000, 'Heartbeat timeout');
        } catch (e) {
          console.error('Error closing socket after heartbeat timeout:', e);
          
          // If we can't close properly, force socket to null and reconnect manually
          this.socket = null;
          this.connectionState = 'disconnected';
          this.connect();
        }
      }
      return;
    }
    
    // Send heartbeat ping message
    try {
      this.send({
        type: 'heartbeat',
        action: 'ping',
        timestamp: now
      });
    } catch (e) {
      console.error('Error sending heartbeat:', e);
    }
  }
  
  /**
   * Process a heartbeat response from the server
   */
  private handleHeartbeatResponse(data: any) {
    if (data && data.action === 'pong') {
      // Update last heartbeat response time
      this.lastHeartbeatResponse = Date.now();
      
      // Calculate latency if the server included our timestamp
      if (data.timestamp) {
        const latency = Date.now() - data.timestamp;
        // Only log every few heartbeats to avoid console spam
        if (Math.random() < 0.1) {
          console.log(`WebSocket connection healthy, latency: ${latency}ms`);
        }
      }
    }
  }
  
  /**
   * Try connecting to the alternative endpoint
   */
  private tryAlternativeEndpoint() {
    if (this.altEndpointFailed) {
      console.log('Alternative endpoint already failed, not attempting');
      return;
    }
    
    console.log('Trying alternative WebSocket endpoint...');
    this.useAltEndpoint = true;
    this.connect();
  }
  
  /**
   * Reset connection methods to default primary endpoint
   */
  private resetToMainEndpoint() {
    this.useAltEndpoint = false;
    this.connectionFailCount = 0;
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
      // Determine which endpoint to use
      const connectionUrl = this.useAltEndpoint ? this.altUrl : this.url;
      
      console.log(`Connecting to ${this.useAltEndpoint ? 'ALTERNATIVE' : 'PRIMARY'} WebSocket endpoint: ${connectionUrl}`);
      
      // Create a new WebSocket connection
      this.socket = new WebSocket(connectionUrl);
      
      this.socket.onopen = () => {
        console.log(`WebSocket connected successfully using ${this.useAltEndpoint ? 'ALTERNATIVE' : 'PRIMARY'} endpoint`);
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        this.connectionFailCount = 0; // Reset failure count on successful connection
        
        // If using alt endpoint successfully, log it
        if (this.useAltEndpoint) {
          console.log('Alternative WebSocket endpoint is working');
          this.altEndpointFailed = false;
        }
        
        this.emit('connection', { 
          status: 'connected',
          isAltEndpoint: this.useAltEndpoint 
        });
        
        // Start heartbeat on successful connection
        this.startHeartbeat();
      };
      
      this.socket.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code}, reason: ${event.reason || 'No reason provided'}`);
        this.connectionState = 'disconnected';
        this.emit('connection', { 
          status: 'disconnected', 
          code: event.code, 
          reason: event.reason 
        });
        
        // Increment the connection failure counter for tracking persistent issues
        this.connectionFailCount++;
        
        // If we've had multiple failures, consider trying the alternative endpoint
        if (!this.useAltEndpoint && this.connectionFailCount >= this.maxFailsBeforeAlt) {
          console.log(`Primary endpoint failed ${this.connectionFailCount} times. Switching to alternative endpoint.`);
          this.tryAlternativeEndpoint();
          return;
        }
        
        // If alternative endpoint is also failing, mark it as failed
        if (this.useAltEndpoint && this.connectionFailCount >= this.maxFailsBeforeAlt) {
          console.log('Alternative endpoint is also failing. Marking as failed.');
          this.altEndpointFailed = true;
          this.resetToMainEndpoint(); // Go back to trying the main endpoint
        }
        
        // Only attempt to reconnect if not intentionally disconnected
        if (!this.intentionalDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const attemptDisplay = `${this.reconnectAttempts}/${this.maxReconnectAttempts}`;
          
          // Calculate delay with exponential backoff and jitter
          // Calculate backoff delay using the formula: initialDelay * (backoffFactor ^ attemptCount)
          const exponentialDelay = this.baseReconnectDelay * Math.pow(this.reconnectBackoffFactor, this.reconnectAttempts - 1);
          // Add jitter to prevent all clients reconnecting at the same time (thundering herd)
          const jitterFactor = 1 + (Math.random() * this.reconnectJitter * 2 - this.reconnectJitter);
          const delay = Math.min(this.maxReconnectDelay, exponentialDelay * jitterFactor);
          
          console.log(`Attempting to reconnect (${attemptDisplay})... Waiting ${Math.round(delay / 1000)}s before next attempt`);
          
          this.reconnectTimeoutId = window.setTimeout(() => {
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
          
          // Handle heartbeat responses
          if (data.type === 'heartbeat') {
            this.handleHeartbeatResponse(data);
          }
          
          // Emit message to any listeners
          this.emit('message', data);
          
          // Emit events for specific message types
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
        this.reconnectAttempts++;
        
        // Use the same backoff algorithm for consistency
        const exponentialDelay = this.baseReconnectDelay * Math.pow(this.reconnectBackoffFactor, this.reconnectAttempts - 1);
        const jitterFactor = 1 + (Math.random() * this.reconnectJitter * 2 - this.reconnectJitter);
        const delay = Math.min(this.maxReconnectDelay, exponentialDelay * jitterFactor);
        
        console.log(`Connection creation failed. Trying again in ${Math.round(delay / 1000)}s (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        this.reconnectTimeoutId = window.setTimeout(() => {
          this.connect();
        }, delay);
      }
    }
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    this.intentionalDisconnect = true;
    
    // Stop heartbeat monitoring
    this.stopHeartbeat();
    
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