import React, { createContext, useContext, useEffect, useState } from 'react';
import { realtimeService } from '@/lib/realtime-service';
import { useToast } from '@/hooks/use-toast';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error' | 'polling';
type ConnectionProtocol = 'websocket' | 'sse' | 'long-polling' | 'none';

interface RealtimeContextType {
  connectionStatus: ConnectionStatus;
  connectionProtocol: ConnectionProtocol;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  send: (data: any) => boolean;
  setPreferredProtocol: (protocol: ConnectionProtocol) => void;
  useAutoFallback: (enabled: boolean) => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  connectionStatus: 'disconnected',
  connectionProtocol: 'none',
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
  send: () => false,
  setPreferredProtocol: () => {},
  useAutoFallback: () => {},
});

export const useRealtime = () => useContext(RealtimeContext);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connectionProtocol, setConnectionProtocol] = useState<ConnectionProtocol>('none');
  const { toast } = useToast();
  
  useEffect(() => {
    // Handle connection state changes
    const handleConnection = (data: any) => {
      setConnectionStatus(data.status || 'disconnected');
      
      // Show toast notifications for important connection events
      if (data.status === 'connected') {
        toast({
          title: 'Connected',
          description: `Real-time connection established using ${realtimeService.getProtocol()}`,
        });
      } else if (data.status === 'error') {
        toast({
          title: 'Connection Error',
          description: data.message || 'Could not establish real-time connection',
          variant: 'destructive',
        });
      } else if (data.status === 'polling') {
        toast({
          title: 'Polling Mode',
          description: 'Using long-polling for real-time updates',
        });
      }
    };
    
    // Handle protocol changes
    const handleProtocolChange = (data: any) => {
      setConnectionProtocol(data.protocol || 'none');
      
      // Only show protocol change notifications after initial connection
      if (connectionStatus !== 'disconnected') {
        toast({
          title: 'Connection Changed',
          description: `Now using ${data.protocol} for real-time updates`,
        });
      }
    };
    
    // Handle errors
    const handleError = (error: any) => {
      console.error('Realtime error:', error);
      
      // Only show one error toast to avoid overwhelming the user
      if (error.critical) {
        toast({
          title: 'Connection Error',
          description: error.message || 'An error occurred with the real-time connection',
          variant: 'destructive',
        });
      }
    };
    
    // Register event listeners
    realtimeService.on('connection', handleConnection);
    realtimeService.on('protocol_change', handleProtocolChange);
    realtimeService.on('error', handleError);
    
    // Get initial states
    setConnectionStatus(realtimeService.getState());
    setConnectionProtocol(realtimeService.getProtocol());
    
    // Initialize connection
    realtimeService.connect();
    
    // Cleanup on unmount
    return () => {
      realtimeService.off('connection', handleConnection);
      realtimeService.off('protocol_change', handleProtocolChange);
      realtimeService.off('error', handleError);
      realtimeService.disconnectAll();
    };
  }, [toast]);
  
  return (
    <RealtimeContext.Provider 
      value={{
        connectionStatus,
        connectionProtocol,
        isConnected: connectionStatus === 'connected' || connectionStatus === 'polling',
        connect: () => realtimeService.connect(),
        disconnect: () => realtimeService.disconnectAll(),
        send: (data) => realtimeService.send(data),
        setPreferredProtocol: (protocol) => realtimeService.setPreferredProtocol(protocol),
        useAutoFallback: (enabled) => realtimeService.setFallbackEnabled(enabled),
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};