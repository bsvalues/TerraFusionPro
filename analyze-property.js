// This script will utilize the TerraFusion websocket server to analyze a property

import WebSocket from 'ws';

const propertyToAnalyze = {
  address: "406 Stardust Ct",
  city: "Grandview",
  state: "WA",
  zipCode: "98930",
  propertyType: "residential"
};

// Create a WebSocket connection to our server
const ws = new WebSocket('ws://localhost:5000/ws');

// Generate a unique client and request ID
const clientId = `test_client_${Date.now()}`;
const requestId = `request_${Date.now()}`;

ws.on('open', function open() {
  console.log('WebSocket connection established');
  
  // Send the property analysis request
  const message = {
    type: 'property_analysis_request',
    clientId: clientId,
    requestId: requestId,
    timestamp: Date.now(),
    data: propertyToAnalyze
  };
  
  console.log(`Analyzing property: ${propertyToAnalyze.address}, ${propertyToAnalyze.city}, ${propertyToAnalyze.state} ${propertyToAnalyze.zipCode}`);
  ws.send(JSON.stringify(message));
});

ws.on('message', function incoming(data) {
  const message = JSON.parse(data.toString());
  
  if (message.type === 'property_analysis_response' && message.requestId === requestId) {
    console.log('Property Analysis Results:');
    console.log(JSON.stringify(message.data, null, 2));
    
    // Close the connection after receiving the response
    ws.close();
  } else {
    console.log('Received message:', message.type);
  }
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err.message);
});

ws.on('close', function close() {
  console.log('WebSocket connection closed');
});

// Automatically close after 15 seconds if no response is received
setTimeout(() => {
  if (ws.readyState === WebSocket.OPEN) {
    console.log('No response received within timeout period. Closing connection.');
    ws.close();
  }
}, 15000);

console.log('Connecting to TerraFusion WebSocket server...');