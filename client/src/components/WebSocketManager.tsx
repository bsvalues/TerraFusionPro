import React, { useEffect, useState } from 'react';
import websocketClient from '@/lib/websocketClient';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';

// WebSocket connection states
enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected', 
  DISCONNECTED = 'disconnected',
  FALLBACK = 'fallback'
}

/**
 * WebSocketManager component
 * 
 * Manages WebSocket connection and shows status information
 * Provides manual reconnection capability
 */
const WebSocketManager: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    websocketClient.isSocketConnected() 
      ? ConnectionState.CONNECTED 
      : ConnectionState.CONNECTING
  );
  const [attempts, setAttempts] = useState(websocketClient.getReconnectAttempts());
  const [maxAttempts, setMaxAttempts] = useState(websocketClient.getMaxReconnectAttempts());
  
  useEffect(() => {
    // Subscribe to connection state changes
    const unsubscribe = websocketClient.onConnectionStateChange((connected) => {
      console.log(`[WebSocketManager] Connection state changed: ${connected}`);
      
      if (connected) {
        setConnectionState(ConnectionState.CONNECTED);
      } else {
        // If max attempts reached, we've switched to fallback mode
        const currentAttempts = websocketClient.getReconnectAttempts();
        setAttempts(currentAttempts);
        
        if (currentAttempts >= maxAttempts) {
          setConnectionState(ConnectionState.FALLBACK);
        } else {
          setConnectionState(ConnectionState.DISCONNECTED);
        }
      }
    });
    
    // Connect to WebSocket on component mount
    if (!websocketClient.isSocketConnected()) {
      console.log('[WebSocketManager] Initial connection attempt');
      websocketClient.connect();
    }
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [maxAttempts]);
  
  // Handle manual reconnection
  const handleReconnect = () => {
    console.log('[WebSocketManager] Manual reconnection initiated');
    websocketClient.disconnect();
    // Reset connection state to connecting
    setConnectionState(ConnectionState.CONNECTING);
    // Reset attempts counter
    setAttempts(0);
    // Reconnect after a brief delay
    setTimeout(() => {
      websocketClient.connect();
    }, 1000);
  };
  
  // No UI if everything is working normally
  if (connectionState === ConnectionState.CONNECTED) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert variant={connectionState === ConnectionState.FALLBACK ? "destructive" : "default"}>
        <div className="flex items-center gap-2">
          {connectionState === ConnectionState.CONNECTING && (
            <Wifi className="h-4 w-4 animate-pulse" />
          )}
          {connectionState === ConnectionState.DISCONNECTED && (
            <WifiOff className="h-4 w-4" />
          )}
          {connectionState === ConnectionState.FALLBACK && (
            <AlertCircle className="h-4 w-4" />
          )}
          
          <AlertTitle>
            {connectionState === ConnectionState.CONNECTING && "Connecting..."}
            {connectionState === ConnectionState.DISCONNECTED && "Connection Lost"}
            {connectionState === ConnectionState.FALLBACK && "Using Fallback Mode"}
          </AlertTitle>
        </div>
        
        <AlertDescription>
          {connectionState === ConnectionState.CONNECTING && (
            <p>Establishing real-time connection...</p>
          )}
          
          {connectionState === ConnectionState.DISCONNECTED && (
            <p>Attempting to reconnect ({attempts}/{maxAttempts})...</p>
          )}
          
          {connectionState === ConnectionState.FALLBACK && (
            <div className="mt-2">
              <p>Using polling fallback mode. Real-time features may be delayed.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={handleReconnect}
              >
                Try to reconnect
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default WebSocketManager;