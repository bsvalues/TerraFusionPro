import React, { useEffect, useState } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function WebSocketTestPage() {
  const realtime = useRealtime();
  const [messageToSend, setMessageToSend] = useState<string>('');
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<number>(10000);
  const [isReplitEnvironment, setIsReplitEnvironment] = useState<boolean>(false);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>('controls');
  
  // Check if we're in a Replit environment
  useEffect(() => {
    const hostname = window.location.hostname;
    const isReplit = hostname.includes('replit.dev');
    setIsReplitEnvironment(isReplit);
    
    if (isReplit) {
      setReceivedMessages((prev) => [
        ...prev,
        '📌 Replit environment detected',
        'Using optimized connection strategy for Replit',
        'Priority: Long Polling → SSE → WebSocket',
        '---'
      ]);
      
      // Listen for connection events to track attempts
      realtime.on('reconnect_attempt', (data) => {
        if (data.attempt) {
          setConnectionAttempts(data.attempt);
          setReceivedMessages((prev) => [
            ...prev, 
            `Connection attempt ${data.attempt}/${data.maxAttempts}: trying alternative methods...`
          ]);
        }
      });
      
      // Listen for connection status changes
      realtime.on('connected', (data) => {
        setReceivedMessages((prev) => [
          ...prev,
          `✅ Connected successfully using ${data.protocol || 'unknown'} protocol`
        ]);
      });
      
      realtime.on('disconnected', () => {
        setReceivedMessages((prev) => [
          ...prev,
          `❌ Disconnected, will automatically attempt reconnection`
        ]);
      });
      
      // Listen for connection failures
      realtime.on('connection_failed', () => {
        setReceivedMessages((prev) => [
          ...prev,
          `⚠️ All connection attempts failed, falling back to polling`,
          'Activating HTTP long polling fallback for more reliable connection'
        ]);
        
        // Auto-switch to polling mode after all connection attempts fail
        setTimeout(() => {
          realtime.forcePolling();
        }, 1000);
      });
    }
    
    // Cleanup event listeners on unmount
    return () => {
      realtime.off('reconnect_attempt', () => {});
      realtime.off('connected', () => {});
      realtime.off('disconnected', () => {});
      realtime.off('connection_failed', () => {});
    };
  }, [realtime]);
  
  // Status badge colors based on connection status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'polling':
        return 'bg-blue-500';
      case 'error':
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Subscribe to test messages
  const handleSubscribe = () => {
    // Generate a unique ID for this subscription
    const id = `test-subscription-${Date.now()}`;
    
    realtime.subscribe(id, {
      event: 'message',
      endpoint: '/api/test/messages',
      queryKey: ['messages'],
      intervalMs: pollInterval,
      callback: (data: any) => {
        setReceivedMessages((prev) => [...prev, `Received: ${JSON.stringify(data)}`]);
      }
    });
    
    setSubscriptionId(id);
    setReceivedMessages((prev) => [...prev, 'Subscribed to message events']);
  };
  
  // Unsubscribe from test messages
  const handleUnsubscribe = () => {
    if (subscriptionId) {
      realtime.unsubscribe(subscriptionId);
      setSubscriptionId(null);
      setReceivedMessages((prev) => [...prev, 'Unsubscribed from message events']);
    }
  };
  
  // Send a test message
  const handleSendMessage = () => {
    if (messageToSend.trim() !== '') {
      const success = realtime.send({
        type: 'message',
        content: messageToSend,
        timestamp: new Date().toISOString()
      });
      
      setReceivedMessages((prev) => [...prev, `Sent: ${messageToSend} (success: ${success})`]);
      setMessageToSend('');
    }
  };
  
  // Clear the message history
  const handleClearMessages = () => {
    setReceivedMessages([]);
  };
  
  // Update polling interval
  const handlePollIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 3000) {
      setPollInterval(value);
      setReceivedMessages((prev) => [...prev, `Updated polling interval to ${value}ms`]);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>WebSocket / Realtime Test</CardTitle>
              <CardDescription>
                Test the WebSocket connection and fallback strategies
              </CardDescription>
            </div>
            <Badge className={getStatusColor(realtime.connectionStatus)}>
              {realtime.connectionStatus}
            </Badge>
          </div>
        </CardHeader>

        {isReplitEnvironment && (
          <Alert className="mx-6 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Replit Environment Detected</AlertTitle>
            <AlertDescription>
              WebSockets face connection issues in Replit environments due to proxy settings.
              We've implemented a robust fallback strategy: Long Polling → SSE → WebSocket.
              Connection attempts: {connectionAttempts}/5
            </AlertDescription>
          </Alert>
        )}

        <CardContent>
          <div className="flex flex-col space-y-4">
            {/* Status section */}
            <div className="flex flex-col space-y-2">
              <h3 className="text-lg font-medium">Connection Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border rounded-md p-3 flex flex-col justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={getStatusColor(realtime.connectionStatus)}>
                    {realtime.connectionStatus}
                  </Badge>
                </div>
                <div className="border rounded-md p-3 flex flex-col justify-between">
                  <span className="text-sm text-muted-foreground">Protocol</span>
                  <span className="font-medium">{realtime.connectionMethod || 'None'}</span>
                </div>
                <div className="border rounded-md p-3 flex flex-col justify-between">
                  <span className="text-sm text-muted-foreground">Connected</span>
                  <span className="font-medium">{realtime.isConnected ? 'Yes' : 'No'}</span>
                </div>
                <div className="border rounded-md p-3 flex flex-col justify-between">
                  <span className="text-sm text-muted-foreground">Attempts</span>
                  <span className="font-medium">{connectionAttempts}/5</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Control section */}
            <div className="flex flex-col space-y-2">
              <h3 className="text-lg font-medium">Connection Controls</h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => realtime.connect()}
                >
                  Connect
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => realtime.disconnect()}
                >
                  Disconnect
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => realtime.forceWebSockets()}
                >
                  Force WebSockets
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => realtime.forcePolling()}
                >
                  Force Polling
                </Button>
              </div>
              
              <div className="flex items-center space-x-4 pt-2">
                <div className="grid grid-cols-2 gap-2 items-center">
                  <Label htmlFor="polling-interval">Polling Interval (ms)</Label>
                  <Input
                    id="polling-interval"
                    type="number"
                    min="3000"
                    step="1000"
                    value={pollInterval}
                    onChange={handlePollIntervalChange}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Subscription section */}
            <div className="flex flex-col space-y-2">
              <h3 className="text-lg font-medium">Subscription</h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleSubscribe}
                  disabled={!!subscriptionId}
                >
                  Subscribe
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleUnsubscribe}
                  disabled={!subscriptionId}
                >
                  Unsubscribe
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Message sending section */}
            <div className="flex flex-col space-y-2">
              <h3 className="text-lg font-medium">Send Message</h3>
              <div className="flex space-x-2">
                <Input
                  value={messageToSend}
                  onChange={(e) => setMessageToSend(e.target.value)}
                  placeholder="Enter a message to send"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>Send</Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Messages section */}
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Messages</h3>
                <Button variant="outline" size="sm" onClick={handleClearMessages}>Clear</Button>
              </div>
              <ScrollArea className="h-60 border rounded-md p-2">
                <div className="space-y-2">
                  {receivedMessages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No messages yet</p>
                  ) : (
                    receivedMessages.map((msg, i) => (
                      <div key={i} className="text-sm border-b pb-1">
                        {msg}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Fallback mechanism will automatically switch between WebSockets and HTTP polling as needed.
          </p>
          <Button variant="link" onClick={() => window.location.reload()}>Refresh Page</Button>
        </CardFooter>
      </Card>
    </div>
  );
}