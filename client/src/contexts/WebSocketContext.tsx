import React, { createContext, useContext, useEffect, useState } from 'react';
import { websocketManager } from '@/lib/websocket-manager';

type WebSocketContextType = {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  send: (data: any) => void;
};

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
  send: () => {},
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const handleConnection = (data: { status: string }) => {
      setIsConnected(data.status === 'connected');
    };
    
    websocketManager.on('connection', handleConnection);
    
    // Connect on mount
    websocketManager.connect();
    
    return () => {
      websocketManager.off('connection', handleConnection);
      websocketManager.disconnect();
    };
  }, []);
  
  return (
    <WebSocketContext.Provider 
      value={{
        isConnected,
        connect: () => websocketManager.connect(),
        disconnect: () => websocketManager.disconnect(),
        send: (data) => websocketManager.send(data),
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);