import { useEffect, useState } from 'react';
import { shapWebSocketClient, ShapData } from '@/lib/shapWebSocket';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

/**
 * SHAP Viewer Component Properties
 */
interface ShapViewerProps {
  propertyId?: number;
  initialCondition?: string;
  className?: string;
}

/**
 * SHAP Viewer Component
 * Displays SHAP values for property condition scores
 */
export function ShapViewer({ propertyId, initialCondition = 'good', className }: ShapViewerProps) {
  // State for selected condition, connection status, and SHAP data
  const [condition, setCondition] = useState<string>(initialCondition);
  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [shapData, setShapData] = useState<ShapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Connect to WebSocket on component mount
  useEffect(() => {
    connectToWebSocket();

    // Set up event listeners
    shapWebSocketClient.on('connection_established', handleConnectionEstablished);
    shapWebSocketClient.on('shap_update', handleShapUpdate);
    shapWebSocketClient.on('error', handleError);
    shapWebSocketClient.on('disconnected', handleDisconnected);

    // Clean up event listeners on unmount
    return () => {
      shapWebSocketClient.off('connection_established', handleConnectionEstablished);
      shapWebSocketClient.off('shap_update', handleShapUpdate);
      shapWebSocketClient.off('error', handleError);
      shapWebSocketClient.off('disconnected', handleDisconnected);
      
      // Disconnect WebSocket on unmount
      if (shapWebSocketClient.isConnected()) {
        shapWebSocketClient.disconnect();
      }
    };
  }, []);

  // Request SHAP values when condition changes
  useEffect(() => {
    if (connected && condition) {
      requestShapValues(condition);
    }
  }, [connected, condition]);

  /**
   * Connect to the WebSocket server
   */
  const connectToWebSocket = async () => {
    try {
      setConnecting(true);
      setError(null);
      await shapWebSocketClient.connect();
    } catch (err) {
      setError('Failed to connect to the server. Please try again.');
      console.error('[SHAP Viewer] Connection error:', err);
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Handle connection established event
   */
  const handleConnectionEstablished = (data: any) => {
    setConnected(true);
    setError(null);
    console.log('[SHAP Viewer] Connected to server:', data);
    
    // Request SHAP values for current condition
    if (condition) {
      requestShapValues(condition);
    }
  };

  /**
   * Handle SHAP update event
   */
  const handleShapUpdate = (message: any) => {
    console.log('[SHAP Viewer] Received SHAP data:', message);
    
    if (message.data) {
      if (typeof message.data === 'object' && 'condition' in message.data) {
        // Single condition data
        setShapData(message.data as ShapData);
        
        // Handle image path
        if (message.data.image_path) {
          const imagePath = message.data.image_path;
          // Convert to relative path if it's a full path
          const fileName = imagePath.split('/').pop();
          setImageUrl(`/api/sample-images/${fileName}`);
        }
      } else if (typeof message.data === 'object') {
        // Multiple conditions data
        // Find the one matching our current condition
        const conditionData = message.data[condition];
        if (conditionData) {
          setShapData(conditionData);
          
          // Handle image path
          if (conditionData.image_path) {
            const imagePath = conditionData.image_path;
            const fileName = imagePath.split('/').pop();
            setImageUrl(`/api/sample-images/${fileName}`);
          }
        }
      }
    }
  };

  /**
   * Handle error event
   */
  const handleError = (error: any) => {
    setError(`Error: ${error.error || 'Unknown error'}`);
    console.error('[SHAP Viewer] Error:', error);
  };

  /**
   * Handle disconnected event
   */
  const handleDisconnected = () => {
    setConnected(false);
    console.log('[SHAP Viewer] Disconnected from server');
  };

  /**
   * Request SHAP values for a specific condition
   */
  const requestShapValues = (condition: string) => {
    if (!connected) {
      console.warn('[SHAP Viewer] Cannot request SHAP values: not connected');
      return;
    }
    
    console.log(`[SHAP Viewer] Requesting SHAP values for condition: ${condition}`);
    shapWebSocketClient.requestShapForCondition(condition);
  };

  /**
   * Handle condition selection change
   */
  const handleConditionChange = (value: string) => {
    setCondition(value);
  };

  /**
   * Get color based on SHAP value
   */
  const getShapColor = (value: number): string => {
    if (value >= 0.5) return 'text-green-600 font-medium';
    if (value >= 0.2) return 'text-green-500';
    if (value >= 0) return 'text-green-400';
    if (value >= -0.2) return 'text-blue-400';
    if (value >= -0.5) return 'text-blue-500';
    return 'text-blue-600 font-medium';
  };

  /**
   * Get progress bar color based on SHAP value
   */
  const getProgressColor = (value: number): string => {
    if (value >= 0) return 'bg-green-500';
    return 'bg-blue-500';
  };

  /**
   * Calculate progress value for SHAP bars (0-100)
   */
  const getProgressValue = (value: number): number => {
    return Math.abs(value) * 100;
  };

  /**
   * Format SHAP value for display
   */
  const formatShapValue = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>SHAP Value Explainer</span>
          {connected ? (
            <span className="inline-flex items-center text-xs font-medium text-green-500">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500"></span>
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center text-xs font-medium text-red-500">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-red-500"></span>
              Not Connected
            </span>
          )}
        </CardTitle>
        <CardDescription>
          See how different features contribute to the property condition score
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Connection error message */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Condition selector */}
        <div className="mb-4">
          <Label htmlFor="condition-select">Property Condition</Label>
          <Select
            value={condition}
            onValueChange={handleConditionChange}
            disabled={!connected}
          >
            <SelectTrigger id="condition-select">
              <SelectValue placeholder="Select a condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Excellent (4.5-5.0)</SelectItem>
              <SelectItem value="good">Good (3.5-4.4)</SelectItem>
              <SelectItem value="average">Average (2.5-3.4)</SelectItem>
              <SelectItem value="fair">Fair (1.5-2.4)</SelectItem>
              <SelectItem value="poor">Poor (1.0-1.4)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Property image */}
        {imageUrl && (
          <div className="mb-6 rounded-md border p-1">
            <img 
              src={imageUrl} 
              alt={`${condition} property condition`} 
              className="max-h-52 w-full rounded object-cover"
            />
          </div>
        )}
        
        {/* SHAP values visualization */}
        {shapData ? (
          <div className="space-y-6">
            {/* Score summary */}
            <div className="rounded-md bg-muted p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Base Score:</span>
                <span className="text-sm">{shapData.base_score.toFixed(1)}</span>
              </div>
              
              {shapData.features.map((feature, index) => (
                <div key={feature} className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">{feature}:</span>
                  <span className={`text-sm ${getShapColor(shapData.values[index])}`}>
                    {formatShapValue(shapData.values[index])}
                  </span>
                </div>
              ))}
              
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="font-semibold">Final Score:</span>
                <span className="font-semibold">{shapData.final_score.toFixed(1)}</span>
              </div>
            </div>
            
            {/* SHAP visualization */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Feature Importance</h4>
                <div className="flex items-center space-x-4 text-xs">
                  <span className="flex items-center">
                    <span className="mr-1.5 h-3 w-3 rounded-full bg-green-500"></span>
                    Increases Score
                  </span>
                  <span className="flex items-center">
                    <span className="mr-1.5 h-3 w-3 rounded-full bg-blue-500"></span>
                    Decreases Score
                  </span>
                </div>
              </div>
              
              {shapData.features.map((feature, index) => (
                <div key={feature} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{feature}</span>
                    <span className={`text-sm ${getShapColor(shapData.values[index])}`}>
                      {formatShapValue(shapData.values[index])}
                    </span>
                  </div>
                  <Progress 
                    value={getProgressValue(shapData.values[index])} 
                    className={shapData.values[index] >= 0 ? 'bg-green-100' : 'bg-blue-100'}
                    indicatorClassName={getProgressColor(shapData.values[index])} 
                  />
                </div>
              ))}
            </div>
            
            {/* Explanation */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Understanding SHAP Values</AlertTitle>
              <AlertDescription className="text-xs">
                SHAP values show how each feature pushes the prediction higher or lower.
                Positive values (green) increase the score, while negative values (blue) decrease it.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-md border border-dashed p-8 text-center">
            {connecting ? (
              <p className="text-muted-foreground">Connecting to server...</p>
            ) : !connected ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">Not connected to the server</p>
                <Button onClick={connectToWebSocket}>Connect</Button>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Select a property condition to view SHAP values
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}