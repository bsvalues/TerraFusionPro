import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BadgeDollarSign, BarChart3, Home, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface PropertyData {
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt: number;
  lotSize: number;
  features: { name: string }[];
  condition: string;
}

interface PropertyAnalysisResult {
  estimatedValue: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  valueRange: {
    min: number;
    max: number;
  };
  adjustments: Array<{
    factor: string;
    description: string;
    amount: number;
    reasoning: string;
  }>;
  marketAnalysis: string;
  comparableAnalysis: string;
  valuationMethodology: string;
}

interface WSMessage {
  type: string;
  payload: any;
}

// Sample property data for 406 Stardust Ct, Grandview, WA
const sampleProperty: PropertyData = {
  address: {
    street: '406 Stardust Ct',
    city: 'Grandview',
    state: 'WA',
    zipCode: '98930'
  },
  propertyType: 'Single Family',
  bedrooms: 4,
  bathrooms: 2.5,
  squareFeet: 2800,
  yearBuilt: 2005,
  lotSize: 0.35,
  features: [
    { name: 'Granite Countertops' },
    { name: 'Hardwood Floors' },
    { name: 'Finished Basement' },
    { name: 'Deck' }
  ],
  condition: 'Good'
};

const PropertyAnalysisSocket = () => {
  // State for connection status and progress
  const [connected, setConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PropertyAnalysisResult | null>(null);
  const [useWebSockets, setUseWebSockets] = useState(true);
  const [requestId, setRequestId] = useState<string | null>(null);
  
  // WebSocket reference
  const socketRef = useRef<WebSocket | null>(null);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Connect to WebSocket server
  const connectWebSocket = useCallback(() => {
    if (socketRef.current?.readyState === 1) {
      console.log('WebSocket already connected');
      return;
    }
    
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      socketRef.current = new WebSocket(wsUrl);
      
      socketRef.current.onopen = () => {
        console.log('WebSocket connection established');
        setConnected(true);
        setError(null);
      };
      
      socketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;
          console.log('Received WebSocket message:', message);
          
          switch (message.type) {
            case 'connection_established':
              setClientId(message.payload.clientId);
              break;
              
            case 'property_analysis_started':
              setRequestId(message.payload.requestId);
              setLoading(true);
              setProgress(10);
              setStatusMessage('Analysis started...');
              break;
              
            case 'property_analysis_progress':
              setProgress(message.payload.progress);
              setStatusMessage(message.payload.status);
              break;
              
            case 'property_analysis_complete':
              setLoading(false);
              setProgress(100);
              setStatusMessage('Analysis complete');
              setAnalysisResult(message.payload.result);
              break;
              
            case 'property_analysis_error':
              setLoading(false);
              setError(message.payload.error);
              break;
              
            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Failed to connect to WebSocket server');
        setConnected(false);
      };
      
      socketRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        setConnected(false);
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (useWebSockets) {
            connectWebSocket();
          }
        }, 5000);
      };
    } catch (err) {
      console.error('Error setting up WebSocket:', err);
      setError('Failed to set up WebSocket connection');
      setConnected(false);
    }
  }, [useWebSockets]);
  
  // Initialize WebSocket on component mount
  useEffect(() => {
    if (useWebSockets) {
      connectWebSocket();
    }
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [useWebSockets, connectWebSocket]);
  
  // Request property analysis via WebSocket
  const requestAnalysisViaWebSocket = () => {
    if (!socketRef.current || socketRef.current.readyState !== 1) {
      setError('WebSocket not connected');
      return;
    }
    
    setLoading(true);
    setProgress(0);
    setStatusMessage('Sending property data...');
    setAnalysisResult(null);
    setError(null);
    
    const newRequestId = `req_${Date.now()}`;
    setRequestId(newRequestId);
    
    const message: WSMessage = {
      type: 'property_analysis_request',
      payload: {
        ...sampleProperty,
        requestId: newRequestId
      }
    };
    
    socketRef.current.send(JSON.stringify(message));
  };
  
  // Request property analysis via HTTP fallback
  const requestAnalysisViaHttp = async () => {
    setLoading(true);
    setProgress(0);
    setStatusMessage('Sending property data...');
    setAnalysisResult(null);
    setError(null);
    
    try {
      setProgress(20);
      setStatusMessage('Contacting API...');
      
      const response = await fetch('/api/property-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sampleProperty)
      });
      
      setProgress(50);
      setStatusMessage('Processing response...');
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const result = await response.json();
      
      setProgress(100);
      setStatusMessage('Analysis complete');
      setAnalysisResult(result);
    } catch (err) {
      setError(`Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Request analysis based on selected method
  const requestAnalysis = () => {
    if (useWebSockets && connected) {
      requestAnalysisViaWebSocket();
    } else {
      requestAnalysisViaHttp();
    }
  };
  
  // Toggle between WebSocket and HTTP
  const toggleConnectionMethod = () => {
    setUseWebSockets(!useWebSockets);
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-6 w-6" />
            Property Analysis Tool
          </CardTitle>
          <CardDescription>
            Analyze property value using {useWebSockets ? 'WebSocket' : 'HTTP'} connection
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Connection status */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Connection Method:</span>
              {useWebSockets ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-1.5"
                  onClick={toggleConnectionMethod}
                >
                  <Wifi className={`h-4 w-4 ${connected ? 'text-green-500' : 'text-red-500'}`} />
                  WebSocket {connected ? '(Connected)' : '(Disconnected)'}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-1.5"
                  onClick={toggleConnectionMethod}
                >
                  <WifiOff className="h-4 w-4" />
                  HTTP Fallback
                </Button>
              )}
            </div>
            
            {clientId && useWebSockets && (
              <span className="text-xs text-muted-foreground">Client ID: {clientId}</span>
            )}
          </div>
          
          {/* Property details */}
          <div className="my-4 p-4 border rounded-md bg-muted/50">
            <h3 className="font-medium mb-2">Property Details</h3>
            <p className="mb-1">
              <span className="font-semibold">Address:</span> {sampleProperty.address.street}, {sampleProperty.address.city}, {sampleProperty.address.state} {sampleProperty.address.zipCode}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm mt-2">
              <div><span className="font-medium">Type:</span> {sampleProperty.propertyType}</div>
              <div><span className="font-medium">Bedrooms:</span> {sampleProperty.bedrooms}</div>
              <div><span className="font-medium">Bathrooms:</span> {sampleProperty.bathrooms}</div>
              <div><span className="font-medium">Square Feet:</span> {sampleProperty.squareFeet}</div>
              <div><span className="font-medium">Year Built:</span> {sampleProperty.yearBuilt}</div>
              <div><span className="font-medium">Lot Size:</span> {sampleProperty.lotSize} acres</div>
            </div>
          </div>
          
          {/* Progress and errors */}
          {loading && (
            <div className="my-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{statusMessage}</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {error && (
            <Alert variant="destructive" className="my-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Analysis results */}
          {analysisResult && (
            <div className="mt-6 space-y-4">
              <div className="bg-primary/10 p-4 rounded-md">
                <h3 className="flex items-center gap-2 font-semibold text-lg mb-2">
                  <BadgeDollarSign className="h-5 w-5" />
                  Estimated Value
                </h3>
                <div className="text-3xl font-bold text-primary mb-1">
                  {formatCurrency(analysisResult.estimatedValue)}
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-sm text-muted-foreground">Range:</span>
                  <span className="font-medium">
                    {formatCurrency(analysisResult.valueRange.min)} - {formatCurrency(analysisResult.valueRange.max)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">Confidence:</span>
                  <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                    analysisResult.confidenceLevel === 'high' 
                      ? 'bg-green-100 text-green-800' 
                      : analysisResult.confidenceLevel === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {analysisResult.confidenceLevel.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4 mt-4">
                <h3 className="flex items-center gap-2 font-semibold text-lg">
                  <BarChart3 className="h-5 w-5" />
                  Valuation Analysis
                </h3>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Price Adjustments</h4>
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground tracking-wider">Factor</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground tracking-wider">Description</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground tracking-wider">Adjustment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {analysisResult.adjustments.map((adjustment, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm font-medium">{adjustment.factor}</td>
                            <td className="px-4 py-2 text-sm">{adjustment.description}</td>
                            <td className={`px-4 py-2 text-sm font-medium text-right ${
                              adjustment.amount >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {adjustment.amount >= 0 ? '+' : ''}{formatCurrency(adjustment.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Market Analysis</h4>
                    <p className="text-sm">{analysisResult.marketAnalysis}</p>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Comparable Analysis</h4>
                    <p className="text-sm">{analysisResult.comparableAnalysis}</p>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">Valuation Methodology</h4>
                  <p className="text-sm">{analysisResult.valuationMethodology}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={toggleConnectionMethod}
          >
            Switch to {useWebSockets ? 'HTTP' : 'WebSocket'}
          </Button>
          
          <Button
            onClick={requestAnalysis}
            disabled={loading || (useWebSockets && !connected)}
          >
            {loading ? 'Analyzing...' : 'Analyze Property'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PropertyAnalysisSocket;