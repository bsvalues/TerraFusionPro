/**
 * RealtimeService
 * Manages real-time connections with automatic protocol switching:
 * WebSocket → SSE → Long Polling
 * 
 * Provides a unified interface for real-time communication
 * regardless of the underlying protocol
 */

import { WebSocketManager } from './websocket-manager';
import { SSEHandler } from './sse-handler';
import { LongPollingClient } from './long-polling';

// Connection protocols
type Protocol = 'websocket' | 'sse' | 'long-polling' | 'none';

// Connection states
type ConnectionState = 'connected' | 'connecting' | 'disconnected';

// Event handler type
type EventHandler = (data: any) => void;

// Main RealtimeService class
class RealtimeService {
  // Connection managers
  private webSocketManager: WebSocketManager;
  private sseHandler: SSEHandler;
  private longPollingClient: LongPollingClient;
  
  // Protocol and state
  private activeProtocol: Protocol = 'none';
  private connectionState: ConnectionState = 'disconnected';
  
  // Connection attempts
  private connectionAttempts = 0;
  private maxConnectionAttempts = 3;
  
  // Event handlers
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  
  // Debug mode
  private debugMode = true;
  
  // Singleton instance
  private static instance: RealtimeService;
  
  /**
   * Get singleton instance
   */
  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize connection managers with default endpoints
    this.webSocketManager = new WebSocketManager(
      '/ws',
      this.handleMessage.bind(this),
      this.handleConnectionChange.bind(this)
    );
    
    this.sseHandler = new SSEHandler(
      '/sse',
      this.handleMessage.bind(this),
      this.handleConnectionChange.bind(this)
    );
    
    this.longPollingClient = new LongPollingClient(
      '/api/poll',
      this.handleMessage.bind(this),
      this.handleConnectionChange.bind(this)
    );
    
    this.log('RealtimeService initialized');
  }
  
  /**
   * Connect to the real-time service using the best available protocol
   */
  public async connect(): Promise<boolean> {
    if (this.connectionState === 'connected') {
      return true;
    }
    
    if (this.connectionState === 'connecting') {
      this.log('Already connecting, please wait...');
      return false;
    }
    
    this.connectionState = 'connecting';
    this.emit('connecting', { protocol: 'none' });
    
    // First try WebSocket
    this.log('Trying WebSocket connection...');
    const wsConnected = await this.webSocketManager.connect();
    
    if (wsConnected) {
      this.log('WebSocket connection successful');
      this.activeProtocol = 'websocket';
      return true;
    }
    
    // If WebSocket fails, try SSE
    this.log('WebSocket connection failed, trying SSE...');
    const sseConnected = await this.sseHandler.connect();
    
    if (sseConnected) {
      this.log('SSE connection successful');
      this.activeProtocol = 'sse';
      return true;
    }
    
    // If SSE fails, try Long Polling
    this.log('SSE connection failed, trying Long Polling...');
    const lpConnected = await this.longPollingClient.connect();
    
    if (lpConnected) {
      this.log('Long Polling connection successful');
      this.activeProtocol = 'long-polling';
      return true;
    }
    
    // All connection attempts failed
    this.log('All connection attempts failed');
    this.connectionState = 'disconnected';
    this.activeProtocol = 'none';
    this.emit('connection_failed', { attempts: this.connectionAttempts });
    
    return false;
  }
  
  /**
   * Disconnect from all protocols
   */
  public disconnectAll(): void {
    this.log('Disconnecting from all protocols');
    
    // Disconnect from all protocols
    this.webSocketManager.disconnect();
    this.sseHandler.disconnect();
    this.longPollingClient.disconnect();
    
    // Update state
    this.connectionState = 'disconnected';
    this.activeProtocol = 'none';
  }
  
  /**
   * Send a message using the active protocol
   * @param data Message data to send
   * @returns true if sent successfully, false otherwise
   */
  public send(data: any): boolean {
    if (this.connectionState !== 'connected') {
      this.log('Cannot send message, not connected');
      return false;
    }
    
    switch (this.activeProtocol) {
      case 'websocket':
        return this.webSocketManager.send(data);
        
      case 'sse':
        // SSE requires async send, but we'll handle it synchronously for consistent API
        this.sseHandler.send(data).catch(err => {
          console.error('[RealtimeService] Error sending SSE message:', err);
        });
        return true;
        
      case 'long-polling':
        // Long polling requires async send, but we'll handle it synchronously for consistent API
        this.longPollingClient.send(data).catch(err => {
          console.error('[RealtimeService] Error sending long polling message:', err);
        });
        return true;
        
      default:
        this.log('Cannot send message, no active protocol');
        return false;
    }
  }
  
  /**
   * Register an event handler
   * @param event Event name
   * @param handler Event handler function
   */
  public on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    this.eventHandlers.get(event)?.add(handler);
  }
  
  /**
   * Unregister an event handler
   * @param event Event name
   * @param handler Event handler function
   */
  public off(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      return;
    }
    
    this.eventHandlers.get(event)?.delete(handler);
  }
  
  /**
   * Emit an event to registered handlers
   * @param event Event name
   * @param data Event data
   */
  private emit(event: string, data: any): void {
    if (!this.eventHandlers.has(event)) {
      return;
    }
    
    for (const handler of this.eventHandlers.get(event) || []) {
      try {
        handler(data);
      } catch (err) {
        console.error(`[RealtimeService] Error in event handler for '${event}':`, err);
      }
    }
  }
  
  /**
   * Handle incoming message from any protocol
   * @param message Message data
   */
  private handleMessage(message: any): void {
    // Log message type
    this.log(`Received message type '${message.type}'`);
    
    // Handle specific message types
    switch (message.type) {
      case 'property_analysis_response':
        this.emit('property_analysis_response', message);
        break;
        
      case 'resource_updated':
        this.emit('resource_updated', message);
        break;
        
      case 'error':
        this.emit('error', message);
        break;
        
      case 'connection_established':
        this.emit('connected', { protocol: this.activeProtocol });
        break;
        
      default:
        // For any other message type, emit with the message type as event name
        this.emit(message.type, message);
    }
  }
  
  /**
   * Handle connection state changes from any protocol
   * @param protocol Protocol name
   * @param state Connection state
   */
  private handleConnectionChange(protocol: string, state: string): void {
    this.log(`Connection change: ${protocol} ${state}`);
    
    // Only react to the active protocol's state changes
    if (protocol !== this.activeProtocol && this.activeProtocol !== 'none') {
      return;
    }
    
    if (state === 'connected') {
      this.connectionState = 'connected';
      this.activeProtocol = protocol as Protocol;
      this.connectionAttempts = 0;
      this.emit('connected', { protocol });
    } 
    else if (state === 'disconnected') {
      // If the active protocol disconnected, try another one
      if (protocol === this.activeProtocol) {
        this.connectionState = 'disconnected';
        this.activeProtocol = 'none';
        this.emit('disconnected', { protocol });
        
        // Try reconnecting with a different protocol
        this.connectionAttempts++;
        
        if (this.connectionAttempts < this.maxConnectionAttempts) {
          this.log(`Reconnecting with different protocol, attempt ${this.connectionAttempts}`);
          this.connect();
        } else {
          this.log(`Max reconnection attempts reached (${this.maxConnectionAttempts})`);
        }
      }
    }
  }
  
  /**
   * Get current connection state
   */
  public getState(): ConnectionState {
    return this.connectionState;
  }
  
  /**
   * Get active protocol
   */
  public getProtocol(): Protocol {
    return this.activeProtocol;
  }
  
  /**
   * Log message if debug mode is enabled
   * @param message Message to log
   * @param args Additional arguments
   */
  private log(message: string, ...args: any[]): void {
    if (this.debugMode) {
      console.log(`[RealtimeService] ${message}`, ...args);
    }
  }
}

// Create singleton instance
export const realtimeService = RealtimeService.getInstance();