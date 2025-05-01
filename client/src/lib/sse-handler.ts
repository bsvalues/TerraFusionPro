/**
 * Server-Sent Events (SSE) Handler
 * Provides a fallback mechanism for receiving real-time updates when WebSockets fail
 * Note: SSE is one-way communication (server to client only)
 */
export class SSEHandler {
  private eventSource: EventSource | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectTimeoutId: number | null = null;
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private lastEventId: string | null = null;

  constructor(endpoint = '/sse') {
    // Build SSE URL using current host
    const protocol = window.location.protocol;
    const host = window.location.host;
    this.url = `${protocol}//${host}${endpoint}`;
    console.log(`SSE URL: ${this.url}`);
  }

  /**
   * Connect to the SSE endpoint
   */
  connect() {
    // Clear any existing reconnect timeout
    if (this.reconnectTimeoutId !== null) {
      window.clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.eventSource) {
      // Close existing connection before creating a new one
      this.disconnect();
    }

    try {
      this.connectionState = 'connecting';
      this.emit('connection', { status: 'connecting' });

      // Append last event ID if available for resumed connection
      let url = this.url;
      if (this.lastEventId) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}lastEventId=${this.lastEventId}`;
      }

      // Create new EventSource connection
      this.eventSource = new EventSource(url);

      // Handle connection open
      this.eventSource.onopen = () => {
        console.log('SSE connection established');
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        this.emit('connection', { status: 'connected' });
      };

      // Handle messages
      this.eventSource.onmessage = (event) => {
        try {
          // Store the last event ID for reconnection
          if (event.lastEventId) {
            this.lastEventId = event.lastEventId;
          }

          // Parse and process the data
          const data = JSON.parse(event.data);
          
          // Emit message to listeners
          this.emit('message', data);
          
          // Emit specific event type if available
          if (data.type) {
            this.emit(data.type, data);
          }
        } catch (e) {
          console.error('Error processing SSE message:', e);
          this.emit('error', { 
            type: 'parse_error', 
            error: e,
            rawData: event.data 
          });
        }
      };

      // Handle specific events with their own channels
      this.eventSource.addEventListener('heartbeat', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('heartbeat', data);
        } catch (e) {
          console.error('Error processing heartbeat event:', e);
        }
      });

      // Error handling
      this.eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        this.connectionState = 'error';
        this.emit('error', error);

        // Check if connection is closed and attempt to reconnect
        if (this.eventSource && this.eventSource.readyState === EventSource.CLOSED) {
          this.reconnect();
        }
      };
    } catch (error) {
      console.error('Error creating SSE connection:', error);
      this.connectionState = 'error';
      this.emit('error', { type: 'connection_error', error });
      this.reconnect();
    }
  }

  /**
   * Attempt to reconnect to the SSE endpoint
   */
  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * this.reconnectAttempts, 10000); // Linear backoff with max 10s delay
      
      console.log(`SSE connection lost. Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
      
      this.reconnectTimeoutId = window.setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Maximum SSE reconnection attempts reached');
      this.connectionState = 'error';
      this.emit('connection', { 
        status: 'error', 
        message: 'Maximum reconnection attempts reached' 
      });
    }
  }

  /**
   * Disconnect from the SSE endpoint
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.reconnectTimeoutId !== null) {
      window.clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    this.connectionState = 'disconnected';
    this.emit('connection', { status: 'disconnected' });
  }

  /**
   * Get the current connection state
   */
  getState() {
    return this.connectionState;
  }

  /**
   * Register an event listener
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
    return this;
  }

  /**
   * Register a one-time event listener
   */
  once(event: string, callback: Function) {
    const onceWrapper = (data: any) => {
      this.off(event, onceWrapper);
      callback(data);
    };
    this.on(event, onceWrapper);
    return this;
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
    return this;
  }

  /**
   * Emit an event to registered listeners
   */
  private emit(event: string, data: any) {
    if (this.listeners.has(event)) {
      const callbacks = [...this.listeners.get(event) || []];
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`Error in SSE ${event} listener:`, e);
        }
      });
    }
  }
}

// Create singleton instance
export const sseHandler = new SSEHandler();