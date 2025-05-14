import React, { createContext, useContext, useEffect, useCallback, useState, useRef } from 'react';

// Define message types
type MessageType = 'connection_established' | 'echo' | 'heartbeat' | 'notification' | 'error';

// Define the shape of a message
interface WebSocketMessage {
  type: MessageType;
  message?: string;
  timestamp: number;
  clientId?: string;
  [key: string]: any; // Allow additional properties
}

// Define the context shape
interface BasicWebSocketContextType {
  connected: boolean;
  messages: WebSocketMessage[];
  sendMessage: (data: any) => void;
  lastMessage: WebSocketMessage | null;
}

// Create the context with default values
const BasicWebSocketContext = createContext<BasicWebSocketContextType>({
  connected: false,
  messages: [],
  sendMessage: () => {},
  lastMessage: null
});

// Provider component
export const BasicWebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  // WebSocket reference
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  
  // Function to handle messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as WebSocketMessage;
      console.log('[BasicWebSocket] Received:', data);
      
      // Add the message to our history
      setMessages(prev => [data, ...prev].slice(0, 50)); // Keep last 50 messages
      setLastMessage(data);
    } catch (err) {
      console.error('[BasicWebSocket] Error parsing message:', err);
    }
  }, []);
  
  // Function to establish connection
  const connect = useCallback(() => {
    // Close existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    try {
      // Determine WebSocket URL
      // For Replit, we need to make sure we're connecting to the right endpoint
      // Use direct hostname with explicit port if needed
      let host = window.location.host;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Special handling for Replit environments
      if (host.includes('replit')) {
        // Keep the full host without modifications for Replit
        console.log(`[BasicWebSocket] Replit environment detected: ${host}`);
      } else if (window.location.port) {
        // For local development with explicit port
        host = window.location.hostname + ':' + window.location.port;
      } else {
        // Fallback to just hostname
        host = window.location.hostname;
      }
      
      // Construct URL with host
      const wsUrl = `${protocol}//${host}/basic-ws`;
      
      // Add a timestamp and random token to avoid caching issues
      const token = Math.random().toString(36).substring(2, 15);
      const timestampedUrl = `${wsUrl}?t=${Date.now()}&token=${token}`;
      
      console.log(`[BasicWebSocket] Connecting to ${timestampedUrl}...`);
      console.log(`[BasicWebSocket] Current location: ${window.location.href}`);
      console.log(`[BasicWebSocket] WebSocket path: /basic-ws with token: ${token}`);
      
      // Create WebSocket connection with timestamp to avoid caching
      socketRef.current = new WebSocket(timestampedUrl);
      
      // Set up event handlers
      socketRef.current.onopen = () => {
        console.log('[BasicWebSocket] Connected!');
        setConnected(true);
        reconnectCountRef.current = 0;
      };
      
      socketRef.current.onmessage = handleMessage;
      
      socketRef.current.onclose = () => {
        console.log('[BasicWebSocket] Connection closed');
        setConnected(false);
        
        // Attempt to reconnect if not intentionally closed
        if (reconnectCountRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000);
          console.log(`[BasicWebSocket] Reconnecting in ${delay}ms...`);
          
          setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, delay);
        }
      };
      
      socketRef.current.onerror = (error) => {
        console.error('[BasicWebSocket] Error:', error);
      };
    } catch (err) {
      console.error('[BasicWebSocket] Connection error:', err);
    }
  }, [handleMessage]);
  
  // Function to send a message
  const sendMessage = useCallback((data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(data));
      } catch (err) {
        console.error('[BasicWebSocket] Error sending message:', err);
      }
    } else {
      console.warn('[BasicWebSocket] Cannot send message, not connected');
    }
  }, []);
  
  // Connect on mount
  useEffect(() => {
    connect();
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);
  
  // Provide the context
  return (
    <BasicWebSocketContext.Provider
      value={{
        connected,
        messages,
        sendMessage,
        lastMessage
      }}
    >
      {children}
    </BasicWebSocketContext.Provider>
  );
};

// Custom hook for using the WebSocket context
export const useBasicWebSocket = () => useContext(BasicWebSocketContext);