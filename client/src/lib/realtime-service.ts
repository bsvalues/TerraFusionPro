/**
 * Realtime Service
 * Manages connections across multiple protocols (WebSocket, SSE, Long-Polling)
 * and gracefully downgrades to the most compatible protocol
 */

import { websocketManager } from './websocket-manager';
import { sseHandler } from './sse-handler';
import { longPollingHandler } from './long-polling';

type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error' | 'polling';
type ConnectionProtocol = 'websocket' | 'sse' | 'long-polling' | 'none';

export class RealtimeService {
  private listeners: Map<string, Function[]> = new Map();
  private currentProtocol: ConnectionProtocol = 'none';
  private preferredProtocol: ConnectionProtocol = 'websocket';
  private fallbackEnabled = true;
  private connectionState: ConnectionState = 'disconnected';
  private fallbackTimeoutId: number | null = null;
  private fallbackAttempts = 0;
  private maxFallbackAttempts = 2;
  
  constructor() {
    console.log('[RealtimeService] Initialized with WebSocket preferred, polling fallback');
    
    // Set up event listeners for WebSocket
    websocketManager.on('connection', this.handleWebSocketConnection.bind(this));
    websocketManager.on('error', this.handleWebSocketError.bind(this));
    websocketManager.on('message', this.handleWebSocketMessage.bind(this));
    
    // Set up event listeners for SSE
    sseHandler.on('connection', this.handleSSEConnection.bind(this));
    sseHandler.on('error', this.handleSSEError.bind(this));
    sseHandler.on('message', this.handleSSEMessage.bind(this));
    
    // Set up event listeners for Long-Polling
    longPollingHandler.on('connection', this.handlePollingConnection.bind(this));
    longPollingHandler.on('error', this.handlePollingError.bind(this));
    longPollingHandler.on('message', this.handlePollingMessage.bind(this));
  }
  
  /**
   * Set the preferred connection protocol
   */
  setPreferredProtocol(protocol: ConnectionProtocol) {
    this.preferredProtocol = protocol;
  }
  
  /**
   * Enable or disable automatic fallback
   */
  setFallbackEnabled(enabled: boolean) {
    this.fallbackEnabled = enabled;
  }
  
  /**
   * Start connection attempts with the preferred protocol
   */
  connect() {
    this.disconnectAll(); // Ensure clean state
    this.fallbackAttempts = 0;
    
    // Start with preferred protocol
    this.connectWithProtocol(this.preferredProtocol);
  }
  
  /**
   * Attempt connection with a specific protocol
   */
  private connectWithProtocol(protocol: ConnectionProtocol) {
    this.currentProtocol = protocol;
    console.log(`[RealtimeService] Connecting with ${protocol} protocol`);
    
    switch (protocol) {
      case 'websocket':
        websocketManager.connect();
        break;
      case 'sse':
        sseHandler.connect();
        break;
      case 'long-polling':
        longPollingHandler.startPolling();
        break;
      default:
        console.error(`[RealtimeService] Unknown protocol: ${protocol}`);
        this.setConnectionState('error');
    }
    
    this.emit('protocol_change', { protocol });
  }
  
  /**
   * Try next fallback protocol
   */
  private tryFallback() {
    if (!this.fallbackEnabled) return;
    
    this.fallbackAttempts++;
    if (this.fallbackAttempts > this.maxFallbackAttempts) {
      console.error('[RealtimeService] All fallback attempts failed');
      this.setConnectionState('error');
      this.emit('connection', { 
        status: 'error', 
        message: 'All connection methods failed' 
      });
      return;
    }
    
    // Clear any pending fallback timeout
    if (this.fallbackTimeoutId !== null) {
      window.clearTimeout(this.fallbackTimeoutId);
      this.fallbackTimeoutId = null;
    }
    
    const nextProtocol = this.getNextProtocol();
    console.log(`[RealtimeService] Falling back to ${nextProtocol} protocol`);
    this.connectWithProtocol(nextProtocol);
  }
  
  /**
   * Get the next protocol in the fallback chain
   */
  private getNextProtocol(): ConnectionProtocol {
    if (this.currentProtocol === 'websocket') return 'sse';
    if (this.currentProtocol === 'sse') return 'long-polling';
    return 'long-polling'; // Default to long-polling if we're already at the end
  }
  
  /**
   * Disconnect all transport methods
   */
  disconnectAll() {
    websocketManager.disconnect();
    sseHandler.disconnect();
    longPollingHandler.stopPolling();
    
    this.currentProtocol = 'none';
    this.setConnectionState('disconnected');
  }
  
  /**
   * Send data via the currently active protocol
   */
  send(data: any): boolean {
    switch (this.currentProtocol) {
      case 'websocket':
        return websocketManager.send(data);
      case 'sse':
        console.warn('[RealtimeService] SSE does not support sending data from client to server');
        return false;
      case 'long-polling':
        // Long polling send is asynchronous, but we'll start the request
        longPollingHandler.send(data);
        return true;
      default:
        console.error('[RealtimeService] No active protocol to send data');
        return false;
    }
  }
  
  /**
   * Set and update connection state
   */
  private setConnectionState(state: ConnectionState) {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.emit('connection', { status: state });
    }
  }
  
  /**
   * Handle WebSocket connection events
   */
  private handleWebSocketConnection(data: any) {
    if (this.currentProtocol !== 'websocket') return;
    
    if (data.status === 'connected') {
      this.setConnectionState('connected');
      console.log('[RealtimeService] WebSocket connection established');
    } else if (data.status === 'connecting') {
      this.setConnectionState('connecting');
    } else if (data.status === 'disconnected') {
      this.setConnectionState('disconnected');
    } else if (data.status === 'error') {
      // When WebSocket throws an error, let's try falling back
      if (this.fallbackEnabled && this.currentProtocol === 'websocket') {
        console.log('[RealtimeService] WebSocket connection failed, will try fallback');
        // Add a small delay before trying fallback to prevent thrashing
        this.fallbackTimeoutId = window.setTimeout(() => {
          this.tryFallback();
        }, 1000);
      } else {
        this.setConnectionState('error');
      }
    }
  }
  
  /**
   * Handle WebSocket error events
   */
  private handleWebSocketError(error: any) {
    if (this.currentProtocol !== 'websocket') return;
    
    console.error('[RealtimeService] WebSocket error:', error);
    this.emit('error', { 
      protocol: 'websocket',
      ...error
    });
  }
  
  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(data: any) {
    if (this.currentProtocol !== 'websocket') return;
    
    // Re-emit the message to our listeners
    this.emit('message', {
      protocol: 'websocket',
      data
    });
    
    // Also emit the specific event type if it exists
    if (data.type) {
      this.emit(data.type, {
        protocol: 'websocket',
        data
      });
    }
  }
  
  /**
   * Handle SSE connection events
   */
  private handleSSEConnection(data: any) {
    if (this.currentProtocol !== 'sse') return;
    
    if (data.status === 'connected') {
      this.setConnectionState('connected');
      console.log('[RealtimeService] SSE connection established');
    } else if (data.status === 'connecting') {
      this.setConnectionState('connecting');
    } else if (data.status === 'disconnected') {
      this.setConnectionState('disconnected');
    } else if (data.status === 'error') {
      // When SSE throws an error, try falling back
      if (this.fallbackEnabled && this.currentProtocol === 'sse') {
        console.log('[RealtimeService] SSE connection failed, will try fallback');
        this.fallbackTimeoutId = window.setTimeout(() => {
          this.tryFallback();
        }, 1000);
      } else {
        this.setConnectionState('error');
      }
    }
  }
  
  /**
   * Handle SSE error events
   */
  private handleSSEError(error: any) {
    if (this.currentProtocol !== 'sse') return;
    
    console.error('[RealtimeService] SSE error:', error);
    this.emit('error', { 
      protocol: 'sse',
      ...error
    });
  }
  
  /**
   * Handle SSE messages
   */
  private handleSSEMessage(data: any) {
    if (this.currentProtocol !== 'sse') return;
    
    // Re-emit the message to our listeners
    this.emit('message', {
      protocol: 'sse',
      data
    });
    
    // Also emit the specific event type if it exists
    if (data.type) {
      this.emit(data.type, {
        protocol: 'sse',
        data
      });
    }
  }
  
  /**
   * Handle Long-Polling connection events
   */
  private handlePollingConnection(data: any) {
    if (this.currentProtocol !== 'long-polling') return;
    
    if (data.status === 'polling') {
      this.setConnectionState('polling');
      console.log('[RealtimeService] Long-polling active');
    } else if (data.status === 'idle') {
      this.setConnectionState('disconnected');
    } else if (data.status === 'error') {
      this.setConnectionState('error');
    }
  }
  
  /**
   * Handle Long-Polling error events
   */
  private handlePollingError(error: any) {
    if (this.currentProtocol !== 'long-polling') return;
    
    console.error('[RealtimeService] Long-polling error:', error);
    this.emit('error', { 
      protocol: 'long-polling',
      ...error
    });
  }
  
  /**
   * Handle Long-Polling messages
   */
  private handlePollingMessage(data: any) {
    if (this.currentProtocol !== 'long-polling') return;
    
    // Re-emit the message to our listeners
    this.emit('message', {
      protocol: 'long-polling',
      data
    });
    
    // Also emit the specific event type if it exists
    if (data.type) {
      this.emit(data.type, {
        protocol: 'long-polling',
        data
      });
    }
  }
  
  /**
   * Get the current connection state
   */
  getState(): ConnectionState {
    return this.connectionState;
  }
  
  /**
   * Get the current protocol being used
   */
  getProtocol(): ConnectionProtocol {
    return this.currentProtocol;
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
          console.error(`[RealtimeService] Error in ${event} listener:`, e);
        }
      });
    }
  }
}

// Create singleton instance
export const realtimeService = new RealtimeService();