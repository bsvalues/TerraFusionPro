import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useBasicWebSocket } from '../../contexts/BasicWebSocketContext';

const BasicWebSocketTestLink: React.FC = () => {
  const { connected } = useBasicWebSocket();

  return (
    <Link href="/basic-ws-test">
      <Button 
        variant="outline" 
        size="sm" 
        className={`flex items-center gap-2 ${connected ? 'border-green-500' : 'border-red-500'}`}
      >
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
        WebSocket Test
      </Button>
    </Link>
  );
};

export default BasicWebSocketTestLink;