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
  private protocols: string[] = ['json', 'v1.terrafusion.websocket'];
  private clientId: string | null = null;
  
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
    connectionHandler: (protocol: string, state: string) => void,
    options: {
      protocols?: string[],
      reconnectDelayMs?: number,
      maxReconnectAttempts?: number,
      heartbeatIntervalMs?: number
    } = {}
  ) {
    // Get the correct WebSocket URL based on environment
    this.url = this.getWebSocketUrl(endpoint);
    
    // Set handlers
    this.messageHandler = messageHandler;
    this.connectionHandler = connectionHandler;
    
    // Set options with defaults
    if (options.protocols) {
      this.protocols = options.protocols;
    }
    if (options.reconnectDelayMs) {
      this.reconnectDelay = options.reconnectDelayMs;
    }
    if (options.maxReconnectAttempts) {
      this.maxReconnectAttempts = options.maxReconnectAttempts;
    }
    if (options.heartbeatIntervalMs) {
      this.heartbeatIntervalMs = options.heartbeatIntervalMs;
    }
    
    console.log(`[WebSocketManager] Initialized with URL: ${this.url}`);
  }
  
  /**
   * Determine the correct WebSocket URL based on the environment
   */
  private getWebSocketUrl(endpoint: string): string {
    // If endpoint is already a full URL, return it
    if (endpoint.startsWith('ws:') || endpoint.startsWith('wss:')) {
      return endpoint;
    }
    
    // Make sure endpoint starts with /
    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint;
    }
    
    // Detect if running in Replit environment
    const isReplit = window.location.hostname.includes('replit.dev');
    
    // If this is an alternate attempt and we're already using /ws, try /ws-alt
    if (this.reconnectAttempts > 0 && endpoint === '/ws') {
      endpoint = '/ws-alt';
      console.log('[WebSocketManager] Switching to alternate WebSocket endpoint: /ws-alt');
    }
    
    if (isReplit) {
      // In Replit environment, use the current hostname with wss protocol
      // Add a unique cache-busting parameter to avoid proxy caching issues
      const cacheBuster = `t=${Date.now()}`;
      return `wss://${window.location.host}${endpoint}?${cacheBuster}`;
    } else {
      // In local development, use the right protocol based on page protocol
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${window.location.host}${endpoint}`;
    }
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
    
    // Get a fresh URL in case we're trying an alternative endpoint
    // This is important for reconnection attempts to use different endpoints
    this.url = this.getWebSocketUrl(this.url.includes('/ws-alt') ? '/ws-alt' : '/ws');
    
    console.log(`[WebSocketManager] Connecting to ${this.url}...`);
    this.isConnecting = true;
    
    // Notify of connecting state
    this.connectionHandler('websocket', 'connecting');
    
    return new Promise((resolve) => {
      // Store resolver to call later on success/failure
      this.connectPromiseResolver = resolve;
      
      try {
        // Create WebSocket with proper protocol handling
        if (this.protocols && this.protocols.length > 0) {
          this.socket = new WebSocket(this.url, this.protocols);
        } else {
          // Fallback protocols if none provided
          this.socket = new WebSocket(this.url, ['json', 'v1.terrafusion.websocket']);
        }
        
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
      
      // Special handling for code 1006 (abnormal closure) which is common in Replit
      const isAbnormalClosure = event.code === 1006;
      
      // Emit connection event for WebSocketContext
      this.emitEvent('connection', { 
        status: 'disconnected',
        code: event.code,
        reason: event.reason || 'Connection closed',
        isAbnormalClosure
      });
      
      // Resolve connect promise if still pending
      if (this.connectPromiseResolver) {
        this.connectPromiseResolver(false);
        this.connectPromiseResolver = null;
      }
      
      // Attempt reconnect if not explicitly closed by client
      if (event.code !== 1000) {
        this.scheduleReconnect();
        
        // Emit a specific event for 1006 errors (common in Replit)
        if (isAbnormalClosure) {
          this.emitEvent('replit_connection_issue', {
            message: 'Abnormal closure (code 1006) detected - common in Replit environments',
            reconnectAttempt: this.reconnectAttempts + 1,
            maxAttempts: this.maxReconnectAttempts,
            willRetry: this.reconnectAttempts < this.maxReconnectAttempts
          });
          
          // If we're at the last attempt, emit a connection_failed event
          if (this.reconnectAttempts + 1 >= this.maxReconnectAttempts) {
            this.emitEvent('connection_failed', {
              reason: 'Maximum reconnection attempts reached after abnormal closures',
              code: 1006,
              environment: 'replit'
            });
          }
        }
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
      // Emit reconnect attempt event for WebSocketContext
      this.emitEvent('reconnect_attempt', {
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });
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
      // Convert Set to Array to avoid downlevelIteration error
      Array.from(this.eventHandlers.get(event)!).forEach(handler => {
        try {
          handler(data);
        } catch (e) {
          console.error(`[WebSocketManager] Error in event handler for ${event}:`, e);
        }
      });
    }
  }
  
  /**
   * Get the client ID
   * @returns The client ID, or null if not set
   */
  public getClientId(): string | null {
    if (!this.clientId) {
      // Generate a client ID if not set
      this.clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    return this.clientId;
  }
  
  /**
   * Get the current configuration
   * @returns Configuration object with clientId and apiBaseUrl
   */
  public getConfig(): { clientId: string | null; apiBaseUrl: string } {
    return {
      clientId: this.getClientId(), // Use getClientId to ensure we have a client ID
      apiBaseUrl: window.location.origin
    };
  }
  
  /**
   * Handle a message (used by polling fallback)
   * @param message The message to handle
   */
  public handleMessage(message: any): void {
    // Directly invoke message handler as if it came from WebSocket
    this.messageHandler(message);
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
  },
  {
    protocols: ['json', 'v1.terrafusion.websocket'],
    reconnectDelayMs: 1000, // Faster initial reconnect
    maxReconnectAttempts: 3, // Reduced attempts before falling back to polling
    heartbeatIntervalMs: 15000 // More frequent heartbeats for better connection monitoring
  }
);

// Log initialization
console.log('[WebSocketManager] Resilient connection manager initialized with enhanced fallback support');
console.log('[WebSocketManager] WebSocket → Long Polling fallback enabled for Replit environment');