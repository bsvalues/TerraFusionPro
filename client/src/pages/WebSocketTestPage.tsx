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
  
  // Track which WebSocket URLs we've tried
  const [testedUrls, setTestedUrls] = useState<{[url: string]: {status: string, message: string, timestamp: number}}>({});
  
  // Function to test a specific WebSocket URL
  const testWebSocketUrl = (url: string) => {
    try {
      setTestedUrls(prev => ({
        ...prev,
        [url]: { status: 'connecting', message: 'Attempting to connect...', timestamp: Date.now() }
      }));
      
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log(`Direct WebSocket connection opened on ${url}`);
        setReceivedMessages(prev => [...prev, `✅ Connected to ${url}`]);
        setTestedUrls(prev => ({
          ...prev,
          [url]: { status: 'connected', message: 'Connection successful', timestamp: Date.now() }
        }));
        
        // Send a test message
        try {
          ws.send(JSON.stringify({
            type: 'hello',
            message: 'Test connection',
            timestamp: Date.now()
          }));
        } catch (err) {
          console.error(`Error sending test message to ${url}:`, err);
        }
        
        // Close after 5 seconds
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close(1000, 'Test completed');
          }
        }, 5000);
      };
      
      ws.onclose = (event) => {
        console.log(`Direct WebSocket connection closed for ${url}:`, event.code, event.reason);
        setReceivedMessages(prev => [...prev, `❌ Disconnected from ${url}: ${event.code} ${event.reason || 'No reason'}`]);
        
        if (event.code !== 1000) {
          setTestedUrls(prev => ({
            ...prev,
            [url]: { 
              status: 'error', 
              message: `Closed with code ${event.code}: ${event.reason || 'No reason provided'}`, 
              timestamp: Date.now() 
            }
          }));
        } else {
          setTestedUrls(prev => ({
            ...prev,
            [url]: { 
              status: 'disconnected', 
              message: 'Test completed successfully', 
              timestamp: Date.now() 
            }
          }));
        }
      };
      
      ws.onerror = (error) => {
        console.error(`Direct WebSocket error for ${url}:`, error);
        setReceivedMessages(prev => [...prev, `❌ Error connecting to ${url}`]);
        setTestedUrls(prev => ({
          ...prev,
          [url]: { status: 'error', message: 'Connection error occurred', timestamp: Date.now() }
        }));
      };
      
      ws.onmessage = (event) => {
        console.log(`Direct message received from ${url}:`, event.data);
        setReceivedMessages(prev => [...prev, `📨 Message from ${url}: ${event.data}`]);
        setTestedUrls(prev => ({
          ...prev, 
          [url]: { 
            ...prev[url],
            message: `Connected and receiving messages: ${event.data.substring(0, 30)}${event.data.length > 30 ? '...' : ''}` 
          }
        }));
      };
      
      return ws;
    } catch (e) {
      console.error(`Failed to connect to ${url}:`, e);
      setReceivedMessages(prev => [...prev, `❌ Failed to initialize connection to ${url}: ${e.message}`]);
      setTestedUrls(prev => ({
        ...prev,
        [url]: { status: 'error', message: `Failed to initialize: ${e.message}`, timestamp: Date.now() }
      }));
      return null;
    }
  };
  
  // Initial test run
  useEffect(() => {
    // Create a WebSocket directly as a test - try multiple endpoints
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Try all possible variations
    const wsUrls = [
      // Standard endpoint (main server)
      `${protocol}//${window.location.host}/ws`,
      // Direct port 5000 endpoint (Express server)
      `${protocol}//${hostname}:5000/ws`,
    ];
    
    console.log('Trying WebSocket connections with these URLs:', wsUrls);
    setReceivedMessages(prev => [...prev, `Attempting to connect to ${wsUrls.join(', ')}`]);
    
    // Test each URL with a delay between attempts
    let connections: (WebSocket | null)[] = [];
    let index = 0;
    
    const testNextUrl = () => {
      if (index < wsUrls.length) {
        const ws = testWebSocketUrl(wsUrls[index]);
        if (ws) connections.push(ws);
        index++;
        setTimeout(testNextUrl, 2000); // Wait 2 seconds between connection attempts
      }
    };
    
    testNextUrl();
    
    // Clean up
    return () => {
      connections.forEach(ws => {
        if (ws && ws.readyState !== WebSocket.CLOSED) {
          try {
            ws.close();
          } catch (e) {
            console.error('Error closing test connection:', e);
          }
        }
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
  
  const handleHeartbeat = () => {
    send({
      type: 'heartbeat',
      action: 'ping',
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
              
              <div className="bg-gray-50 p-3 rounded border border-gray-200 mt-2">
                <h4 className="text-sm font-medium mb-2">Heartbeat Status</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>Last Heartbeat: <strong>{lastPing ? formatTime(lastPing) : 'Never'}</strong></div>
                  <div>Status: 
                    <strong className={`ml-1 ${lastPing && (Date.now() - lastPing) < 30000 ? 'text-green-500' : 'text-red-500'}`}>
                      {lastPing && (Date.now() - lastPing) < 30000 ? 'Healthy' : 'Timeout'}
                    </strong>
                  </div>
                </div>
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
                <Button onClick={handleHeartbeat} disabled={!isConnected} variant="outline">
                  Send Heartbeat
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>WebSocket Test URLs</CardTitle>
            <CardDescription>
              Test different WebSocket endpoints to diagnose connection issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => testWebSocketUrl(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//` + window.location.host + '/ws')}
                  variant="outline" 
                  size="sm"
                >
                  Test Default URL
                </Button>
                <Button 
                  onClick={() => testWebSocketUrl(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//` + window.location.hostname + ':5000/ws')}
                  variant="outline" 
                  size="sm"
                >
                  Test Port 5000
                </Button>
                <Button 
                  onClick={() => testWebSocketUrl(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//` + window.location.hostname + '/ws')}
                  variant="outline" 
                  size="sm"
                >
                  Test Hostname Only
                </Button>
              </div>
              
              <div className="space-y-2 mt-2">
                {Object.entries(testedUrls).length > 0 ? (
                  <div className="border rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">URL</th>
                          <th className="p-2 text-left">Status</th>
                          <th className="p-2 text-left">Message</th>
                          <th className="p-2 text-left">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(testedUrls).map(([url, data], i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="p-2 font-mono text-xs truncate max-w-[150px]">{url}</td>
                            <td className="p-2">
                              <Badge 
                                className={`${
                                  data.status === 'connected' ? 'bg-green-500' : 
                                  data.status === 'connecting' ? 'bg-yellow-500' : 
                                  data.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                                } text-white`}
                              >
                                {data.status}
                              </Badge>
                            </td>
                            <td className="p-2 truncate max-w-[200px]">{data.message}</td>
                            <td className="p-2 text-xs">{formatTime(data.timestamp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-4 text-gray-500 bg-gray-50 rounded border">
                    No tests run yet. Click one of the buttons above to test a WebSocket endpoint.
                  </div>
                )}
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
                <span className="font-semibold">Hostname:</span>
                <code className="ml-2 p-1 bg-gray-100 rounded">{window.location.hostname}</code>
              </div>
              <div>
                <span className="font-semibold">Port:</span>
                <code className="ml-2 p-1 bg-gray-100 rounded">{window.location.port || '(default)'}</code>
              </div>
              <div>
                <span className="font-semibold">Protocol:</span>
                <code className="ml-2 p-1 bg-gray-100 rounded">{window.location.protocol}</code>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>WebSocket Connection Troubleshooting</CardTitle>
            <CardDescription>
              Common issues and solutions for WebSocket connectivity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Common Error Codes:</h4>
                <ul className="list-disc pl-5 mt-1 text-sm space-y-1">
                  <li><strong>1006 (Abnormal Closure):</strong> Connection was closed abnormally, potentially due to network issues, proxy/firewall issues, or server problems.</li>
                  <li><strong>1001 (Going Away):</strong> Server is shutting down or browser navigating away.</li>
                  <li><strong>1011 (Internal Error):</strong> Server encountered an unexpected condition.</li>
                  <li><strong>1008 (Policy Violation):</strong> Message received doesn't conform to its policy.</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">Possible Solutions:</h4>
                <ul className="list-disc pl-5 mt-1 text-sm space-y-1">
                  <li>Ensure server is running and the WebSocket endpoint is correctly configured.</li>
                  <li>Check for network issues, proxies, or firewalls blocking WebSocket connections.</li>
                  <li>Verify correct ports are open and accessible.</li>
                  <li>Try different connection URLs (as provided above).</li>
                  <li>Check server logs for any errors related to WebSocket connections.</li>
                  <li>Ensure secure WebSockets (wss://) are used with HTTPS sites.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}