/**
 * WebSocketManager
 * Handles WebSocket connection and messaging with robust error handling,
 * reconnection strategies, and ping/pong heartbeat
 */
export class WebSocketManager {
  private url: string;
  private messageHandler: (message: any) => void;
  private connectionHandler: (protocol: string, state: string) => void;
  private socket: WebSocket | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private heartbeatIntervalMs = 30000;
  private heartbeatTimeoutMs = 5000;
  private connectPromiseResolver: ((connected: boolean) => void) | null = null;
  private pendingPings: Map<string, { timestamp: number, timeoutId: ReturnType<typeof setTimeout> }> = new Map();
  
  // Custom event handlers for WebSocketContext
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map();

  /**
   * Create a new WebSocketManager
   * @param endpoint URL endpoint for WebSocket, can be relative
   * @param messageHandler Handler for incoming messages
   * @param connectionHandler Handler for connection state changes
   */
  constructor(
    endpoint: string,
    messageHandler: (message: any) => void,
    connectionHandler: (protocol: string, state: string) => void
  ) {
    // Make URL absolute if needed
    if (endpoint.startsWith('/')) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.url = `${protocol}//${window.location.host}${endpoint}`;
    } else {
      this.url = endpoint;
    }
    
    this.messageHandler = messageHandler;
    this.connectionHandler = connectionHandler;
    
    console.log(`[WebSocketManager] Initialized with URL: ${this.url}`);
  }

  /**
   * Connect to the WebSocket server
   * @returns Promise that resolves to true if connected successfully
   */
  public connect(): Promise<boolean> {
    // Don't try to connect if already connected or connecting
    if (this.isConnected || this.isConnecting) {
      return Promise.resolve(this.isConnected);
    }
    
    console.log(`[WebSocketManager] Connecting to ${this.url}...`);
    this.isConnecting = true;
    
    // Notify of connecting state
    this.connectionHandler('websocket', 'connecting');
    
    return new Promise((resolve) => {
      // Store resolver to call later on success/failure
      this.connectPromiseResolver = resolve;
      
      try {
        // Create WebSocket with protocols (to support servers that validate protocol)
        this.socket = new WebSocket(this.url, ['json', 'v1.websocket.protocol']);
        
        // Setup event handlers
        this.setupSocketHandlers();
      } catch (e) {
        console.error('[WebSocketManager] Error creating WebSocket:', e);
        this.handleConnectionFailure();
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    console.log('[WebSocketManager] Disconnecting...');
    
    // Clear intervals and timeouts
    this.clearHeartbeat();
    this.clearReconnectTimeout();
    
    // Close socket if it exists
    if (this.socket) {
      try {
        this.socket.close(1000, 'Client disconnected intentionally');
      } catch (e) {
        console.error('[WebSocketManager] Error closing WebSocket:', e);
      }
      this.socket = null;
    }
    
    // Update state
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Clear any pending pings
    this.pendingPings.forEach(({ timeoutId }) => clearTimeout(timeoutId));
    this.pendingPings.clear();
    
    // Notify connection handler
    this.connectionHandler('websocket', 'disconnected');
  }

  /**
   * Send a message to the server
   * @param data Data to send
   * @returns true if message was sent, false if not
   */
  public send(data: any): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocketManager] Cannot send message, socket not open');
      return false;
    }
    
    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.socket.send(message);
      return true;
    } catch (e) {
      console.error('[WebSocketManager] Error sending message:', e);
      return false;
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupSocketHandlers(): void {
    if (!this.socket) return;
    
    // Handle socket open
    this.socket.onopen = () => {
      console.log('[WebSocketManager] WebSocket connection established');
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Start heartbeat to keep connection alive
      this.startHeartbeat();
      
      // Notify connection handler
      this.connectionHandler('websocket', 'connected');
      
      // Emit connection event for WebSocketContext
      this.emitEvent('connection', { status: 'connected' });
      
      // Resolve connect promise
      if (this.connectPromiseResolver) {
        this.connectPromiseResolver(true);
        this.connectPromiseResolver = null;
      }
    };
    
    // Handle messages
    this.socket.onmessage = (event) => {
      try {
        // Parse JSON message
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Handle heartbeat responses
        if (data.type === 'heartbeat' && data.action === 'pong') {
          this.handleHeartbeatResponse(data);
          return;
        }
        
        if (data.type === 'pong') {
          this.handlePongResponse(data);
          return;
        }
        
        // Pass other messages to handler
        this.messageHandler(data);
      } catch (e) {
        console.error('[WebSocketManager] Error handling message:', e);
      }
    };
    
    // Handle socket close
    this.socket.onclose = (event) => {
      console.log(`[WebSocketManager] WebSocket closed: ${event.code} - ${event.reason || 'No reason provided'}`);
      
      // Clear heartbeat
      this.clearHeartbeat();
      
      // Update state
      this.isConnected = false;
      this.isConnecting = false;
      
      // Notify connection handler
      this.connectionHandler('websocket', 'disconnected');
      
      // Emit connection event for WebSocketContext
      this.emitEvent('connection', { 
        status: 'disconnected',
        code: event.code,
        reason: event.reason || 'Connection closed'
      });
      
      // Resolve connect promise if still pending
      if (this.connectPromiseResolver) {
        this.connectPromiseResolver(false);
        this.connectPromiseResolver = null;
      }
      
      // Attempt reconnect if not explicitly closed by client
      if (event.code !== 1000) {
        this.scheduleReconnect();
      }
    };
    
    // Handle errors
    this.socket.onerror = (event) => {
      console.error('[WebSocketManager] WebSocket error:', event);
      
      // Most errors are followed by a close event, so just log here
      // The reconnect will be handled in onclose handler
    };
  }

  /**
   * Handle connection failure
   */
  private handleConnectionFailure(): void {
    console.log('[WebSocketManager] Connection attempt failed');
    
    this.isConnecting = false;
    
    // Notify connection handler
    this.connectionHandler('websocket', 'disconnected');
    
    // Resolve connect promise
    if (this.connectPromiseResolver) {
      this.connectPromiseResolver(false);
      this.connectPromiseResolver = null;
    }
    
    // Schedule reconnect
    this.scheduleReconnect();
  }

  /**
   * Schedule reconnect with exponential backoff
   */
  private scheduleReconnect(): void {
    // Don't reconnect if reached max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocketManager] Max reconnect attempts reached, giving up');
      return;
    }
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    
    console.log(`[WebSocketManager] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    // Clear any existing timeout
    this.clearReconnectTimeout();
    
    // Schedule reconnect
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    // Clear any existing interval
    this.clearHeartbeat();
    
    // Start heartbeat interval
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatIntervalMs);
    
    // Send initial heartbeat
    this.sendHeartbeat();
  }

  /**
   * Send heartbeat message
   */
  private sendHeartbeat(): void {
    console.log('[WebSocketManager] Sending heartbeat ping');
    
    // Generate unique ID for this ping
    const pingId = Date.now().toString();
    
    // Set timeout for pong response
    const timeoutId = setTimeout(() => {
      this.handleHeartbeatTimeout(pingId);
    }, this.heartbeatTimeoutMs);
    
    // Store pending ping
    this.pendingPings.set(pingId, {
      timestamp: Date.now(),
      timeoutId
    });
    
    // Send ping
    this.send({
      type: 'heartbeat',
      action: 'ping',
      id: pingId,
      timestamp: Date.now()
    });
  }

  /**
   * Handle heartbeat response
   */
  private handleHeartbeatResponse(data: any): void {
    console.log('[WebSocketManager] Received heartbeat pong');
    
    // Clear pending ping by timestamp matching
    if (data.timestamp) {
      const pingId = data.timestamp.toString();
      const pendingPing = this.pendingPings.get(pingId);
      
      if (pendingPing) {
        // Calculate round-trip time
        const rtt = Date.now() - pendingPing.timestamp;
        console.log(`[WebSocketManager] Heartbeat RTT: ${rtt}ms`);
        
        // Clear timeout
        clearTimeout(pendingPing.timeoutId);
        
        // Remove from pending pings
        this.pendingPings.delete(pingId);
      }
    }
  }

  /**
   * Handle pong response (different from heartbeat pong)
   */
  private handlePongResponse(data: any): void {
    console.log('[WebSocketManager] Received pong response');
    
    // Calculate latency if timestamp available
    if (data.timestamp) {
      const latency = Date.now() - data.timestamp;
      console.log(`[WebSocketManager] Latency: ${latency}ms`);
    }
  }

  /**
   * Handle heartbeat timeout
   */
  private handleHeartbeatTimeout(pingId: string): void {
    console.error('[WebSocketManager] Heartbeat timeout, connection may be dead');
    
    // Remove from pending pings
    this.pendingPings.delete(pingId);
    
    // If we're still connected, disconnect and reconnect
    if (this.isConnected) {
      console.log('[WebSocketManager] Reconnecting due to heartbeat failure');
      
      // Close existing socket
      if (this.socket) {
        try {
          this.socket.close(4000, 'Heartbeat timeout');
        } catch (e) {
          console.error('[WebSocketManager] Error closing WebSocket after heartbeat timeout:', e);
        }
        this.socket = null;
      }
      
      // Update state
      this.isConnected = false;
      this.isConnecting = false;
      
      // Notify connection handler
      this.connectionHandler('websocket', 'disconnected');
      
      // Schedule reconnect
      this.scheduleReconnect();
    }
  }

  /**
   * Clear heartbeat interval and timeout
   */
  private clearHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * Clear reconnect timeout
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
  
  /**
   * Register event handler
   * @param event Event name
   * @param handler Event handler
   */
  public on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    this.eventHandlers.get(event)?.add(handler);
  }
  
  /**
   * Unregister event handler
   * @param event Event name
   * @param handler Event handler
   */
  public off(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      return;
    }
    
    this.eventHandlers.get(event)?.delete(handler);
  }
  
  /**
   * Emit event to registered handlers
   * @param event Event name
   * @param data Event data
   */
  private emitEvent(event: string, data: any): void {
    if (this.eventHandlers.has(event)) {
      for (const handler of this.eventHandlers.get(event)!) {
        try {
          handler(data);
        } catch (e) {
          console.error(`[WebSocketManager] Error in event handler for ${event}:`, e);
        }
      }
    }
  }
}

// Create a singleton instance of WebSocketManager for easy import across the app
export const websocketManager = new WebSocketManager(
  '/ws',
  (message) => {
    console.log('[WebSocketManager] Default message handler:', message);
  },
  (protocol, state) => {
    console.log(`[WebSocketManager] Default connection handler: ${protocol} ${state}`);
  }
);