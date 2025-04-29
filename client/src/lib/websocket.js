/**
 * Helper module for WebSocket connections in the TerraFusion application
 * This ensures proper WebSocket initialization and error handling
 */

/**
 * Create a WebSocket connection with proper error handling
 * @param {string} path - WebSocket path (e.g., '/ws', '/notifications')
 * @returns {WebSocket|null} WebSocket instance or null if unavailable
 */
export function createWebSocketConnection(path) {
  try {
    // Only create WebSocket if window is defined (client-side)
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host || '';
      
      // Validate host before creating WebSocket
      if (!host) {
        console.warn('WebSocket connection failed: Invalid host');
        return null;
      }
      
      const wsUrl = `${protocol}//${host}${path}`;
      console.log(`Creating WebSocket connection to: ${wsUrl}`);
      
      const socket = new WebSocket(wsUrl);
      
      // Add error handlers
      socket.onopen = () => {
        console.log(`WebSocket connection established: ${wsUrl}`);
      };
      
      socket.onerror = (error) => {
        console.error(`WebSocket error: ${error}`);
      };
      
      socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
      };
      
      return socket;
    }
  } catch (error) {
    console.error('Failed to create WebSocket connection:', error);
  }
  
  return null;
}