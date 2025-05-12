import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

// Define the types of notifications our WebSocket might receive
export type NotificationType = 'system' | 'update' | 'alert' | 'info';

// Define the shape of a notification
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  read: boolean;
  data?: any; // Optional additional data
}

// Define the context shape
interface WebSocketContextType {
  connected: boolean;
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  sendMessage: (message: any) => void;
  connectionMode: 'websocket' | 'polling' | 'disconnected';
}

// Create the context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  notifications: [],
  markAsRead: () => {},
  markAllAsRead: () => {},
  sendMessage: () => {},
  connectionMode: 'disconnected',
});

// Define a list of example notifications to show on first load
const initialNotifications: Notification[] = [
  {
    id: 'notification-1',
    type: 'system',
    message: 'System check complete - AI model health: Excellent',
    timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    read: false,
  },
  {
    id: 'notification-2',
    type: 'update',
    message: 'New TerraFusion update available with enhanced AI features',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    read: true,
  },
  {
    id: 'notification-3',
    type: 'alert',
    message: 'Property condition analysis complete for 123 Main St',
    timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
    read: true,
  },
];

// The provider component
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State to track connection status and notifications
  const [connected, setConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'websocket' | 'polling' | 'disconnected'>('disconnected');
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  // Reference to the WebSocket instance
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const clientIdRef = useRef<string>(`client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  // Function to handle messages from the WebSocket
  const handleSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.log('[WebSocketContext] Received message:', data);

      // If it's a notification, add it
      if (data.type === 'notification') {
        const newNotification: Notification = {
          id: `notification-${Date.now()}`,
          type: data.notificationType || 'info',
          message: data.message,
          timestamp: Date.now(),
          read: false,
          data: data.data,
        };
        
        setNotifications((prev) => [newNotification, ...prev]);
      }
    } catch (error) {
      console.error('[WebSocketContext] Error parsing WebSocket message:', error);
    }
  }, []);

  // Function to setup long polling as a fallback
  const setupLongPolling = useCallback(() => {
    console.log('[WebSocketContext] Starting long polling fallback with client ID:', clientIdRef.current);
    
    setConnectionMode('polling');
    setConnected(true);

    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Setup polling
    const poll = async () => {
      try {
        const response = await fetch(`/api/poll?clientId=${clientIdRef.current}`);
        if (response.ok) {
          const data = await response.json();
          
          // If we received notifications, process them
          if (data.messages && Array.isArray(data.messages)) {
            data.messages.forEach((msg: any) => {
              if (msg.type === 'notification') {
                const newNotification: Notification = {
                  id: `notification-${Date.now()}-${Math.random()}`,
                  type: msg.notificationType || 'info',
                  message: msg.message,
                  timestamp: msg.timestamp || Date.now(),
                  read: false,
                  data: msg.data,
                };
                setNotifications((prev) => [newNotification, ...prev]);
              }
            });
          }
        }
      } catch (error) {
        console.error('[WebSocketContext] Polling error:', error);
      }
    };

    // Poll immediately then set interval
    poll();
    pollingIntervalRef.current = setInterval(poll, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Function to establish WebSocket connection
  const connectWebSocket = useCallback(() => {
    // Clean up any existing socket
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Determine the WebSocket URL (using the same protocol and hostname as the current page)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      console.log(`[WebSocketManager] Connecting to ${wsUrl}...`);
      
      // Create new WebSocket connection
      socketRef.current = new WebSocket(wsUrl);
      console.log('[WebSocketManager] Default connection handler: websocket connecting');

      // Set up event handlers
      socketRef.current.onopen = () => {
        console.log('[WebSocketManager] WebSocket connected');
        setConnected(true);
        setConnectionMode('websocket');
        reconnectAttemptsRef.current = 0;
        
        // Send a handshake message
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ 
            type: 'handshake', 
            clientId: clientIdRef.current 
          }));
        }
      };

      socketRef.current.onmessage = handleSocketMessage;

      socketRef.current.onclose = (event) => {
        console.log(`[WebSocketManager] WebSocket closed: ${event.code} - ${event.reason || 'No reason provided'}`);
        console.log('[WebSocketManager] Default connection handler: websocket disconnected');
        setConnected(false);
        setConnectionMode('disconnected');

        // If we still have reconnect attempts left, try reconnecting with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
          console.log(`[WebSocketManager] Scheduling reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            
            // Try alternative WebSocket path for subsequent attempts
            if (reconnectAttemptsRef.current > 1) {
              console.log('[WebSocketManager] Switching to alternate WebSocket endpoint: /ws-alt');
              const wsAltUrl = `${protocol}//${window.location.host}/ws-alt`;
              if (socketRef.current) {
                socketRef.current.close();
              }
              socketRef.current = new WebSocket(wsAltUrl);
              // Set up the same event handlers for the new socket
              if (socketRef.current) {
                socketRef.current.onopen = () => {
                  console.log('[WebSocketManager] WebSocket connected (alternate endpoint)');
                  setConnected(true);
                  setConnectionMode('websocket');
                  reconnectAttemptsRef.current = 0;
                  
                  // Send a handshake message on the new connection
                  if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                    socketRef.current.send(JSON.stringify({ 
                      type: 'handshake', 
                      clientId: clientIdRef.current 
                    }));
                  }
                };
                socketRef.current.onmessage = handleSocketMessage;
                socketRef.current.onclose = (event) => {
                  console.log(`[WebSocketManager] WebSocket closed: ${event.code} - ${event.reason || 'No reason provided'}`);
                  console.log('[WebSocketManager] Default connection handler: websocket disconnected');
                  setConnected(false);
                  setConnectionMode('disconnected');
                  
                  // Only continue reconnect attempts if we haven't maxed out
                  if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    connectWebSocket();
                  } else {
                    console.log('[WebSocketManager] Max reconnect attempts reached, giving up');
                    // Switch to long polling as fallback
                    console.log('[WebSocketContext] WebSocket connection failed, switching to polling fallback');
                    setupLongPolling();
                  }
                };
                socketRef.current.onerror = (error) => {
                  console.error('[WebSocketManager] WebSocket error:', error);
                };
              }
            } else {
              connectWebSocket();
            }
          }, delay);
        } else {
          // We've exceeded our max retry count, switch to long polling
          console.log('[WebSocketManager] Max reconnect attempts reached, giving up');
          console.log('[WebSocketContext] WebSocket connection failed, switching to polling fallback');
          setupLongPolling();
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('[WebSocketManager] WebSocket error:', error);
      };
    } catch (error) {
      console.error('[WebSocketContext] Error creating WebSocket:', error);
      // If WebSocket fails immediately, try polling
      setupLongPolling();
    }
  }, [handleSocketMessage, setupLongPolling]);

  // Connect on component mount
  useEffect(() => {
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [connectWebSocket, setupLongPolling]);

  // Function to mark a notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  // Function to mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  }, []);

  // Function to send a message through the WebSocket
  const sendMessage = useCallback((message: any) => {
    if (connectionMode === 'websocket' && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else if (connectionMode === 'polling') {
      // For polling mode, we can use fetch to send messages
      fetch('/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: clientIdRef.current,
          ...message,
        }),
      }).catch(error => {
        console.error('[WebSocketContext] Error sending message via HTTP:', error);
      });
    } else {
      console.warn('[WebSocketManager] Cannot send message, socket not open');
    }
  }, [connectionMode]);

  // Provide the WebSocket context to children
  return (
    <WebSocketContext.Provider
      value={{
        connected,
        notifications,
        markAsRead,
        markAllAsRead,
        sendMessage,
        connectionMode,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook for easy access to WebSocket context
export const useWebSocket = () => useContext(WebSocketContext);