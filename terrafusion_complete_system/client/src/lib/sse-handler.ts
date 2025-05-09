/**
 * SSEHandler
 * Handles Server-Sent Events (SSE) with fallback to POST requests for sending data
 * Used when WebSockets aren't available or are blocked
 */
export class SSEHandler {
  private url: string;
  private messageHandler: (message: any) => void;
  private connectionHandler: (protocol: string, state: string) => void;
  private eventSource: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private lastEventId: string | null = null;
  private connectPromiseResolver: ((connected: boolean) => void) | null = null;
  private debugMode = true;

  /**
   * Create a new SSEHandler
   * @param endpoint URL endpoint for SSE, can be relative
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
      const protocol = window.location.protocol;
      const host = window.location.host;
      this.url = `${protocol}//${host}${endpoint}`;
    } else {
      this.url = endpoint;
    }
    
    this.messageHandler = messageHandler;
    this.connectionHandler = connectionHandler;
    
    this.log(`Initialized with URL: ${this.url}`);
  }

  /**
   * Connect to the SSE server
   * @returns Promise that resolves to true if connected successfully
   */
  public connect(): Promise<boolean> {
    // Don't try to connect if already connected or connecting
    if (this.isConnected || this.isConnecting) {
      return Promise.resolve(this.isConnected);
    }
    
    this.log(`Connecting to ${this.url}...`);
    this.isConnecting = true;
    
    // Notify of connecting state
    this.connectionHandler('sse', 'connecting');
    
    return new Promise((resolve) => {
      // Store resolver to call later on success/failure
      this.connectPromiseResolver = resolve;
      
      try {
        // Create EventSource with last event ID if available
        const url = new URL(this.url, window.location.href);
        if (this.lastEventId) {
          url.searchParams.append('lastEventId', this.lastEventId);
        }
        
        // Add client ID to identify this client
        url.searchParams.append('clientId', this.generateClientId());
        
        // Create EventSource
        this.eventSource = new EventSource(url.toString());
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Set connection timeout
        this.setConnectionTimeout();
      } catch (e) {
        console.error('[SSEHandler] Error creating EventSource:', e);
        this.handleConnectionFailure();
      }
    });
  }

  /**
   * Disconnect from the SSE server
   */
  public disconnect(): void {
    this.log('Disconnecting...');
    
    // Clear timeouts
    this.clearReconnectTimer();
    
    // Close event source if it exists
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch (e) {
        console.error('[SSEHandler] Error closing EventSource:', e);
      }
      this.eventSource = null;
    }
    
    // Update state
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Notify connection handler
    this.connectionHandler('sse', 'disconnected');
  }

  /**
   * Send a message to the server via POST request
   * SSE is one-way (server to client), so we use POST requests to send data back
   * @param data Data to send
   * @returns true if message was sent, false if not
   */
  public async send(data: any): Promise<boolean> {
    if (!this.isConnected) {
      console.warn('[SSEHandler] Cannot send message, not connected');
      return false;
    }
    
    try {
      const response = await fetch(`${this.url}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': this.generateClientId()
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        console.error(`[SSEHandler] Error sending message: ${response.status} ${response.statusText}`);
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('[SSEHandler] Error sending message:', e);
      return false;
    }
  }

  /**
   * Set up EventSource event handlers
   */
  private setupEventHandlers(): void {
    if (!this.eventSource) return;
    
    // Handle connection open
    this.eventSource.onopen = () => {
      this.log('SSE connection established');
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Notify connection handler
      this.connectionHandler('sse', 'connected');
      
      // Resolve connect promise
      if (this.connectPromiseResolver) {
        this.connectPromiseResolver(true);
        this.connectPromiseResolver = null;
      }
    };
    
    // Handle messages
    this.eventSource.onmessage = (event) => {
      this.handleEvent(event);
    };
    
    // Handle specific event types
    this.eventSource.addEventListener('message', (event) => {
      this.handleEvent(event);
    });
    
    this.eventSource.addEventListener('heartbeat', (event) => {
      this.log('Received heartbeat event');
      // Just acknowledge heartbeat, no need to pass to handler
    });
    
    this.eventSource.addEventListener('error', (event) => {
      console.error('[SSEHandler] Error event:', event);
    });
    
    // Handle connection close
    this.eventSource.onerror = (event) => {
      console.error('[SSEHandler] SSE error:', event);
      
      // Close event source
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
      
      // Update state
      this.isConnected = false;
      this.isConnecting = false;
      
      // Notify connection handler
      this.connectionHandler('sse', 'disconnected');
      
      // Resolve connect promise if still pending
      if (this.connectPromiseResolver) {
        this.connectPromiseResolver(false);
        this.connectPromiseResolver = null;
      }
      
      // Attempt reconnect
      this.scheduleReconnect();
    };
  }

  /**
   * Handle incoming event
   */
  private handleEvent(event: MessageEvent<any>): void {
    try {
      // Store last event ID if available
      if (event.lastEventId) {
        this.lastEventId = event.lastEventId;
      } else if (event.id) {
        this.lastEventId = event.id;
      }
      
      // Parse data
      const data = JSON.parse(event.data);
      
      // Pass to message handler
      this.messageHandler(data);
    } catch (e) {
      console.error('[SSEHandler] Error handling event:', e);
    }
  }

  /**
   * Set connection timeout
   */
  private setConnectionTimeout(): void {
    setTimeout(() => {
      // If still connecting, handle failure
      if (this.isConnecting && !this.isConnected) {
        this.log('Connection timeout');
        this.handleConnectionFailure();
      }
    }, 5000);
  }

  /**
   * Handle connection failure
   */
  private handleConnectionFailure(): void {
    this.log('Connection attempt failed');
    
    // Close event source if it exists
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.isConnecting = false;
    
    // Notify connection handler
    this.connectionHandler('sse', 'disconnected');
    
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
      this.log('Max reconnect attempts reached, giving up');
      return;
    }
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    
    this.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    // Clear any existing timer
    this.clearReconnectTimer();
    
    // Schedule reconnect
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Generate client ID
   */
  private generateClientId(): string {
    // Use a simple random ID if not available
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `sse-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Log message if debug mode is enabled
   */
  private log(message: string, ...args: any[]): void {
    if (this.debugMode) {
      console.log(`[SSEHandler] ${message}`, ...args);
    }
  }
}