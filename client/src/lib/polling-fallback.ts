import { websocketManager } from './websocket-manager';

/**
 * Long polling fallback when WebSockets aren't available
 * This module provides HTTP long-polling as a backup when WebSocket
 * connections fail in the Replit environment
 */

let isPolling = false;
let pollInterval: ReturnType<typeof setInterval> | null = null;
const pollIntervalMs = 2000;
const maxPollingErrors = 5;
let pollingErrors = 0;

/**
 * Start long polling to server
 */
export function startLongPolling(): void {
  if (isPolling) return;
  
  isPolling = true;
  console.log('[PollingFallback] Starting long polling fallback...');
  
  // Notify about fallback mode
  websocketManager.handleMessage({
    type: 'connection_status',
    status: 'connected',
    protocol: 'long-polling',
    isFallback: true
  });
  
  // Start poll interval
  pollInterval = setInterval(pollServer, pollIntervalMs);
  
  // Initial poll
  pollServer();
}

/**
 * Stop long polling to server
 */
export function stopLongPolling(): void {
  if (!isPolling) return;
  
  isPolling = false;
  console.log('[PollingFallback] Stopping long polling');
  
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  
  pollingErrors = 0;
}

// Store the last message ID we've received
let lastMessageId: string | null = null;

/**
 * Poll the server for updates
 */
async function pollServer(): Promise<void> {
  try {
    // Get client ID from WebSocketManager
    const clientId = websocketManager.getClientId() || 'unknown';
    
    // Build query params
    const params = new URLSearchParams({
      clientId: clientId,
      timestamp: Date.now().toString()
    });
    
    // Add last message ID if we have it
    if (lastMessageId) {
      params.append('lastId', lastMessageId);
    }
    
    const response = await fetch(`/api/poll?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Reset error count on success
      pollingErrors = 0;
      
      // Process messages
      if (data && Array.isArray(data.messages) && data.messages.length > 0) {
        // Update last message ID for next poll
        const lastMessage = data.messages[data.messages.length - 1];
        if (lastMessage && lastMessage.id) {
          lastMessageId = lastMessage.id;
        }
        
        // Process each message
        data.messages.forEach((message: any) => {
          // Invoke WebSocketManager message handler
          websocketManager.handleMessage(message.data || message);
        });
      }
      
      // Adjust poll interval if server suggests it
      if (data.control && data.control.interval) {
        const newInterval = data.control.interval;
        if (newInterval !== pollIntervalMs && newInterval >= 1000 && newInterval <= 10000) {
          // Only change interval if it's in a reasonable range
          console.log(`[PollingFallback] Adjusting poll interval to ${newInterval}ms`);
          
          // Restart polling with new interval
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = setInterval(pollServer, newInterval);
          }
        }
      }
    } else {
      handlePollingError(new Error(`HTTP error: ${response.status} ${response.statusText}`));
    }
  } catch (error) {
    handlePollingError(error as Error);
  }
}

/**
 * Send data to server via HTTP POST instead of WebSocket
 */
export async function sendViaHttp(data: any): Promise<boolean> {
  try {
    const clientId = websocketManager.getClientId() || 'unknown';
    
    const response = await fetch(`/api/poll/send?clientId=${encodeURIComponent(clientId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': clientId
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        return true;
      } else {
        console.error('[PollingFallback] Server reported failure:', result.error || 'Unknown error');
        return false;
      }
    } else {
      console.error('[PollingFallback] Failed to send data:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('[PollingFallback] Error sending data:', error);
    return false;
  }
}

/**
 * Handle polling errors
 */
function handlePollingError(error: Error): void {
  console.error('[PollingFallback] Polling error:', error);
  
  pollingErrors++;
  
  // If too many errors, stop polling
  if (pollingErrors >= maxPollingErrors) {
    console.error(`[PollingFallback] Too many polling errors (${pollingErrors}), stopping`);
    
    stopLongPolling();
    
    // Notify client of disconnection
    websocketManager.handleMessage({
      type: 'connection_status',
      status: 'disconnected',
      reason: 'Too many polling errors',
      protocol: 'long-polling'
    });
  }
}