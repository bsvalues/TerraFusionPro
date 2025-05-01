/**
 * Long-Polling Handler
 * Final fallback mechanism for real-time updates when both WebSockets and SSE fail
 * This approach has higher latency but works in virtually all environments
 */
export class LongPollingHandler {
  private url: string;
  private pollingInterval = 3000; // Default polling interval in ms
  private listeners: Map<string, Function[]> = new Map();
  private isPolling = false;
  private pollingTimeoutId: number | null = null;
  private connectionState: 'polling' | 'idle' | 'error' = 'idle';
  private lastMessageId: string | null = null;
  private jitter = 500; // Add random jitter to prevent thundering herd
  
  constructor(endpoint = '/api/poll') {
    // Build polling URL using current host
    const protocol = window.location.protocol;
    const host = window.location.host;
    this.url = `${protocol}//${host}${endpoint}`;
    console.log(`Long-polling URL: ${this.url}`);
  }
  
  /**
   * Start long-polling the server
   */
  startPolling(interval?: number) {
    if (interval !== undefined) {
      this.pollingInterval = interval;
    }
    
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.connectionState = 'polling';
    this.emit('connection', { status: 'polling' });
    console.log(`Starting long-polling with interval: ${this.pollingInterval}ms`);
    
    // Execute the first poll immediately
    this.poll();
  }
  
  /**
   * Stop long-polling
   */
  stopPolling() {
    this.isPolling = false;
    this.connectionState = 'idle';
    
    if (this.pollingTimeoutId !== null) {
      window.clearTimeout(this.pollingTimeoutId);
      this.pollingTimeoutId = null;
    }
    
    this.emit('connection', { status: 'idle' });
    console.log('Long-polling stopped');
  }
  
  /**
   * Execute a single polling request
   */
  private async poll() {
    if (!this.isPolling) return;
    
    try {
      // Add the last message ID as a query parameter if available
      let endpoint = this.url;
      if (this.lastMessageId) {
        const separator = endpoint.includes('?') ? '&' : '?';
        endpoint = `${endpoint}${separator}lastId=${this.lastMessageId}`;
      }
      
      // Make the request
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Process received data
        if (data && Array.isArray(data.messages)) {
          // Extract the last message ID for future polling
          if (data.messages.length > 0) {
            const lastMessage = data.messages[data.messages.length - 1];
            if (lastMessage.id) {
              this.lastMessageId = lastMessage.id;
            }
            
            // Process all messages
            data.messages.forEach((message: any) => {
              this.emit('message', message);
              
              // Emit specific event if type exists
              if (message.type) {
                this.emit(message.type, message);
              }
            });
          }
        }
        
        // Handle any control messages
        if (data && data.control) {
          if (data.control.interval) {
            // Server requested a different polling interval
            this.pollingInterval = data.control.interval;
            console.log(`Polling interval updated to ${this.pollingInterval}ms by server`);
          }
        }
      } else {
        console.error(`Long-polling error: ${response.status} ${response.statusText}`);
        this.emit('error', { 
          type: 'http_error', 
          status: response.status, 
          message: response.statusText 
        });
      }
    } catch (error) {
      console.error('Long-polling error:', error);
      this.emit('error', { type: 'poll_error', error });
    }
    
    // Schedule the next poll with jitter
    if (this.isPolling) {
      const jitterAmount = Math.floor(Math.random() * this.jitter * 2) - this.jitter;
      const nextPollDelay = Math.max(100, this.pollingInterval + jitterAmount);
      
      this.pollingTimeoutId = window.setTimeout(() => {
        this.poll();
      }, nextPollDelay);
    }
  }
  
  /**
   * Send data to the server (separate API call for sending)
   */
  async send(data: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.url}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.success === true;
      } else {
        console.error(`Error sending data: ${response.status} ${response.statusText}`);
        this.emit('error', { 
          type: 'send_error', 
          status: response.status, 
          message: response.statusText,
          data
        });
        return false;
      }
    } catch (error) {
      console.error('Error sending data:', error);
      this.emit('error', { type: 'send_error', error, data });
      return false;
    }
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
          console.error(`Error in long-polling ${event} listener:`, e);
        }
      });
    }
  }
}

// Create singleton instance
export const longPollingHandler = new LongPollingHandler();