import React, { useEffect, useState } from 'react';
import { createWebSocketConnection } from '../lib/websocket';

export default function CompsSearchPage() {
  console.log("Basic CompsSearchPage rendering");
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  
  useEffect(() => {
    console.log("CompsSearchPage useEffect running");
    
    // Create a WebSocket connection to the server
    const socket = createWebSocketConnection('/ws');
    
    if (socket) {
      // Set up event handlers
      socket.onopen = () => {
        console.log("WebSocket connection established");
        setConnectionStatus('Connected to server');
      };
      
      socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code}`);
        setConnectionStatus(`Disconnected (Code: ${event.code})`);
      };
      
      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus('Connection error');
      };
      
      // Send a test message
      socket.addEventListener('open', () => {
        socket.send(JSON.stringify({
          type: 'register',
          client: 'comps-search',
          timestamp: Date.now()
        }));
      });
    } else {
      setConnectionStatus('WebSocket not available');
    }
    
    return () => {
      // Clean up the WebSocket connection when component unmounts
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      console.log("CompsSearchPage cleanup");
    };
  }, []);
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Comparable Property Search</h1>
      <p>Search and analyze comparable properties in your market area</p>
      
      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f0f9ff', 
          border: '1px solid #bae6fd',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <p>WebSocket Status: <span style={{ fontWeight: 'bold' }}>{connectionStatus}</span></p>
        </div>
        
        <button 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#4f46e5', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Search Properties
        </button>
      </div>
    </div>
  );
}