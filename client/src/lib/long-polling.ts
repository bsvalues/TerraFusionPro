/**
 * LongPollingClient
 * Handles real-time communication via long polling for environments
 * where WebSockets and SSE are not available or blocked
 */
export class LongPollingClient {
  private url: string;
  private messageHandler: (message: any) => void;
  private connectionHandler: (protocol: string, state: string) => void;
  private isConnected = false;
  private isConnecting = false;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private connectPromiseResolver: ((connected: boolean) => void) | null = null;
  private clientId: string | null = null;
  private lastMessageId = 0;
  private pollInterval = 3000; // 3 seconds
  private maxPollInterval = 15000; // 15 seconds
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private initialReconnectDelay = 1000;
  private debugMode = true;

  /**
   * Create a new LongPollingClient
   * @param endpoint URL endpoint for long polling, can be relative
   * @param messageHandler Function to handle incoming messages
   * @param connectionHandler Function to handle connection state changes
   */
  constructor(
    endpoint: string,
    messageHandler: (message: any) => void,
    connectionHandler: (protocol: string, state: string) => void
  ) {
    // Make URL absolute if needed
    if (endpoint.startsWith("/")) {
      const protocol = window.location.protocol;
      const host = window.location.host;
      this.url = `${protocol}//${host}${endpoint}`;
    } else {
      this.url = endpoint;
    }

    this.messageHandler = messageHandler;
    this.connectionHandler = connectionHandler;

    // Generate client ID
    this.clientId = this.generateClientId();

    this.log(`Initialized with URL: ${this.url}, Client ID: ${this.clientId}`);
  }

  /**
   * Connect to the long polling server
   * @returns Promise that resolves to true if connected successfully
   */
  public connect(): Promise<boolean> {
    // Don't try to connect if already connected or connecting
    if (this.isConnected || this.isConnecting) {
      return Promise.resolve(this.isConnected);
    }

    this.log("Connecting...");
    this.isConnecting = true;

    // Notify of connecting state
    this.connectionHandler("long-polling", "connecting");

    return new Promise((resolve) => {
      // Store resolver to call later on success/failure
      this.connectPromiseResolver = resolve;

      // Initial connection
      this.establishConnection()
        .then((connected) => {
          if (connected) {
            this.log("Connected successfully");
            this.isConnected = true;
            this.isConnecting = false;

            // Start polling
            this.startPolling();

            // Notify connection handler
            this.connectionHandler("long-polling", "connected");

            // Resolve connect promise
            if (this.connectPromiseResolver) {
              this.connectPromiseResolver(true);
              this.connectPromiseResolver = null;
            }
          } else {
            this.log("Connection failed");
            this.handleConnectionFailure();
          }
        })
        .catch((error) => {
          console.error("[LongPollingClient] Connection error:", error);
          this.handleConnectionFailure();
        });
    });
  }

  /**
   * Disconnect from the long polling server
   */
  public disconnect(): void {
    this.log("Disconnecting...");

    // Clear timers
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Update state
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    // Notify connection handler
    this.connectionHandler("long-polling", "disconnected");
  }

  /**
   * Send a message to the server
   * @param data Data to send
   * @returns true if the message was sent, false if not
   */
  public async send(data: any): Promise<boolean> {
    if (!this.isConnected) {
      console.warn("[LongPollingClient] Cannot send message, not connected");
      return false;
    }

    try {
      const response = await fetch(`${this.url}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-ID": this.clientId || "",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error(
          `[LongPollingClient] Error sending message: ${response.status} ${response.statusText}`
        );
        return false;
      }

      return true;
    } catch (e) {
      console.error("[LongPollingClient] Error sending message:", e);
      return false;
    }
  }

  /**
   * Establish initial connection
   */
  private async establishConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.url}/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-ID": this.clientId || "",
        },
        body: JSON.stringify({
          clientId: this.clientId,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        console.error(
          `[LongPollingClient] Connection error: ${response.status} ${response.statusText}`
        );
        return false;
      }

      const data = await response.json();

      // Store client ID if returned from server
      if (data.clientId) {
        this.clientId = data.clientId;
      }

      return true;
    } catch (e) {
      console.error("[LongPollingClient] Connection error:", e);
      return false;
    }
  }

  /**
   * Start long polling
   */
  private startPolling(): void {
    this.poll();
  }

  /**
   * Send a poll request
   */
  private async poll(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const response = await fetch(`${this.url}/poll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-ID": this.clientId || "",
        },
        body: JSON.stringify({
          clientId: this.clientId,
          lastMessageId: this.lastMessageId,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        console.error(`[LongPollingClient] Poll error: ${response.status} ${response.statusText}`);
        this.schedulePoll();
        return;
      }

      const data = await response.json();

      // Handle poll response
      this.handlePollResponse(data);

      // Schedule next poll
      this.schedulePoll();
    } catch (e) {
      console.error("[LongPollingClient] Poll error:", e);

      // Check if we're still connected (error might be due to network issues)
      // Schedule next poll with possibly increased interval
      this.schedulePoll();
    }
  }

  /**
   * Schedule next poll with adaptive interval
   */
  private schedulePoll(): void {
    // Clear any existing timer
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    // Schedule next poll
    this.pollTimer = setTimeout(() => {
      this.poll();
    }, this.pollInterval);
  }

  /**
   * Handle poll response
   * @param data Response data from server
   */
  private handlePollResponse(data: any): void {
    if (data.error) {
      console.error(`[LongPollingClient] Server error: ${data.error}`);
      return;
    }

    // Update last message ID if provided
    if (data.lastMessageId) {
      this.lastMessageId = data.lastMessageId;
    }

    // Process messages
    if (data.messages && Array.isArray(data.messages)) {
      data.messages.forEach((message: any) => {
        // Update last message ID if provided
        if (message.id && message.id > this.lastMessageId) {
          this.lastMessageId = message.id;
        }

        // Process message
        this.messageHandler(message.data);
      });
    }

    // Reset poll interval on successful poll with messages
    if (data.messages && data.messages.length > 0) {
      this.pollInterval = 3000; // Reset to default
    } else {
      // Adaptive polling - slowly increase interval if no messages
      this.pollInterval = Math.min(this.pollInterval * 1.5, this.maxPollInterval);
    }
  }

  /**
   * Handle connection failure
   */
  private handleConnectionFailure(): void {
    this.log("Connection attempt failed");

    // Update state
    this.isConnected = false;
    this.isConnecting = false;

    // Notify connection handler
    this.connectionHandler("long-polling", "disconnected");

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
      this.log("Max reconnect attempts reached, giving up");
      return;
    }

    const delay = Math.min(
      this.initialReconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds
    );

    this.log(
      `Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`
    );

    // Clear any existing timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Schedule reconnect
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Generate client ID
   */
  private generateClientId(): string {
    // Use UUID if available
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }

    // Fallback to simple random string
    return `lp-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Log message if debug mode is enabled
   */
  private log(message: string, ...args: any[]): void {
    if (this.debugMode) {
      console.log(`[LongPollingClient] ${message}`, ...args);
    }
  }
}
