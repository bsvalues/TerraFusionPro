/**
 * SimplifiedWebSocketManager
 * Streamlined WebSocket implementation for Replit environment
 */
export class SimplifiedWebSocketManager {
  private url: string;
  private socket: WebSocket | null = null;
  private isConnected = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  
  // Event handlers
  private messageHandlers: ((data: any) => void)[] = [];
  private connectionHandlers: ((status: 'connected' | 'connecting' | 'disconnected', details?: any) => void)[] = [];

  /**
   * Create a new SimplifiedWebSocketManager
   * @param endpoint WebSocket endpoint path (e.g., '/ws')
   */
  constructor(endpoint: string = '/ws') {
    // Make sure endpoint starts with /
    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint;
    }
    
    // Add cache-busting and client ID parameters for Replit environment
    const cacheBuster = `t=${Date.now()}`;
    const clientIdentifier = `client=${this.clientId.substring(0, 8)}`;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    this.url = `${wsProtocol}//${window.location.host}${endpoint}?${cacheBuster}&${clientIdentifier}`;
    
    console.log(`[WebSocket] Initialized with URL: ${this.url}`);
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.isConnected || this.socket) {
      console.log('[WebSocket] Already connected or connecting');
      return;
    }

    // Generate a new URL with fresh timestamp
    const cacheBuster = `t=${Date.now()}`;
    const clientIdentifier = `client=${this.clientId.substring(0, 8)}`;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const endpoint = this.url.split('?')[0]; // Get the base endpoint without parameters
    this.url = `${wsProtocol}//${window.location.host}${endpoint}?${cacheBuster}&${clientIdentifier}`;

    console.log(`[WebSocket] Connecting to ${this.url}`);
    this.notifyConnectionHandlers('connecting');
    
    try {
      // Create WebSocket without protocols for maximum compatibility
      this.socket = new WebSocket(this.url);
      
      // Set up event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('[WebSocket] Error creating WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect the WebSocket
   */
  public disconnect(): void {
    this.stopPingInterval();
    this.clearReconnectTimeout();
    
    if (this.socket) {
      try {
        this.socket.close(1000, 'Client disconnected');
      } catch (error) {
        console.error('[WebSocket] Error closing WebSocket:', error);
      }
      this.socket = null;
    }
    
    this.isConnected = false;
    this.notifyConnectionHandlers('disconnected');
  }

  /**
   * Send a message through the WebSocket
   * @param data Message data (will be JSON stringified if not a string)
   * @returns true if message was sent, false otherwise
   */
  public send(data: any): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot send message, socket not connected');
      return false;
    }
    
    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.socket.send(message);
      return true;
    } catch (error) {
      console.error('[WebSocket] Error sending message:', error);
      return false;
    }
  }

  /**
   * Add a message handler
   * @param handler Function to handle incoming messages
   */
  public addMessageHandler(handler: (data: any) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Add a connection status handler
   * @param handler Function to handle connection status changes
   */
  public addConnectionHandler(handler: (status: 'connected' | 'connecting' | 'disconnected', details?: any) => void): void {
    this.connectionHandlers.push(handler);
  }

  /**
   * Get the client ID
   */
  public getClientId(): string {
    return this.clientId;
  }

  /**
   * Check if the WebSocket is connected
   */
  public isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('[WebSocket] Connection established');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // Start sending pings to keep the connection alive
    this.startPingInterval();
    
    // Send initial identification message
    this.send({
      type: 'client_connected',
      clientId: this.clientId,
      timestamp: Date.now()
    });
    
    // Notify connection handlers
    this.notifyConnectionHandlers('connected');
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      // Parse the message if it's a string
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      
      // Notify all message handlers
      this.messageHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('[WebSocket] Error in message handler:', error);
        }
      });
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`[WebSocket] Connection closed: ${event.code} - ${event.reason || 'No reason provided'}`);
    
    this.stopPingInterval();
    this.isConnected = false;
    this.socket = null;
    
    // Notify connection handlers
    this.notifyConnectionHandlers('disconnected', {
      code: event.code,
      reason: event.reason || 'Connection closed'
    });
    
    // Schedule reconnect unless it was an intentional close
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('[WebSocket] Error:', event);
    // The close handler will be called after this and handle reconnection
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocket] Maximum reconnect attempts reached, giving up');
      return;
    }
    
    // Clear any existing timeout
    this.clearReconnectTimeout();
    
    // Calculate delay based on attempt number (simple incremental backoff)
    const delay = 1000 * (this.reconnectAttempts + 1);
    
    console.log(`[WebSocket] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    // Set timeout to reconnect
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Start sending periodic pings to keep the connection alive
   */
  private startPingInterval(): void {
    this.stopPingInterval();
    
    // Send a ping every 30 seconds
    this.pingInterval = setInterval(() => {
      this.send({
        type: 'ping',
        clientId: this.clientId,
        timestamp: Date.now()
      });
    }, 30000);
  }

  /**
   * Stop the ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Clear the reconnect timeout
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Notify all connection handlers of a status change
   */
  private notifyConnectionHandlers(status: 'connected' | 'connecting' | 'disconnected', details?: any): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(status, details);
      } catch (error) {
        console.error('[WebSocket] Error in connection handler:', error);
      }
    });
  }
}