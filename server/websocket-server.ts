import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

interface Client {
  id: string;
  socket: WebSocket;
  timestamp: number;
}

export class TerraFieldSyncServer {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: HttpServer) {
    // Initialize WebSocket server with a specific path to avoid conflicts with Vite HMR
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws'
    });

    this.setupEventHandlers();
    this.startHeartbeat();

    console.log("[WebSocket] TerraField Sync Server initialized");
  }

  private setupEventHandlers() {
    // Handle new connections
    this.wss.on('connection', (socket, request) => {
      // Generate a unique client ID
      const clientId = request.headers['sec-websocket-key'] || 
                      `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Store the client
      this.clients.set(clientId, {
        id: clientId,
        socket,
        timestamp: Date.now()
      });

      console.log(`[WebSocket] Client connected: ${clientId}`);
      
      // Send initial connection confirmation
      this.sendToClient(clientId, {
        type: 'connection',
        status: 'connected',
        clientId,
        message: 'Connection established with TerraField Sync Server',
        timestamp: Date.now()
      });

      // Broadcast the updated client count
      this.broadcastClientCount();
      
      // Handle messages
      socket.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error(`[WebSocket] Error parsing message from ${clientId}:`, error);
          this.sendToClient(clientId, {
            type: 'error',
            message: 'Invalid message format. Expected JSON.',
            timestamp: Date.now()
          });
        }
      });
      
      // Handle disconnections
      socket.on('close', () => {
        this.clients.delete(clientId);
        console.log(`[WebSocket] Client disconnected: ${clientId}`);
        this.broadcastClientCount();
      });
    });
  }

  private handleMessage(clientId: string, message: any) {
    console.log(`[WebSocket] Message from ${clientId}:`, message);
    
    // Update client's timestamp on any message
    const client = this.clients.get(clientId);
    if (client) {
      client.timestamp = Date.now();
    }
    
    // Handle different message types
    switch(message.type) {
      case 'ping':
        this.sendToClient(clientId, {
          type: 'pong',
          timestamp: Date.now()
        });
        break;
        
      case 'sync_request':
        // Handle sync requests from mobile devices
        this.handleSyncRequest(clientId, message);
        break;
        
      case 'broadcast':
        // Broadcast message to all clients except sender
        this.broadcastMessage(clientId, message.data);
        break;
        
      default:
        // Echo back unhandled message types
        this.sendToClient(clientId, {
          type: 'echo',
          originalMessage: message,
          timestamp: Date.now()
        });
    }
  }

  private handleSyncRequest(clientId: string, message: any) {
    // Simulate sync process
    this.sendToClient(clientId, {
      type: 'sync_status',
      status: 'started',
      message: 'Sync process started',
      timestamp: Date.now()
    });
    
    // Simulate sync progress
    setTimeout(() => {
      this.sendToClient(clientId, {
        type: 'sync_status',
        status: 'in_progress',
        progress: 50,
        message: 'Sync in progress',
        timestamp: Date.now()
      });
    }, 1000);
    
    // Simulate sync completion
    setTimeout(() => {
      this.sendToClient(clientId, {
        type: 'sync_status',
        status: 'completed',
        progress: 100,
        message: 'Sync completed successfully',
        timestamp: Date.now(),
        data: {
          synced_at: new Date().toISOString(),
          items_synced: Math.floor(Math.random() * 20) + 1
        }
      });
    }, 3000);
  }

  private sendToClient(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(data));
    }
  }

  private broadcastMessage(excludeClientId: string | null, data: any) {
    this.clients.forEach((client) => {
      if (
        (!excludeClientId || client.id !== excludeClientId) && 
        client.socket.readyState === WebSocket.OPEN
      ) {
        client.socket.send(JSON.stringify({
          type: 'broadcast',
          data,
          timestamp: Date.now()
        }));
      }
    });
  }

  private broadcastClientCount() {
    const count = this.clients.size;
    this.broadcastMessage(null, {
      type: 'status',
      clientCount: count,
      timestamp: Date.now()
    });
  }

  private startHeartbeat() {
    // Cleanup interval if it already exists
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Check client connections every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      
      // Check for stale connections (inactive for more than 2 minutes)
      this.clients.forEach((client, clientId) => {
        // If client hasn't sent a message in 2 minutes
        if (now - client.timestamp > 2 * 60 * 1000) {
          // Send a ping
          if (client.socket.readyState === WebSocket.OPEN) {
            this.sendToClient(clientId, {
              type: 'ping',
              timestamp: now
            });
          } else {
            // If socket isn't open, remove the client
            this.clients.delete(clientId);
            console.log(`[WebSocket] Removed stale client: ${clientId}`);
          }
        }
      });
      
      // Log active connections
      console.log(`[WebSocket] Active connections: ${this.clients.size}`);
    }, 30000);
  }

  // Clean up resources
  public close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.wss.close();
  }
}