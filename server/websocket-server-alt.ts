import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

/**
 * Setup a basic, alternative WebSocket server for testing connections
 * This implementation is deliberately minimal to avoid potential issues
 */
export function setupBasicWebSocketServer(httpServer: Server) {
  console.log('[WebSocket] Setting up alternative WebSocket server on path /ws-alt');

  // Create a WebSocket server with the absolute minimum configuration
  // No additional options that could potentially cause issues
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws-alt'
  });
  
  // Simple client tracking
  const clients = new Set<WebSocket>();
  
  // Handle new connections
  wss.on('connection', (ws, req) => {
    // Add to clients
    clients.add(ws);
    
    // Generate a simple identifier
    const clientId = Math.random().toString(36).substring(2, 10);
    console.log(`[Alt] WebSocket client connected: ${clientId}`);
    
    // Send welcome message
    try {
      ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        clientId,
        message: 'Connected to alternative WebSocket server'
      }));
    } catch (error) {
      console.error('[Alt] Error sending welcome message:', error);
    }
    
    // Handle messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`[Alt] Message from ${clientId}:`, data);
        
        // Simple echo for any received message
        ws.send(JSON.stringify({
          type: 'response',
          originalMessage: data,
          timestamp: Date.now(),
          message: 'Message received'
        }));
      } catch (e) {
        console.error('[Alt] Error handling message:', e);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log(`[Alt] WebSocket client disconnected: ${clientId}`);
      clients.delete(ws);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error(`[Alt] WebSocket error for client ${clientId}:`, error);
      clients.delete(ws);
    });
  });
  
  // Handle server errors
  wss.on('error', (error) => {
    console.error('[Alt] WebSocket server error:', error);
  });

  return wss;
}