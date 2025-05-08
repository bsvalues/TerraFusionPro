import React, { createContext, useContext, useEffect, useState } from 'react';
import { websocketManager } from '@/lib/websocket-manager';
import { startLongPolling, stopLongPolling, sendViaHttp } from '@/lib/polling-fallback';
import { useToast } from '@/hooks/use-toast';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketContextType {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  connectionError: string | null;
  reconnectAttempts: number;
  connectionType: 'websocket' | 'long-polling' | 'none';
  usingFallback: boolean;
  connect: () => void;
  disconnect: () => void;
  send: (data: any) => boolean;
  lastPing: number | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  connectionStatus: 'disconnected',
  isConnected: false,
  connectionError: null,
  reconnectAttempts: 0,
  connect: () => {},
  disconnect: () => {},
  send: () => false,
  lastPing: null,
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastPing, setLastPing] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Derived state
  const isConnected = connectionStatus === 'connected';
  
  useEffect(() => {
    // Handle connection state changes
    const handleConnection = (data: { status: string; message?: string; code?: number }) => {
      setConnectionStatus(data.status as ConnectionStatus);
      
      if (data.status === 'connecting') {
        setConnectionError(null);
      } else if (data.status === 'connected') {
        // Reset error state and reconnect attempts on successful connection
        setConnectionError(null);
        setReconnectAttempts(0);
        setLastPing(Date.now());
        
        // Toast notification only if reconnecting (not on initial connection)
        if (reconnectAttempts > 0) {
          toast({
            title: "Connection Restored",
            description: "WebSocket connection has been re-established",
            variant: "default",
          });
        }
      } else if (data.status === 'error') {
        setConnectionError(data.message || 'Unknown connection error');
        
        toast({
          title: "Connection Error",
          description: data.message || 'Connection error occurred',
          variant: "destructive",
        });
      } else if (data.status === 'disconnected') {
        if (data.code && data.code !== 1000) { // Not a normal closure
          toast({
            title: "Connection Lost",
            description: "Connection to server was lost. Attempting to reconnect...",
            variant: "destructive",
          });
        }
      }
    };
    
    // Handle error events
    const handleError = (error: any) => {
      if (error.type === 'connection_error') {
        setConnectionError(`Connection error: ${error.message || 'Unknown error'}`);
      } else if (error.type === 'send_error') {
        setConnectionError(`Failed to send message: ${error.message || 'Unknown error'}`);
      }
    };
    
    // Register event listeners
    websocketManager.on('connection', handleConnection);
    websocketManager.on('error', handleError);
    
    // Set up ping mechanism to detect connection health
    const pingInterval = window.setInterval(() => {
      if (connectionStatus === 'connected') {
        websocketManager.send({ type: 'ping', timestamp: Date.now() });
        setLastPing(Date.now());
      }
    }, 30000);
    
    // Listen for pong responses
    const handlePong = (data: any) => {
      if (data.type === 'pong') {
        setLastPing(Date.now());
      }
    };
    websocketManager.on('pong', handlePong);
    
    // Listen for heartbeat responses
    const handleHeartbeat = (data: any) => {
      if (data.type === 'heartbeat' && data.action === 'pong') {
        setLastPing(Date.now());
      }
    };
    websocketManager.on('heartbeat', handleHeartbeat);
    
    // Connect on mount
    websocketManager.connect();
    
    // Cleanup function
    return () => {
      websocketManager.off('connection', handleConnection);
      websocketManager.off('error', handleError);
      websocketManager.off('pong', handlePong);
      websocketManager.off('heartbeat', handleHeartbeat);
      clearInterval(pingInterval);
      
      // Don't disconnect here as other components might still need the connection
      // The websocketManager will handle cleanup on page unload
    };
  }, [toast, reconnectAttempts]);
  
  // Update reconnect attempts when websocketManager's reconnect attempts change
  useEffect(() => {
    const handleReconnectAttempt = () => {
      setReconnectAttempts(prev => prev + 1);
    };
    
    // Handle WebSocket connection failure by switching to polling
    const handleConnectionFailed = (data: any) => {
      console.log('[WebSocketContext] WebSocket connection failed, switching to polling fallback');
      
      toast({
        title: "Switching Connection Method",
        description: "WebSocket connection failed. Using fallback method to stay connected.",
        variant: "default",
      });
      
      // Start long polling as a fallback
      startLongPolling();
    };
    
    websocketManager.on('reconnect_attempt', handleReconnectAttempt);
    websocketManager.on('connection_failed', handleConnectionFailed);
    
    return () => {
      websocketManager.off('reconnect_attempt', handleReconnectAttempt);
      websocketManager.off('connection_failed', handleConnectionFailed);
    };
  }, [toast]);
  
  return (
    <WebSocketContext.Provider 
      value={{
        connectionStatus,
        isConnected,
        connectionError,
        reconnectAttempts,
        connect: () => {
          toast({
            title: "Connecting",
            description: "Attempting to establish connection...",
          });
          websocketManager.connect();
        },
        disconnect: () => {
          websocketManager.disconnect();
          stopLongPolling(); // Also stop polling fallback
          toast({
            title: "Disconnected",
            description: "WebSocket connection closed",
          });
        },
        send: (data) => {
          // Try WebSocket first, fall back to HTTP if not available
          const sentViaWebSocket = websocketManager.send(data);
          
          // If WebSocket send fails, try HTTP
          if (!sentViaWebSocket) {
            console.log('[WebSocketContext] Sending via HTTP fallback');
            sendViaHttp(data)
              .then(success => {
                if (!success) {
                  console.error('[WebSocketContext] Failed to send via HTTP fallback');
                }
              })
              .catch(err => {
                console.error('[WebSocketContext] Error sending via HTTP fallback:', err);
              });
          }
          
          // Return if initial send was successful
          return sentViaWebSocket;
        },
        lastPing,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);