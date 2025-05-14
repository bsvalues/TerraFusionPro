import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBasicWebSocket } from '../../contexts/BasicWebSocketContext';

const BasicWebSocketTestLink: React.FC = () => {
  const { connected } = useBasicWebSocket();
  const [statusText, setStatusText] = useState('Disconnected');
  const [reconnectCount, setReconnectCount] = useState(0);

  // Update status text based on connection state
  useEffect(() => {
    if (connected) {
      setStatusText('Connected');
      setReconnectCount(0);
    } else {
      setReconnectCount(prev => {
        const newCount = prev + 1;
        if (newCount === 1) {
          setStatusText('Disconnected');
        } else {
          setStatusText(`Retrying (${newCount})`);
        }
        return newCount;
      });
    }
  }, [connected]);

  // Pulsing animation for connecting status
  const isPulsing = !connected && reconnectCount > 0;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/basic-ws-test">
            <Button 
              variant="outline" 
              size="sm" 
              className={`flex items-center gap-2 ${
                connected ? 'border-green-500' : 
                isPulsing ? 'border-yellow-500' : 'border-red-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                connected ? 'bg-green-500' : 
                isPulsing ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
              }`}></span>
              WS Test
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>WebSocket Status: {statusText}</p>
          {!connected && (
            <p className="text-xs text-gray-500">
              Using fallback polling connection
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BasicWebSocketTestLink;