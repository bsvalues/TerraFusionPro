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

export default function WebSocketTestPage() {
  const realtime = useRealtime();
  const [messageToSend, setMessageToSend] = useState<string>('');
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<number>(10000);
  
  // Force polling mode by default since WebSockets keep failing
  useEffect(() => {
    // Immediately force polling mode without waiting for WebSocket failures
    const timer = setTimeout(() => {
      console.log('Forcing polling mode for better reliability');
      
      // Force polling mode
      try {
        realtime.forcePolling();
        setReceivedMessages([
          'Auto-switched to polling mode due to known WebSocket issues in Replit environment',
          `Current connection method: ${realtime.connectionMethod}`,
          `Current connection status: ${realtime.connectionStatus}`
        ]);
      } catch (err) {
        console.error('Error switching to polling mode:', err);
      }
    }, 500);
    
    return () => clearTimeout(timer);
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
      callback: (data) => {
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
          <CardTitle>WebSocket / Realtime Test</CardTitle>
          <CardDescription>
            Test the WebSocket connection and polling fallback functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {/* Status section */}
            <div className="flex flex-col space-y-2">
              <h3 className="text-lg font-medium">Connection Status</h3>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(realtime.connectionStatus)}>
                  {realtime.connectionStatus}
                </Badge>
                <span className="text-sm">
                  Method: {realtime.connectionMethod}
                </span>
                <span className="text-sm">
                  Connected: {realtime.isConnected ? 'Yes' : 'No'}
                </span>
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