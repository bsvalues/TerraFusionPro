// WebSocket connection management for real-time updates

type MessageHandler = (data: any) => void;
type ConnectionStateChangeHandler = (connected: boolean) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: NodeJS.Timeout | null = null;
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
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`[WebSocketClient] Connecting to ${wsUrl}`);
      this.socket = new WebSocket(wsUrl);

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
  }

  // Attempt to reconnect after connection failure
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("[WebSocketClient] Maximum reconnection attempts reached");
      return;
    }

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 30000);
    console.log(`[WebSocketClient] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    
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
}

// Create a singleton instance
const websocketClient = new WebSocketClient();

export default websocketClient;