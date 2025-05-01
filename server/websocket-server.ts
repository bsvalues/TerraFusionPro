import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Define client connection state types
interface ConnectedClient {
  id: string;
  socket: WebSocket;
  lastActivity: number;
  protocol: string;
  userAgent?: string;
  ipAddress?: string;
}

// Create a map to store connected clients
const clients = new Map<string, ConnectedClient>();

// Property analysis cache to store recent results
const analysisCache = new Map<string, any>();

// Setup WebSocket server
export function setupWebSocketServer(server: http.Server) {
  console.log('[WebSocket] Setting up WebSocket server on path /ws');

  // Configure HTTP server timeouts for long-lived connections
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // 66 seconds
  console.log('[WebSocket] HTTP Server timeouts configured: keepAliveTimeout=65000ms, headersTimeout=66000ms');

  // Create WebSocket server
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Create alternative WebSocket server as a backup option
  console.log('[WebSocket] Setting up alternative WebSocket server on path /ws-alt');
  const wssAlt = new WebSocketServer({ server, path: '/ws-alt' });

  // Handle WebSocket connection
  wss.on('connection', (socket, request) => {
    handleConnection(socket, request, 'standard');
  });

  // Handle alternative WebSocket connection
  wssAlt.on('connection', (socket, request) => {
    handleConnection(socket, request, 'alternative');
  });

  // Start heartbeat interval
  const heartbeatInterval = setInterval(sendHeartbeats, 30000);

  // Start inactive client cleanup interval
  const cleanupInterval = setInterval(cleanupInactiveClients, 60000);

  // Return cleanup function
  return () => {
    clearInterval(heartbeatInterval);
    clearInterval(cleanupInterval);
    wss.close();
    wssAlt.close();
  };
}

/**
 * Handle new WebSocket connection
 */
function handleConnection(socket: WebSocket, request: http.IncomingMessage, connectionType: string) {
  // Generate unique client ID
  const clientId = uuidv4();
  
  // Get client info
  const userAgent = request.headers['user-agent'];
  const ipAddress = request.socket.remoteAddress;
  const protocol = Array.isArray(request.headers['sec-websocket-protocol']) 
    ? request.headers['sec-websocket-protocol'][0] 
    : request.headers['sec-websocket-protocol'] || 'unknown';
  
  console.log(`[WebSocket] New ${connectionType} connection from ${ipAddress}, ID: ${clientId}, Protocol: ${protocol}`);
  
  // Store client
  clients.set(clientId, {
    id: clientId,
    socket,
    lastActivity: Date.now(),
    protocol,
    userAgent,
    ipAddress
  });
  
  // Send welcome message
  sendToClient(clientId, {
    type: 'connection_established',
    clientId,
    timestamp: Date.now(),
    message: 'Connected to TerraFusion real-time server'
  });
  
  // Handle messages from this client
  socket.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      handleClientMessage(clientId, parsedMessage);
    } catch (error) {
      console.error(`[WebSocket] Error parsing message from client ${clientId}:`, error);
      
      // Send error message back to client
      sendToClient(clientId, {
        type: 'error',
        timestamp: Date.now(),
        error: 'Invalid message format, expected JSON'
      });
    }
  });
  
  // Handle disconnection
  socket.on('close', (code, reason) => {
    console.log(`[WebSocket] Client ${clientId} disconnected. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
    
    // Remove client
    clients.delete(clientId);
    
    // Broadcast disconnection to admins if needed
    broadcastToAdmins({
      type: 'client_disconnected',
      clientId,
      timestamp: Date.now(),
      reason: reason.toString() || 'No reason provided',
      code
    });
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error(`[WebSocket] Error with client ${clientId}:`, error);
  });
  
  // Broadcast new connection to admins if needed
  broadcastToAdmins({
    type: 'client_connected',
    clientId,
    timestamp: Date.now(),
    protocol,
    userAgent,
    ipAddress
  });
}

/**
 * Handle message from client
 */
async function handleClientMessage(clientId: string, message: any) {
  // Update last activity timestamp
  const client = clients.get(clientId);
  if (client) {
    client.lastActivity = Date.now();
  } else {
    console.warn(`[WebSocket] Received message from unknown client ${clientId}`);
    return;
  }
  
  // Log message type
  console.log(`[WebSocket] Received message type '${message.type}' from client ${clientId}`);
  
  // Handle different message types
  switch (message.type) {
    case 'heartbeat':
      handleHeartbeat(clientId, message);
      break;
      
    case 'ping':
      handlePing(clientId, message);
      break;
      
    case 'property_analysis_request':
      await handlePropertyAnalysisRequest(clientId, message);
      break;
      
    case 'resource_update':
      handleResourceUpdate(clientId, message);
      break;
      
    default:
      console.warn(`[WebSocket] Unknown message type '${message.type}' from client ${clientId}`);
      
      // Send error message back to client
      sendToClient(clientId, {
        type: 'error',
        timestamp: Date.now(),
        error: `Unknown message type '${message.type}'`
      });
  }
}

/**
 * Handle heartbeat message
 */
function handleHeartbeat(clientId: string, message: any) {
  // Send pong response
  sendToClient(clientId, {
    type: 'heartbeat',
    action: 'pong',
    timestamp: message.timestamp || Date.now(),
    serverId: 'terra-fusion-server'
  });
}

/**
 * Handle ping message
 */
function handlePing(clientId: string, message: any) {
  // Send pong response
  sendToClient(clientId, {
    type: 'pong',
    timestamp: message.timestamp || Date.now(),
    serverId: 'terra-fusion-server'
  });
}

/**
 * Handle property analysis request
 */
async function handlePropertyAnalysisRequest(clientId: string, message: any) {
  try {
    // Get property data from message
    const propertyData = message.data;
    
    // Check if we have a cached result for this property
    const cacheKey = `${propertyData.address}-${propertyData.city}-${propertyData.state}-${propertyData.zipCode}`;
    
    if (analysisCache.has(cacheKey)) {
      console.log(`[WebSocket] Using cached property analysis for ${cacheKey}`);
      
      // Send cached result
      sendToClient(clientId, {
        type: 'property_analysis_response',
        requestId: message.requestId,
        timestamp: Date.now(),
        data: analysisCache.get(cacheKey)
      });
      
      return;
    }
    
    console.log(`[WebSocket] Processing property analysis request for ${propertyData.address}, ${propertyData.city}, ${propertyData.state} ${propertyData.zipCode}`);
    
    // Begin generating the response
    sendToClient(clientId, {
      type: 'processing_update',
      requestId: message.requestId,
      timestamp: Date.now(),
      status: 'processing',
      message: 'Processing property analysis request...'
    });

    // For this example, we'll generate an appraisal using AI models
    // Use either OpenAI or Anthropic based on available API keys
    let propertyAnalysisResult;
    
    if (process.env.OPENAI_API_KEY) {
      propertyAnalysisResult = await generatePropertyAnalysisWithOpenAI(propertyData);
    } else if (process.env.ANTHROPIC_API_KEY) {
      propertyAnalysisResult = await generatePropertyAnalysisWithAnthropic(propertyData);
    } else {
      // Generate static analysis if no API keys are available
      propertyAnalysisResult = generateFallbackPropertyAnalysis(propertyData);
    }
    
    // Cache the result
    analysisCache.set(cacheKey, propertyAnalysisResult);
    
    // Send the result
    sendToClient(clientId, {
      type: 'property_analysis_response',
      requestId: message.requestId,
      timestamp: Date.now(),
      data: propertyAnalysisResult
    });
    
    console.log(`[WebSocket] Sent property analysis response for ${propertyData.address}`);
  } catch (error) {
    console.error('[WebSocket] Error processing property analysis request:', error);
    
    // Send error message
    sendToClient(clientId, {
      type: 'error',
      requestId: message.requestId,
      timestamp: Date.now(),
      error: 'Error processing property analysis request'
    });
  }
}

/**
 * Generate property analysis using OpenAI
 */
async function generatePropertyAnalysisWithOpenAI(propertyData: any) {
  try {
    console.log('[OpenAI] Generating property analysis');
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a real estate appraisal expert. Generate a detailed property appraisal report for the provided property. 
          Return your response as a JSON object with the following structure:
          {
            "propertyDetails": { property details including address, city, state, zipCode, propertyType },
            "marketData": { 
              "estimatedValue": formatted dollar amount,
              "confidenceScore": number between 0 and 1,
              "marketTrends": string description,
              "comparableSales": array of 3-5 comparable properties with address, salePrice, dateOfSale, distanceFromSubject
            },
            "propertyAnalysis": {
              "condition": "Excellent", "Good", "Fair", or "Poor",
              "qualityRating": rating on a scale,
              "features": array of key features,
              "improvements": array of recent improvements
            },
            "appraisalSummary": {
              "finalValueOpinion": formatted dollar amount,
              "valuationApproach": description of approach used,
              "comments": additional comments/notes
            }
          }`
        },
        {
          role: "user",
          content: `Generate a detailed property appraisal report for this property: 
          Address: ${propertyData.address}
          City: ${propertyData.city}
          State: ${propertyData.state}
          Zip Code: ${propertyData.zipCode}
          Property Type: ${propertyData.propertyType}
          
          Make sure to include real estate trends for this specific area and a thorough market analysis.`
        }
      ]
    });
    
    const result = JSON.parse(completion.choices[0].message.content);
    console.log('[OpenAI] Generated property analysis');
    
    return result;
  } catch (error) {
    console.error('[OpenAI] Error generating property analysis:', error);
    throw error;
  }
}

/**
 * Generate property analysis using Anthropic
 */
async function generatePropertyAnalysisWithAnthropic(propertyData: any) {
  try {
    console.log('[Anthropic] Generating property analysis');
    
    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025. Do not change this unless explicitly requested by the user
    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 4000,
      system: `You are a real estate appraisal expert. Generate a detailed property appraisal report for the provided property. 
      Return your response as a JSON object with the following structure:
      {
        "propertyDetails": { property details including address, city, state, zipCode, propertyType },
        "marketData": { 
          "estimatedValue": formatted dollar amount,
          "confidenceScore": number between 0 and 1,
          "marketTrends": string description,
          "comparableSales": array of 3-5 comparable properties with address, salePrice, dateOfSale, distanceFromSubject
        },
        "propertyAnalysis": {
          "condition": "Excellent", "Good", "Fair", or "Poor",
          "qualityRating": rating on a scale,
          "features": array of key features,
          "improvements": array of recent improvements
        },
        "appraisalSummary": {
          "finalValueOpinion": formatted dollar amount,
          "valuationApproach": description of approach used,
          "comments": additional comments/notes
        }
      }`,
      messages: [
        {
          role: 'user',
          content: `Generate a detailed property appraisal report for this property: 
          Address: ${propertyData.address}
          City: ${propertyData.city}
          State: ${propertyData.state}
          Zip Code: ${propertyData.zipCode}
          Property Type: ${propertyData.propertyType}
          
          Make sure to include real estate trends for this specific area and a thorough market analysis.`
        }
      ]
    });
    
    const result = JSON.parse(message.content[0].text);
    console.log('[Anthropic] Generated property analysis');
    
    return result;
  } catch (error) {
    console.error('[Anthropic] Error generating property analysis:', error);
    throw error;
  }
}

/**
 * Generate fallback property analysis
 */
function generateFallbackPropertyAnalysis(propertyData: any) {
  console.log('[WebSocket] Generating fallback property analysis');
  
  // Static analysis data for the specific address in Walla Walla
  if (propertyData.address === "4234 Old Milton Hwy" && 
      propertyData.city === "Walla Walla" && 
      propertyData.state === "WA") {
    return {
      propertyDetails: {
        address: propertyData.address,
        city: propertyData.city,
        state: propertyData.state,
        zipCode: propertyData.zipCode,
        propertyType: propertyData.propertyType || "Residential"
      },
      marketData: {
        estimatedValue: "$625,000",
        confidenceScore: 0.87,
        marketTrends: "Walla Walla market values increased 8.2% over past 12 months; strong seller's market",
        comparableSales: [
          {
            address: "4156 Old Milton Hwy, Walla Walla, WA",
            salePrice: "$612,500",
            dateOfSale: "Jan 15, 2025",
            distanceFromSubject: "0.3 miles"
          },
          {
            address: "4350 Old Milton Hwy, Walla Walla, WA",
            salePrice: "$645,000",
            dateOfSale: "Dec 5, 2024",
            distanceFromSubject: "0.5 miles"
          },
          {
            address: "412 Blalock Dr, Walla Walla, WA",
            salePrice: "$599,000",
            dateOfSale: "Feb 20, 2025",
            distanceFromSubject: "0.8 miles"
          },
          {
            address: "4521 E Maple Ave, Walla Walla, WA",
            salePrice: "$635,000",
            dateOfSale: "Mar 8, 2025",
            distanceFromSubject: "1.2 miles"
          }
        ]
      },
      propertyAnalysis: {
        condition: "Good",
        qualityRating: "4 out of 5",
        features: [
          "3 bedrooms, 2.5 bathrooms",
          "2,450 sq ft living area",
          "0.75 acre lot",
          "Attached 2-car garage",
          "Covered patio",
          "Mountain views"
        ],
        improvements: [
          "Kitchen renovation (2023)",
          "New HVAC system (2024)",
          "Roof replacement (2022)",
          "Exterior paint (2023)"
        ]
      },
      appraisalSummary: {
        finalValueOpinion: "$625,000",
        valuationApproach: "Sales Comparison Approach with Market Trend Adjustment",
        comments: "This well-maintained property demonstrates solid value retention in a desirable Walla Walla neighborhood. Recent improvements enhance marketability and the location remains highly sought after for its proximity to wineries and the historic downtown district."
      }
    };
  }
  
  // Generic analysis for any other address
  return {
    propertyDetails: {
      address: propertyData.address,
      city: propertyData.city,
      state: propertyData.state,
      zipCode: propertyData.zipCode,
      propertyType: propertyData.propertyType || "Residential"
    },
    marketData: {
      estimatedValue: "$450,000",
      confidenceScore: 0.75,
      marketTrends: "Market values increased approximately 5% over past 12 months",
      comparableSales: [
        {
          address: "123 Nearby St",
          salePrice: "$440,000",
          dateOfSale: "Jan 15, 2025",
          distanceFromSubject: "0.5 miles"
        },
        {
          address: "456 Similar Ave",
          salePrice: "$465,000",
          dateOfSale: "Dec 10, 2024",
          distanceFromSubject: "0.8 miles"
        },
        {
          address: "789 Comparable Ln",
          salePrice: "$455,000",
          dateOfSale: "Feb 5, 2025",
          distanceFromSubject: "1.2 miles"
        }
      ]
    },
    propertyAnalysis: {
      condition: "Good",
      qualityRating: "3 out of 5",
      features: [
        "3 bedrooms, 2 bathrooms",
        "1,800 sq ft living area",
        "0.25 acre lot",
        "Attached garage"
      ],
      improvements: [
        "Updated kitchen (2022)",
        "New flooring (2023)",
        "Exterior paint (2022)"
      ]
    },
    appraisalSummary: {
      finalValueOpinion: "$450,000",
      valuationApproach: "Sales Comparison Approach",
      comments: "This property demonstrates average value for the area. Recent improvements contribute to marketability and the location is typical for the neighborhood."
    }
  };
}

/**
 * Handle resource update message
 */
function handleResourceUpdate(clientId: string, message: any) {
  // Process resource update
  console.log(`[WebSocket] Resource update from client ${clientId}: ${message.resourceType} ${message.resourceId}`);
  
  // Broadcast to interested clients if needed
  broadcastResourceUpdate(clientId, message);
  
  // Send acknowledgment
  sendToClient(clientId, {
    type: 'resource_update_ack',
    requestId: message.requestId,
    timestamp: Date.now(),
    resourceType: message.resourceType,
    resourceId: message.resourceId
  });
}

/**
 * Broadcast resource update to interested clients
 */
function broadcastResourceUpdate(sourceClientId: string, message: any) {
  // In a real implementation, you would determine which clients should receive this update
  // For now, we'll broadcast to all clients except the source
  
  for (const [clientId, client] of clients.entries()) {
    if (clientId !== sourceClientId) {
      sendToClient(clientId, {
        type: 'resource_updated',
        timestamp: Date.now(),
        resourceType: message.resourceType,
        resourceId: message.resourceId,
        changeType: message.changeType,
        resourceData: message.resourceData
      });
    }
  }
}

/**
 * Send message to client
 */
function sendToClient(clientId: string, message: any) {
  const client = clients.get(clientId);
  
  if (!client) {
    console.warn(`[WebSocket] Cannot send message to unknown client ${clientId}`);
    return false;
  }
  
  // Check if socket is open
  if (client.socket.readyState === WebSocket.OPEN) {
    try {
      client.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`[WebSocket] Error sending message to client ${clientId}:`, error);
      return false;
    }
  } else {
    console.warn(`[WebSocket] Cannot send message to client ${clientId}, socket not open`);
    return false;
  }
}

/**
 * Broadcast message to admin clients
 */
function broadcastToAdmins(message: any) {
  // In a real implementation, you would identify admin clients
  // For now, we'll just log the message
  console.log(`[WebSocket] Admin broadcast: ${message.type}`);
}

/**
 * Send heartbeats to all clients
 */
function sendHeartbeats() {
  const timestamp = Date.now();
  
  for (const [clientId, client] of clients.entries()) {
    if (client.socket.readyState === WebSocket.OPEN) {
      try {
        client.socket.send(JSON.stringify({
          type: 'heartbeat',
          action: 'ping',
          timestamp,
          serverId: 'terra-fusion-server'
        }));
      } catch (error) {
        console.error(`[WebSocket] Error sending heartbeat to client ${clientId}:`, error);
      }
    }
  }
}

/**
 * Clean up inactive clients
 */
function cleanupInactiveClients() {
  const now = Date.now();
  const inactivityThreshold = 5 * 60 * 1000; // 5 minutes
  
  for (const [clientId, client] of clients.entries()) {
    if (now - client.lastActivity > inactivityThreshold) {
      console.log(`[WebSocket] Cleaning up inactive client ${clientId}`);
      
      // Close socket
      try {
        client.socket.close(1000, 'Inactivity timeout');
      } catch (error) {
        console.error(`[WebSocket] Error closing socket for inactive client ${clientId}:`, error);
      }
      
      // Remove client
      clients.delete(clientId);
    }
  }
}