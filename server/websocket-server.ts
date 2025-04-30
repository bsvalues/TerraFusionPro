import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

// Define client interface
interface ClientInfo {
  id: string;
  isAlive: boolean;
  lastActivity: number;
  sessionStartTime: number;
  ipAddress?: string;
  userAgent?: string;
  userId?: number;
}

export function setupWebSocketServer(httpServer: Server) {
  // Log the server configuration for debugging
  console.log(`[WebSocket] Setting up WebSocket server on path /ws`);
  
  // Configure server timeouts to prevent abrupt disconnects
  httpServer.keepAliveTimeout = 65000; // 65 seconds (higher than default 60s)
  httpServer.headersTimeout = 66000; // 66 seconds (slightly higher than keepAliveTimeout)
  
  // Log HTTP server configuration
  console.log(`[WebSocket] HTTP Server timeouts configured: keepAliveTimeout=${httpServer.keepAliveTimeout}ms, headersTimeout=${httpServer.headersTimeout}ms`);
  
  // Create a WebSocket server with bare minimum configuration
  // Many WebSocket errors arise from overly complex configurations
  // We're stripping this down to the absolute basics for maximum compatibility
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });
  
  // Track clients with additional metadata
  const clients = new Map<WebSocket, ClientInfo>();
  
  // Set up server-side heartbeat check interval
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = clients.get(ws);
      
      if (!client) {
        return ws.terminate();
      }
      
      // Check if client hasn't responded to ping
      if (!client.isAlive) {
        console.log(`Terminating inactive client: ${client.id}`);
        clients.delete(ws);
        return ws.terminate();
      }
      
      // Mark as inactive until we receive a pong
      client.isAlive = false;
      clients.set(ws, client);
      
      // Send ping
      try {
        ws.ping();
      } catch (e) {
        console.error(`Error sending ping to client ${client.id}:`, e);
        ws.terminate();
      }
    });
  }, 30000);
  
  // Clean up interval when server closes
  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });
  
  // Handle new connections
  wss.on('connection', (ws, req) => {
    // Generate client ID and set up metadata
    const clientId = Math.random().toString(36).substring(2, 15);
    const ipAddress = req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Initialize client info
    const clientInfo: ClientInfo = {
      id: clientId,
      isAlive: true,
      lastActivity: Date.now(),
      sessionStartTime: Date.now(),
      ipAddress,
      userAgent
    };
    
    clients.set(ws, clientInfo);
    console.log(`WebSocket client connected: ${clientId} from ${ipAddress}`);
    
    // Send welcome message
    sendToClient(ws, {
      type: 'connection',
      status: 'connected',
      clientId,
      serverTime: new Date().toISOString()
    });
    
    // Handle pong messages (response to ping)
    ws.on('pong', () => {
      const client = clients.get(ws);
      if (client) {
        client.isAlive = true;
        client.lastActivity = Date.now();
        clients.set(ws, client);
      }
    });
    
    // Handle messages
    ws.on('message', (message) => {
      try {
        // Update last activity time
        const client = clients.get(ws);
        if (client) {
          client.lastActivity = Date.now();
          clients.set(ws, client);
        }
        
        const data = JSON.parse(message.toString());
        console.log(`Message from ${clientId}:`, data);
        
        // Handle message types
        switch (data.type) {
          case 'heartbeat':
            // Handle heartbeat ping message
            if (data.action === 'ping') {
              // Respond with pong to keep connection alive
              sendToClient(ws, {
                type: 'heartbeat',
                action: 'pong',
                timestamp: data.timestamp, // Echo back the client's timestamp for latency calculation
                serverTime: Date.now()
              });
            }
            break;
          
          case 'ping':
            // Client-initiated ping, respond with pong
            sendToClient(ws, {
              type: 'pong',
              timestamp: Date.now(),
              serverTime: new Date().toISOString()
            });
            break;
            
          case 'echo':
            sendToClient(ws, {
              type: 'echo',
              message: data.message,
              timestamp: Date.now(),
              serverTime: new Date().toISOString()
            });
            break;
            
          case 'broadcast':
            broadcastMessage(data, ws);
            break;
            
          case 'register_user':
            // Associate this connection with a user ID
            if (data.userId && typeof data.userId === 'number') {
              const client = clients.get(ws);
              if (client) {
                client.userId = data.userId;
                clients.set(ws, client);
                console.log(`Associated client ${clientId} with user ID ${data.userId}`);
                
                sendToClient(ws, {
                  type: 'registration_success',
                  userId: data.userId,
                  timestamp: Date.now()
                });
              }
            }
            break;
            
          // Handle resource requests (for comps, properties, etc.)
          case 'resource_request':
            handleResourceRequest(data, ws);
            break;
            
          // Handle resource updates
          case 'resource_update':
            handleResourceUpdate(data, ws);
            break;
            
          default:
            // Log unknown message type
            console.log(`Received unknown message type: ${data.type}`);
            break;
        }
      } catch (e) {
        console.error('Error handling WebSocket message:', e);
        sendToClient(ws, {
          type: 'error',
          message: 'Failed to process message',
          details: e instanceof Error ? e.message : 'Unknown error'
        });
      }
    });
    
    // Handle close
    ws.on('close', (code, reason) => {
      const client = clients.get(ws);
      if (client) {
        const sessionDuration = Math.round((Date.now() - client.sessionStartTime) / 1000);
        console.log(
          `WebSocket client disconnected: ${clientId}, ` +
          `Code: ${code}, Reason: ${reason || 'No reason provided'}, ` +
          `Session duration: ${sessionDuration} seconds`
        );
        clients.delete(ws);
      }
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      
      try {
        sendToClient(ws, {
          type: 'error',
          message: 'Connection error occurred',
          details: error.message
        });
      } catch (e) {
        // Unable to send error message, connection might be already closed
        console.error(`Failed to send error message to client ${clientId}:`, e);
      }
    });
  });
  
  // Helper to safely send messages to clients
  function sendToClient(ws: WebSocket, data: any): boolean {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
        return true;
      } catch (e) {
        console.error('Error sending message to client:', e);
        return false;
      }
    }
    return false;
  }
  
  // Broadcast message to all connected clients except sender
  function broadcastMessage(data: any, sender?: WebSocket) {
    wss.clients.forEach((client) => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        sendToClient(client, data);
      }
    });
  }
  
  // Broadcast to specific users by userId
  function broadcastToUsers(data: any, userIds: number[]) {
    const targetUsers = new Set(userIds);
    
    wss.clients.forEach((client) => {
      const clientInfo = clients.get(client);
      if (
        client.readyState === WebSocket.OPEN &&
        clientInfo?.userId &&
        targetUsers.has(clientInfo.userId)
      ) {
        sendToClient(client, data);
      }
    });
  }
  
  // Handle resource requests
  async function handleResourceRequest(data: any, ws: WebSocket) {
    try {
      // Example resource handling
      switch (data.resource) {
        case 'properties':
          // Fetch properties from database and send back
          const properties = await fetchProperties();
          sendToClient(ws, {
            type: 'resource_update',
            requestId: data.requestId, // Echo back request ID if provided
            resource: 'properties',
            data: properties
          });
          break;
          
        case 'comps':
          // Fetch comparable properties
          const comps = await fetchComps(data.params);
          sendToClient(ws, {
            type: 'resource_update',
            requestId: data.requestId,
            resource: 'comps',
            data: comps
          });
          break;
          
        case 'connection_stats':
          // Return connection statistics
          const stats = getConnectionStats();
          sendToClient(ws, {
            type: 'resource_update',
            requestId: data.requestId,
            resource: 'connection_stats',
            data: stats
          });
          break;
          
        default:
          sendToClient(ws, {
            type: 'resource_error',
            requestId: data.requestId,
            resource: data.resource,
            message: `Unknown resource type: ${data.resource}`
          });
      }
    } catch (error) {
      sendToClient(ws, {
        type: 'resource_error',
        requestId: data.requestId,
        resource: data.resource,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Handle resource updates
  async function handleResourceUpdate(data: any, ws: WebSocket) {
    try {
      // Example update handling
      switch (data.resource) {
        case 'properties':
          // Update property in database
          const updatedProperty = await updateProperty(data.updates);
          
          // Acknowledge update to sender
          sendToClient(ws, {
            type: 'update_success',
            requestId: data.requestId,
            resource: 'properties',
            data: { updated: updatedProperty }
          });
          
          // Broadcast update to all clients except sender
          broadcastMessage({
            type: 'resource_update',
            resource: 'properties',
            data: { updated: updatedProperty }
          }, ws);
          break;
          
        default:
          sendToClient(ws, {
            type: 'resource_error',
            requestId: data.requestId,
            resource: data.resource,
            message: `Unknown resource type: ${data.resource}`
          });
      }
    } catch (error) {
      sendToClient(ws, {
        type: 'resource_error',
        requestId: data.requestId,
        resource: data.resource,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Get connection statistics
  function getConnectionStats() {
    const now = Date.now();
    const clientsArray = Array.from(clients.values());
    
    const stats = {
      totalConnections: wss.clients.size,
      activeUsers: new Set(clientsArray.filter(c => c.userId).map(c => c.userId as number)).size,
      connectionsByUserAgent: {} as Record<string, number>,
      averageSessionDuration: 0
    };
    
    // Calculate average session duration and count by user agent
    let totalDuration = 0;
    const count = clientsArray.length;
    
    // Use the array of clients instead of Map iterator
    for (const client of clientsArray) {
      const duration = now - client.sessionStartTime;
      totalDuration += duration;
      
      // Count by user agent
      const userAgent = client.userAgent || 'unknown';
      const shortUserAgent = userAgent.includes('/')
        ? userAgent.split('/')[0]
        : userAgent;
        
      stats.connectionsByUserAgent[shortUserAgent] = 
        (stats.connectionsByUserAgent[shortUserAgent] || 0) + 1;
    }
    
    stats.averageSessionDuration = count > 0
      ? Math.round(totalDuration / count / 1000) // in seconds
      : 0;
      
    return stats;
  }
  
  // Mock function to fetch properties - would be replaced with actual DB queries
  async function fetchProperties() {
    // This would be a database query in production
    return [
      { id: 1, address: '123 Main St', city: 'Austin', state: 'TX' },
      { id: 2, address: '456 Oak Ave', city: 'Dallas', state: 'TX' },
    ];
  }
  
  // Mock function to fetch comparable properties - would be replaced with actual DB queries
  async function fetchComps(params: any) {
    // This would be a database query in production
    return [
      { id: 1, address: '123 Main St', city: 'Austin', state: 'TX', price: 450000 },
      { id: 2, address: '456 Oak Ave', city: 'Dallas', state: 'TX', price: 425000 },
    ];
  }
  
  // Mock function to update a property - would be replaced with actual DB queries
  async function updateProperty(updates: any) {
    // This would update the database in production
    return { ...updates, updatedAt: new Date().toISOString() };
  }
  
  // Return public interface
  return {
    broadcastToAll: (data: any) => {
      broadcastMessage(data);
    },
    broadcastToUsers: (data: any, userIds: number[]) => {
      broadcastToUsers(data, userIds);
    },
    getConnectionCount: () => {
      return wss.clients.size;
    },
    getActiveUserCount: () => {
      const clientsArray = Array.from(clients.values());
      return new Set(clientsArray.filter(c => c.userId).map(c => c.userId as number)).size;
    },
    getConnectionStats: () => {
      return getConnectionStats();
    }
  };
}