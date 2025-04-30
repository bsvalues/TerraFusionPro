import React, { useEffect, useState } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function WebSocketTestPage() {
  const { 
    connectionStatus, 
    isConnected, 
    connectionError, 
    reconnectAttempts, 
    connect, 
    disconnect, 
    send, 
    lastPing 
  } = useWebSocket();
  
  const [message, setMessage] = useState('');
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
  const [lastResponse, setLastResponse] = useState<any>(null);
  
  // Setup message listener
  useEffect(() => {
    // Create a WebSocket directly as a test - try multiple endpoints
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Try all possible variations
    const wsUrls = [
      // Standard endpoint (main server)
      `${protocol}//${window.location.host}/ws`,
      // Direct port 5000 endpoint 
      `${protocol}//${window.location.hostname}:5000/ws`,
      // Direct port 3000 endpoint (Vite dev server)
      `${protocol}//${window.location.hostname}:3000/ws`,
    ];
    
    console.log('Trying WebSocket connections with these URLs:', wsUrls);
    
    // Create multiple test connections
    const connections = wsUrls.map((url) => {
      try {
        const ws = new WebSocket(url);
        
        ws.onopen = () => {
          console.log(`Direct WebSocket connection opened on ${url}`);
          setReceivedMessages(prev => [...prev, `Connected to ${url}`]);
        };
        
        ws.onclose = (event) => {
          console.log(`Direct WebSocket connection closed for ${url}:`, event.code, event.reason);
          setReceivedMessages(prev => [...prev, `Disconnected from ${url}: ${event.code} ${event.reason || 'No reason'}`]);
        };
        
        ws.onerror = (error) => {
          console.error(`Direct WebSocket error for ${url}:`, error);
          setReceivedMessages(prev => [...prev, `Error connecting to ${url}`]);
        };
        
        ws.onmessage = (event) => {
          console.log(`Direct message received from ${url}:`, event.data);
          setReceivedMessages(prev => [...prev, `Message from ${url}: ${event.data}`]);
        };
        
        return ws;
      } catch (e) {
        console.error(`Failed to connect to ${url}:`, e);
        setReceivedMessages(prev => [...prev, `Failed to initialize connection to ${url}: ${e.message}`]);
        return null;
      }
    }).filter(Boolean);
    
    // Clean up
    return () => {
      connections.forEach(ws => {
        if (ws) ws.close();
      });
    };
  }, []);
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const success = send({
      type: 'echo',
      message: message,
      timestamp: Date.now()
    });
    
    if (success) {
      setMessage('');
    }
  };
  
  const handlePing = () => {
    send({
      type: 'ping',
      timestamp: Date.now()
    });
  };
  
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'connecting': return <RefreshCw className="h-5 w-5 animate-spin text-yellow-500" />;
      case 'disconnected': return <AlertCircle className="h-5 w-5 text-gray-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };
  
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">WebSocket Test</h1>
      
      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Connection Status
              <Badge 
                className={`${getStatusColor()} text-white ml-2`}
              >
                {connectionStatus.toUpperCase()}
              </Badge>
            </CardTitle>
            <CardDescription>
              WebSocket connection details and controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center">
                {getStatusIcon()}
                <span className="ml-2 font-medium">Status: {connectionStatus}</span>
              </div>
              
              {connectionError && (
                <div className="bg-red-50 p-3 rounded border border-red-200 text-red-700">
                  <strong>Error:</strong> {connectionError}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Reconnection Attempts: <strong>{reconnectAttempts}</strong></div>
                <div>Last Ping: <strong>{formatTime(lastPing)}</strong></div>
              </div>
              
              <div className="flex space-x-2 mt-2">
                <Button 
                  onClick={connect} 
                  disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
                >
                  Connect
                </Button>
                <Button 
                  onClick={disconnect} 
                  variant="destructive"
                  disabled={connectionStatus === 'disconnected'}
                >
                  Disconnect
                </Button>
                <Button onClick={handlePing} disabled={!isConnected} variant="outline">
                  Send Ping
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Direct WebSocket Test Results</CardTitle>
            <CardDescription>
              Results from direct WebSocket connection attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {receivedMessages.length > 0 ? (
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                <ul className="space-y-1">
                  {receivedMessages.map((msg, index) => (
                    <li key={index} className="text-sm border-b border-gray-100 pb-1">
                      {msg}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No messages received yet...
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Send Message</CardTitle>
            <CardDescription>
              Send a test message to the WebSocket server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={!isConnected}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!isConnected || !message.trim()}
              >
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>WebSocket Information</CardTitle>
            <CardDescription>
              Technical details about the WebSocket connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Direct WebSocket URL:</span>
                <code className="ml-2 p-1 bg-gray-100 rounded">ws://{window.location.host}/ws</code>
              </div>
              <div>
                <span className="font-semibold">Secure WebSocket URL:</span>
                <code className="ml-2 p-1 bg-gray-100 rounded">wss://{window.location.host}/ws</code>
              </div>
              <div>
                <span className="font-semibold">Host:</span>
                <code className="ml-2 p-1 bg-gray-100 rounded">{window.location.host}</code>
              </div>
              <div>
                <span className="font-semibold">Protocol:</span>
                <code className="ml-2 p-1 bg-gray-100 rounded">{window.location.protocol}</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}