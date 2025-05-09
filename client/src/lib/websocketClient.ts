// WebSocket connection management for real-time updates

type MessageHandler = (data: any) => void;
type ConnectionStateChangeHandler = (connected: boolean) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 50; // Allow more reconnect attempts
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private backoffFactor = 1.3; // Slower backoff to allow more recovery time
  private minReconnectDelay = 1000; // 1 second minimum delay
  private maxReconnectDelay = 60000; // 1 minute maximum delay
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private connectionStateHandlers: Set<ConnectionStateChangeHandler> = new Set();
  private isConnected = false;
  private pendingMessages: Array<{ type: string; data: any }> = [];

  // Initialize the WebSocket connection
  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log("[WebSocketClient] Already connected");
      return;
    }

    try {
      // Determine the correct protocol (ws: or wss:) based on the current page
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      
      // Extract server port - we'll connect directly to avoid Vite interference
      const hostParts = window.location.host.split(':');
      const baseHost = hostParts[0];
      // Default to port 5000 which is our Express server port
      const serverPort = "5000";
      
      // In Replit, we need to use the same hostname without specifying a custom port
      // This ensures the request goes through Replit's proxy correctly
      // Adding a timestamp query parameter to prevent caching issues
      const timestamp = Date.now();
      const wsUrl = `${protocol}//${window.location.host}/ws?t=${timestamp}`;
      const wsAltUrl = `${protocol}//${window.location.host}/ws-alt?t=${timestamp}`;
      
      console.log(`[WebSocketClient] Connecting to ${wsUrl} (Replit proxy)`);
      
      try {
        this.socket = new WebSocket(wsUrl);
      } catch (error) {
        console.warn(`[WebSocketClient] Failed to connect to primary WebSocket endpoint, trying alternative...`);
        try {
          // Try the alternative WebSocket endpoint
          console.log(`[WebSocketClient] Connecting to alternative endpoint ${wsAltUrl}`);
          this.socket = new WebSocket(wsAltUrl);
        } catch (altError) {
          console.error(`[WebSocketClient] Failed to connect to alternative WebSocket endpoint: ${altError}`);
          throw error; // Rethrow the original error to trigger reconnect logic
        }
      }

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error("[WebSocketClient] Connection error:", error);
      this.attemptReconnect();
    }
  }

  // Handle successful connection
  private handleOpen() {
    console.log("[WebSocketClient] Connected successfully");
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.notifyConnectionStateChange(true);
    
    // Send any pending messages that were queued while disconnected
    this.sendPendingMessages();
  }

  // Handle incoming messages
  private handleMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data);
      
      if (message && message.type) {
        console.log(`[WebSocketClient] Received message of type: ${message.type}`);
        
        // Find all handlers registered for this message type
        const handlers = this.messageHandlers.get(message.type);
        if (handlers) {
          handlers.forEach(handler => handler(message.data));
        }
        
        // Also trigger any handlers registered for 'all' messages
        const allHandlers = this.messageHandlers.get('all');
        if (allHandlers) {
          allHandlers.forEach(handler => handler(message));
        }
      }
    } catch (error) {
      console.error("[WebSocketClient] Error processing message:", error);
    }
  }

  // Handle connection close
  private handleClose(event: CloseEvent) {
    console.log(`[WebSocketClient] Connection closed: ${event.code} ${event.reason}`);
    this.isConnected = false;
    this.notifyConnectionStateChange(false);
    this.attemptReconnect();
  }

  // Handle connection errors
  private handleError(event: Event) {
    console.error("[WebSocketClient] WebSocket error:", event);
    this.isConnected = false;
    this.notifyConnectionStateChange(false);
    
    // Automatically attempt to reconnect after an error
    this.attemptReconnect();
  }

  // Attempt to reconnect after connection failure
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("[WebSocketClient] Maximum reconnection attempts reached");
      
      // Notify the UI that we're falling back to long-polling
      this.notifyConnectionStateChange(false);
      
      // We could implement a long-polling fallback here if needed
      console.log("[WebSocketClient] Switching to long-polling fallback");
      return;
    }

    // Calculate delay with exponential backoff and jitter
    const baseDelay = this.minReconnectDelay * Math.pow(this.backoffFactor, this.reconnectAttempts);
    // Add jitter (±20%) to prevent all clients reconnecting at once
    const jitter = 0.8 + (Math.random() * 0.4);
    const delay = Math.min(baseDelay * jitter, this.maxReconnectDelay);
    
    console.log(`[WebSocketClient] Attempting to reconnect in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts + 1} of ${this.maxReconnectAttempts})`);
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  // Notify all registered handlers of connection state changes
  private notifyConnectionStateChange(connected: boolean) {
    this.connectionStateHandlers.forEach(handler => handler(connected));
  }

  // Send pending messages after reconnection
  private sendPendingMessages() {
    if (this.pendingMessages.length > 0 && this.isConnected) {
      console.log(`[WebSocketClient] Sending ${this.pendingMessages.length} pending messages`);
      
      this.pendingMessages.forEach(message => {
        this.send(message.type, message.data);
      });
      
      this.pendingMessages = [];
    }
  }

  // Register a handler for specific message types
  subscribe(messageType: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set());
    }
    
    const handlers = this.messageHandlers.get(messageType)!;
    handlers.add(handler);
    
    // Return an unsubscribe function
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(messageType);
      }
    };
  }

  // Register a handler for connection state changes
  onConnectionStateChange(handler: ConnectionStateChangeHandler): () => void {
    this.connectionStateHandlers.add(handler);
    
    // Immediately notify with current state
    handler(this.isConnected);
    
    // Return an unsubscribe function
    return () => {
      this.connectionStateHandlers.delete(handler);
    };
  }

  // Send a message through the WebSocket
  send(type: string, data: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn("[WebSocketClient] Cannot send message, socket not open");
      // Queue the message to be sent when connection is established
      this.pendingMessages.push({ type, data });
      return false;
    }

    try {
      const message = JSON.stringify({ type, data });
      this.socket.send(message);
      return true;
    } catch (error) {
      console.error("[WebSocketClient] Error sending message:", error);
      return false;
    }
  }

  // Disconnect the WebSocket
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      
      if (this.socket.readyState === WebSocket.OPEN || 
          this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close();
      }
      
      this.socket = null;
    }
    
    this.isConnected = false;
    this.notifyConnectionStateChange(false);
  }

  // Check if currently connected
  isSocketConnected(): boolean {
    return this.isConnected;
  }
  
  // Get current reconnect attempts
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
  
  // Get max reconnect attempts
  getMaxReconnectAttempts(): number {
    return this.maxReconnectAttempts;
  }
}

// Create a singleton instance
const websocketClient = new WebSocketClient();

export default websocketClient;