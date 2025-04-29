import React, { useEffect, useState } from 'react';
import { createWebSocketConnection } from '../lib/websocket';

export default function CompsSearchPage() {
  console.log("Basic CompsSearchPage rendering");
  const [connectionStatus, setConnectionStatus] = useState('Not connected');
  
  useEffect(() => {
    console.log("CompsSearchPage useEffect running");
    
    // Don't create WebSocket connection in this simplified version
    // Just set a success status after a short delay to simulate connection
    const timer = setTimeout(() => {
      setConnectionStatus('Connection simulated (WebSockets disabled)');
    }, 1000);
    
    return () => {
      clearTimeout(timer);
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