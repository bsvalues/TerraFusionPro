import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';

// Simple storage for connected clients
const clients = new Map<string, WebSocket>();

// Log with timestamp
function logWithTime(message: string) {
  console.log(`[${new Date().toISOString()}] [WebSocket] ${message}`);
}

export function setupBasicWebSocketServer(server: http.Server) {
  logWithTime('Setting up basic WebSocket server');
  
  // Create WebSocket server with noServer option so we can handle upgrade ourselves
  const wss = new WebSocketServer({ 
    noServer: true
  });
  
  // Set up specific handler for basic-ws path
  server.on('upgrade', (request, socket, head) => {
    // Parse URL
    let pathname;
    try {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      pathname = url.pathname;
    } catch {
      // Fallback: extract pathname directly
      pathname = (request.url || '').split('?')[0];
    }
    
    // Only handle /basic-ws path
    if (pathname === '/basic-ws') {
      logWithTime(`Handling upgrade request for ${pathname}`);
      wss.handleUpgrade(request, socket, head, (ws) => {
        logWithTime('Upgraded connection to WebSocket');
        wss.emit('connection', ws, request);
      });
    }
  });

  // Handle connections
  wss.on('connection', (ws) => {
    const clientId = uuidv4();
    clients.set(clientId, ws);
    
    logWithTime(`Client connected: ${clientId} (total: ${clients.size})`);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection_established',
      clientId,
      message: 'Basic WebSocket connection established',
      timestamp: Date.now()
    }));
    
    // Heartbeat mechanism
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);
    
    // Handle messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        logWithTime(`Message from ${clientId}: ${JSON.stringify(data)}`);
        
        // Echo back as confirmation
        ws.send(JSON.stringify({
          type: 'echo',
          originalMessage: data,
          timestamp: Date.now()
        }));
      } catch (err) {
        logWithTime(`Error parsing message: ${err}`);
      }
    });
    
    // Handle close
    ws.on('close', () => {
      clients.delete(clientId);
      clearInterval(pingInterval);
      logWithTime(`Client disconnected: ${clientId} (remaining: ${clients.size})`);
    });
    
    // Handle errors
    ws.on('error', (err) => {
      logWithTime(`Error for client ${clientId}: ${err.message}`);
      try {
        ws.close();
      } catch (e) {
        // Ignore close errors
      }
    });
  });
  
  // Handle server errors
  wss.on('error', (err) => {
    logWithTime(`Server error: ${err.message}`);
  });
  
  // Send a broadcast to all clients
  setInterval(() => {
    const activeClients = clients.size;
    logWithTime(`Sending heartbeat to ${activeClients} clients`);
    
    if (activeClients > 0) {
      broadcast({
        type: 'heartbeat',
        message: `Server heartbeat - ${activeClients} clients connected`,
        timestamp: Date.now()
      });
    }
  }, 30000);
  
  return {
    broadcast,
    getConnectedClientsCount: () => clients.size
  };
}

// Broadcast message to all connected clients
function broadcast(data: any) {
  const message = JSON.stringify(data);
  let successCount = 0;
  
  clients.forEach((client, id) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
        successCount++;
      } catch (e) {
        logWithTime(`Error sending to client ${id}: ${e}`);
      }
    }
  });
  
  return successCount;
}