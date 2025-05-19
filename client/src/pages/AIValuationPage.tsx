import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowRight, Home, DollarSign, BarChart3, PieChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

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
  features: Array<{name: string}>;
  condition: string;
}

interface ValuationResult {
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

// Default property data for 406 Stardust Ct, Grandview, WA
const defaultPropertyData: PropertyData = {
  address: {
    street: "406 Stardust Ct",
    city: "Grandview",
    state: "WA",
    zipCode: "98930"
  },
  propertyType: "Single Family",
  bedrooms: 4,
  bathrooms: 2.5,
  squareFeet: 1850,
  yearBuilt: 1995,
  lotSize: 0.17,
  features: [
    { name: "Garage" },
    { name: "Fireplace" },
    { name: "Patio" }
  ],
  condition: "Good"
};

export default function AIValuationPage() {
  const [propertyData, setPropertyData] = useState<PropertyData>(defaultPropertyData);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (e.g., address.street)
      const [parent, child] = name.split('.');
      setPropertyData(prev => {
        const parentObj = prev[parent as keyof PropertyData];
        if (parentObj && typeof parentObj === 'object') {
          return {
            ...prev,
            [parent]: {
              ...parentObj,
              [child]: value
            }
          };
        }
        return prev;
      });
    } else if (name === 'bedrooms' || name === 'bathrooms' || name === 'squareFeet' || name === 'yearBuilt' || name === 'lotSize') {
      // Handle numeric properties
      setPropertyData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      // Handle simple string properties
      setPropertyData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const updatedFeatures = [...propertyData.features];
    updatedFeatures[index] = { name: value };
    setPropertyData(prev => ({
      ...prev,
      features: updatedFeatures
    }));
  };

  const handleAddFeature = () => {
    setPropertyData(prev => ({
      ...prev,
      features: [...prev.features, { name: '' }]
    }));
  };

  const handleRemoveFeature = (index: number) => {
    const updatedFeatures = [...propertyData.features];
    updatedFeatures.splice(index, 1);
    setPropertyData(prev => ({
      ...prev,
      features: updatedFeatures
    }));
  };

  const analyzeProperty = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      // Just use HTTP directly instead of trying WebSockets first
      console.log('Starting property analysis via HTTP');
      await analyzeWithHttp();
    } catch (error) {
      console.error('Error analyzing property:', error);
      toast({
        title: "Error",
        description: "Failed to analyze property. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeWithWebSocket = async () => {
    return new Promise<void>((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Connect to the correct WebSocket path that your server uses
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      const socket = new WebSocket(wsUrl);
      
      // Set up a timeout for connection and response
      const timeout = setTimeout(() => {
        console.warn('WebSocket connection or response timed out');
        socket.close();
        reject(new Error('WebSocket connection timed out'));
      }, 8000);
      
      socket.onopen = () => {
        console.log('WebSocket connection established');
        
        // Send the property data request
        const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        const requestId = `req_${Date.now()}`;
        const message = {
          type: 'property_analysis_request',
          clientId,
          requestId,
          data: propertyData
        };
        
        console.log('Sending property analysis request via WebSocket');
        socket.send(JSON.stringify(message));
      };
      
      socket.onmessage = (event) => {
        try {
          console.log('Received WebSocket message:', event.data);
          const response = JSON.parse(event.data);
          
          if (response.type === 'property_analysis_response' || 
              response.type === 'analysis_result') {
            console.log('Received property analysis response');
            clearTimeout(timeout);
            setResult(response.data);
            socket.close();
            resolve();
          } else if (response.type === 'connection_established') {
            console.log('Received connection confirmation');
          } else if (response.type === 'heartbeat') {
            console.log('Received heartbeat');
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        clearTimeout(timeout);
        reject(error);
      };
      
      socket.onclose = (event) => {
        clearTimeout(timeout);
        console.log('WebSocket connection closed:', event.code, event.reason);
        
        if (!event.wasClean && !result) {
          reject(new Error(`WebSocket closed unexpectedly: ${event.code} ${event.reason}`));
        }
      };
    });
  };

  const analyzeWithHttp = async () => {
    console.log('Using HTTP API for property analysis');
    
    try {
      // Use the test-api endpoint directly which is already set up in the server
      const requestData = {
        address: `${propertyData.address.street}, ${propertyData.address.city}, ${propertyData.address.state} ${propertyData.address.zipCode}`,
        propertyType: propertyData.propertyType,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        squareFeet: propertyData.squareFeet,
        yearBuilt: propertyData.yearBuilt,
        lotSize: propertyData.lotSize,
        features: propertyData.features.map(f => f.name).join(', '),
        condition: propertyData.condition
      };
      
      console.log('Sending data:', requestData);
      
      // Try the main API endpoint first
      const response = await fetch('/api/valuation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          property: requestData,
          useAI: true
        })
      });
      
      if (!response.ok) {
        console.error(`HTTP error: ${response.status}`);
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      console.log('Received HTTP response');
      const data = await response.json();
      console.log('Parsed HTTP response data:', data);
      
      // Transform the API response to our expected ValuationResult format
      const transformedResult: ValuationResult = {
        estimatedValue: data.valuation?.estimatedValue || data.estimatedValue || 0,
        confidenceLevel: data.confidenceLevel || 'medium',
        valueRange: {
          min: data.valuation?.valueRange?.min || data.valueRange?.min || (data.estimatedValue * 0.9) || 0,
          max: data.valuation?.valueRange?.max || data.valueRange?.max || (data.estimatedValue * 1.1) || 0,
        },
        adjustments: data.adjustments || [],
        marketAnalysis: data.marketAnalysis || data.analysis || "",
        comparableAnalysis: data.comparableAnalysis || "",
        valuationMethodology: data.methodology || "Comparable sales approach combined with machine learning model analysis"
      };
      
      setResult(transformedResult);
    } catch (error) {
      console.error('Error in HTTP request:', error);
      
      // Try an alternative endpoint as fallback
      try {
        console.log('Trying alternative endpoint');
        
        const fallbackResponse = await fetch('/api/property/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(propertyData)
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`Fallback HTTP error: ${fallbackResponse.status}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        console.log('Fallback response:', fallbackData);
        setResult(fallbackData);
      } catch (fallbackError) {
        console.error('Alternative endpoint also failed:', fallbackError);
        throw error; // Throw the original error for better debugging
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getConfidenceBadgeVariant = (confidence: string): "default" | "destructive" | "outline" | "secondary" | "success" => {
    switch (confidence) {
      case 'high':
        return 'success';
      case 'medium':
        return 'secondary'; // Changed from 'warning' to 'secondary' for compatibility
      case 'low':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">TerraFusion AI Property Valuation</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Data Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Property Information
            </CardTitle>
            <CardDescription>
              Enter the property details to get an AI-powered valuation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Property Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="address.street">Street</Label>
                    <Input
                      id="address.street"
                      name="address.street"
                      value={propertyData.address.street}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="address.city">City</Label>
                    <Input
                      id="address.city"
                      name="address.city"
                      value={propertyData.address.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="address.state">State</Label>
                    <Input
                      id="address.state"
                      name="address.state"
                      value={propertyData.address.state}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="address.zipCode">Zip Code</Label>
                    <Input
                      id="address.zipCode"
                      name="address.zipCode"
                      value={propertyData.address.zipCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Property Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="propertyType">Property Type</Label>
                    <Input
                      id="propertyType"
                      name="propertyType"
                      value={propertyData.propertyType}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      name="bedrooms"
                      type="number"
                      value={propertyData.bedrooms}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      name="bathrooms"
                      type="number"
                      step="0.5"
                      value={propertyData.bathrooms}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="squareFeet">Square Feet</Label>
                    <Input
                      id="squareFeet"
                      name="squareFeet"
                      type="number"
                      value={propertyData.squareFeet}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="yearBuilt">Year Built</Label>
                    <Input
                      id="yearBuilt"
                      name="yearBuilt"
                      type="number"
                      value={propertyData.yearBuilt}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lotSize">Lot Size (acres)</Label>
                    <Input
                      id="lotSize"
                      name="lotSize"
                      type="number"
                      step="0.01"
                      value={propertyData.lotSize}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="condition">Condition</Label>
                    <Input
                      id="condition"
                      name="condition"
                      value={propertyData.condition}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Features</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddFeature}
                  >
                    Add Feature
                  </Button>
                </div>
                
                {propertyData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={feature.name}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      placeholder="Feature name"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemoveFeature(index)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={analyzeProperty}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Property...
                </>
              ) : (
                <>
                  Analyze Property 
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Valuation Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Property Valuation
            </CardTitle>
            <CardDescription>
              AI-powered valuation based on property details and market data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Analyzing property data and market conditions...
                </p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-medium mb-1">Estimated Value</h3>
                  <div className="text-4xl font-bold text-primary">
                    {formatCurrency(result.estimatedValue)}
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge variant={getConfidenceBadgeVariant(result.confidenceLevel)}>
                      {result.confidenceLevel.charAt(0).toUpperCase() + result.confidenceLevel.slice(1)} Confidence
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Range: {formatCurrency(result.valueRange.min)} - {formatCurrency(result.valueRange.max)}
                    </span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Adjustments
                  </h3>
                  <div className="space-y-3">
                    {result.adjustments.map((adj, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{adj.factor}</h4>
                          <span className={`font-medium ${adj.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {adj.amount >= 0 ? '+' : ''}{formatCurrency(adj.amount)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{adj.description}</p>
                        <p className="text-xs text-muted-foreground mt-1 italic">{adj.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Market Analysis
                  </h3>
                  <p className="text-sm">{result.marketAnalysis}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Comparable Analysis</h3>
                  <p className="text-sm">{result.comparableAnalysis}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Valuation Methodology</h3>
                  <p className="text-sm">{result.valuationMethodology}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <Home className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Valuation Yet</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                  Enter your property details and click "Analyze Property" to get an AI-powered valuation report.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}