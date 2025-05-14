import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';

// Simple storage for connected clients
const clients = new Map<string, WebSocket>();

// Log with timestamp
function logWithTime(message: string) {
  console.log(`[${new Date().toISOString()}] [BasicWS] ${message}`);
}

export function setupBasicWebSocketServer(server: http.Server) {
  logWithTime('Setting up basic WebSocket server');
  
  // Create an extremely simple WebSocket server directly attached to the HTTP server
  // This is the most reliable way to handle WebSockets in Replit
  const wss = new WebSocketServer({ 
    server, 
    path: '/basic-ws',
    // Accept connections from any origin
    verifyClient: () => true,
    // Special handling for protocol negotiation to improve compatibility
    // Allow any protocol request
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      // Below options specified as default values
      concurrencyLimit: 10, // Limits zlib concurrency for performance
      threshold: 1024 // Size below which messages should not be compressed
    },
    // Increase the timeout for better reliability 
    clientTracking: true
  });
  
  logWithTime('Basic WebSocket server created');
  
  // Handle new connections
  wss.on('connection', (ws, request) => {
    // Generate a unique ID for this connection
    const clientId = uuidv4();
    clients.set(clientId, ws);
    
    logWithTime(`New client connected: ${clientId} (total: ${clients.size})`);
    
    // Send immediate welcome message
    try {
      ws.send(JSON.stringify({
        type: 'connection_established',
        clientId,
        message: 'Successfully connected to basic WebSocket',
        timestamp: Date.now()
      }));
      logWithTime(`Welcome message sent to client ${clientId}`);
    } catch (err) {
      logWithTime(`Error sending welcome message: ${err}`);
    }
    
    // Set up heartbeat (ping) every 30 seconds to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        logWithTime(`Sending ping to client ${clientId}`);
        try {
          ws.ping();
        } catch (err) {
          logWithTime(`Error sending ping: ${err}`);
        }
      }
    }, 30000);
    
    // Handle messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        logWithTime(`Message from ${clientId}: ${JSON.stringify(data)}`);
        
        // Echo back the message
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({
              type: 'echo',
              originalMessage: data,
              timestamp: Date.now()
            }));
          } catch (e) {
            logWithTime(`Error echoing message: ${e}`);
          }
        }
      } catch (err) {
        logWithTime(`Error parsing message: ${err}`);
      }
    });
    
    // Handle connection close
    ws.on('close', (code, reason) => {
      clients.delete(clientId);
      clearInterval(heartbeatInterval);
      logWithTime(`Client ${clientId} disconnected (code: ${code}, reason: ${reason || 'none'}) (remaining: ${clients.size})`);
    });
    
    // Handle errors
    ws.on('error', (err) => {
      logWithTime(`Error for client ${clientId}: ${err.message}`);
      
      // Try to close the connection gracefully
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1011, 'Internal server error');
        }
      } catch (e) {
        logWithTime(`Error closing connection: ${e}`);
      }
    });
    
    // Handle pong responses (client is alive)
    ws.on('pong', () => {
      logWithTime(`Received pong from client ${clientId}`);
    });
  });
  
  // Handle server errors
  wss.on('error', (err) => {
    logWithTime(`Server error: ${err.message}`);
  });
  
  // Send a broadcast message to all connected clients every 30 seconds
  setInterval(() => {
    const activeClients = clients.size;
    
    if (activeClients > 0) {
      logWithTime(`Broadcasting heartbeat to ${activeClients} clients`);
      
      const message = JSON.stringify({
        type: 'heartbeat',
        message: `Server heartbeat - ${activeClients} clients connected`,
        timestamp: Date.now()
      });
      
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
      
      logWithTime(`Heartbeat sent to ${successCount}/${activeClients} clients`);
    }
  }, 30000);
  
  // Define broadcast function for external use
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
  
  return {
    broadcast,
    getConnectedClientsCount: () => clients.size
  };
}