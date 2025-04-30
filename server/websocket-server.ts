import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export function setupWebSocketServer(httpServer: Server) {
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });
  
  const clients = new Map<WebSocket, { id: string }>();
  
  wss.on('connection', (ws) => {
    const clientId = Math.random().toString(36).substring(2, 15);
    clients.set(ws, { id: clientId });
    
    console.log(`WebSocket client connected: ${clientId}`);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      status: 'connected',
      clientId
    }));
    
    // Set up heartbeat
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);
    
    ws.on('pong', () => {
      // Client is still alive
    });
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`Message from ${clientId}:`, data);
        
        // Handle message types
        switch (data.type) {
          case 'echo':
            ws.send(JSON.stringify({
              type: 'echo',
              message: data.message,
              timestamp: new Date().toISOString()
            }));
            break;
            
          case 'broadcast':
            broadcastMessage(data, ws);
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
            // Custom message handlers can be added here
            break;
        }
      } catch (e) {
        console.error('Error handling WebSocket message:', e);
      }
    });
    
    ws.on('close', (code, reason) => {
      console.log(`WebSocket client disconnected: ${clientId}, Code: ${code}, Reason: ${reason}`);
      clearInterval(pingInterval);
      clients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
    });
  });
  
  // Broadcast message to all connected clients except sender
  function broadcastMessage(data: any, sender?: WebSocket) {
    wss.clients.forEach((client) => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
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
          ws.send(JSON.stringify({
            type: 'resource_update',
            resource: 'properties',
            data: properties
          }));
          break;
          
        case 'comps':
          // Fetch comparable properties
          const comps = await fetchComps(data.params);
          ws.send(JSON.stringify({
            type: 'resource_update',
            resource: 'comps',
            data: comps
          }));
          break;
          
        default:
          ws.send(JSON.stringify({
            type: 'resource_error',
            resource: data.resource,
            message: `Unknown resource type: ${data.resource}`
          }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'resource_error',
        resource: data.resource,
        message: error instanceof Error ? error.message : 'Unknown error'
      }));
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
          
          // Broadcast update to all clients
          broadcastMessage({
            type: 'resource_update',
            resource: 'properties',
            data: { updated: updatedProperty }
          });
          break;
          
        default:
          ws.send(JSON.stringify({
            type: 'resource_error',
            resource: data.resource,
            message: `Unknown resource type: ${data.resource}`
          }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'resource_error',
        resource: data.resource,
        message: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
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
  
  return {
    broadcastToAll: (data: any) => {
      broadcastMessage(data);
    },
    getConnectionCount: () => {
      return wss.clients.size;
    }
  };
}