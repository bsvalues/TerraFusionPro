import React, { createContext, useContext, useEffect, useState } from 'react';
import { realtimeService } from '@/lib/realtime-service';

type ConnectionMethod = 'websocket' | 'polling';
type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error' | 'polling';

interface RealtimeContextType {
  connectionMethod: ConnectionMethod;
  connectionStatus: ConnectionStatus;
  subscribe: (id: string, options: {
    event: string;
    endpoint: string;
    queryKey: string | string[];
    intervalMs?: number;
    callback: (data: any) => void;
  }) => void;
  unsubscribe: (id: string) => void;
  send: (data: any) => boolean;
  connect: () => void;
  disconnect: () => void;
  forcePolling: () => void;
  forceWebSockets: () => void;
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>(
    realtimeService.getConnectionMethod()
  );
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    realtimeService.getConnectionStatus() as ConnectionStatus
  );
  
  // Track connection method changes
  useEffect(() => {
    const checkConnectionMethod = () => {
      const currentMethod = realtimeService.getConnectionMethod();
      if (currentMethod !== connectionMethod) {
        setConnectionMethod(currentMethod);
      }
      
      const currentStatus = realtimeService.getConnectionStatus() as ConnectionStatus;
      if (currentStatus !== connectionStatus) {
        setConnectionStatus(currentStatus);
      }
    };
    
    // Check initially
    checkConnectionMethod();
    
    // Check periodically
    const intervalId = setInterval(checkConnectionMethod, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [connectionMethod, connectionStatus]);
  
  // Initial connection with polling fallback
  useEffect(() => {
    // Detect Replit environment to apply appropriate strategy
    const isReplitEnv = window.location.host.includes('replit');
    
    if (isReplitEnv) {
      // In Replit, start with polling directly to avoid WebSocket errors
      console.log('Replit environment detected - using polling by default');
      realtimeService.forcePolling();
      setConnectionMethod('polling');
      setConnectionStatus('polling');
    } else {
      // In other environments, try WebSockets first
      realtimeService.connect();
    }
    
    return () => {
      realtimeService.disconnect();
    };
  }, []);
  
  // Helper method
  const isConnected = connectionStatus === 'connected' || connectionMethod === 'polling';
  
  const contextValue: RealtimeContextType = {
    connectionMethod,
    connectionStatus,
    isConnected,
    subscribe: (id, options) => realtimeService.subscribe(id, options),
    unsubscribe: (id) => realtimeService.unsubscribe(id),
    send: (data) => realtimeService.send(data),
    connect: () => realtimeService.connect(),
    disconnect: () => realtimeService.disconnect(),
    forcePolling: () => {
      realtimeService.forcePolling();
      setConnectionMethod('polling');
      setConnectionStatus('polling');
    },
    forceWebSockets: () => {
      realtimeService.forceWebSockets();
      setConnectionMethod('websocket');
    }
  };
  
  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};