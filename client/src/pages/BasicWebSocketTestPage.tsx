import React, { useState } from 'react';
import { useBasicWebSocket } from '../contexts/BasicWebSocketContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const BasicWebSocketTestPage: React.FC = () => {
  const { connected, messages, sendMessage, lastMessage } = useBasicWebSocket();
  const [messageText, setMessageText] = useState('');

  const handleSendMessage = () => {
    if (messageText.trim()) {
      sendMessage({
        type: 'chat',
        message: messageText,
        timestamp: Date.now()
      });
      setMessageText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Basic WebSocket Test
            <Badge variant={connected ? "success" : "destructive"}>
              {connected ? "Connected" : "Disconnected"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Testing the reliable WebSocket implementation on /basic-ws endpoint
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button 
                onClick={() => sendMessage({ type: 'ping', timestamp: Date.now() })}
                disabled={!connected}
              >
                Send Ping
              </Button>
              
              <Button 
                onClick={() => sendMessage({ type: 'echo', message: 'Hello WebSocket Server!', timestamp: Date.now() })}
                variant="outline"
                disabled={!connected}
              >
                Send Echo
              </Button>
            </div>
            
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="text-sm font-medium mb-2">Last Message:</h3>
              {lastMessage ? (
                <pre className="text-xs bg-card p-2 rounded overflow-x-auto">
                  {JSON.stringify(lastMessage, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground italic">No messages received yet</p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Message History:</h3>
              <ScrollArea className="h-60 rounded-md border">
                {messages.length > 0 ? (
                  <div className="p-4 space-y-2">
                    {messages.map((msg, idx) => (
                      <div key={idx} className="rounded bg-card p-2 text-xs">
                        <div className="flex justify-between text-muted-foreground mb-1">
                          <span>{msg.type}</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <pre className="overflow-x-auto">
                          {JSON.stringify(msg, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground italic">
                    No message history
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <div className="flex w-full space-x-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message to send..."
              disabled={!connected}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!connected || !messageText.trim()}>
              Send
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BasicWebSocketTestPage;