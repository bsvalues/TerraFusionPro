import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CircleAlert,
  Loader2,
  Camera,
  ImageUp,
  Scan,
  RefreshCw,
  FileText, // Using FileText instead of FileAnalytics which is not exported
  BarChart
} from 'lucide-react';

// PhotoEnhancementPage component for testing the AI photo enhancement feature
export function PhotoEnhancementPage() {
  // State variables
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [enhancementOptions, setEnhancementOptions] = useState({
    enhanceQuality: true,
    fixLighting: true,
    removeGlare: false,
    removeNoise: true,
    enhanceColors: true,
    improveComposition: false
  });
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [advancedAnalysis, setAdvancedAnalysis] = useState<any | null>(null);
  const [inspectionReport, setInspectionReport] = useState<any | null>(null);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setEnhancedUrl(null);
      setAnalysis(null);
      setAdvancedAnalysis(null);
      setInspectionReport(null);
      setError(null);
    }
  };

  // Handle option change
  const handleOptionChange = (option: string) => {
    setEnhancementOptions({
      ...enhancementOptions,
      [option]: !enhancementOptions[option as keyof typeof enhancementOptions]
    });
  };

  // Enhance photo
  const enhancePhoto = async () => {
    if (!selectedFile) {
      setError('Please select a photo first');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      
      // Add enhancement options to form data
      Object.entries(enhancementOptions).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
      
      const response = await fetch('/api/photo-enhancement/enhance', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to enhance photo');
      }
      
      setEnhancedUrl(data.enhancedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze photo using OpenAI
  const analyzePhoto = async () => {
    if (!selectedFile) {
      setError('Please select a photo first');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      
      const response = await fetch('/api/photo-enhancement/analyze', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to analyze photo');
      }
      
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze photo using Anthropic (advanced)
  const analyzePhotoAdvanced = async () => {
    if (!selectedFile) {
      setError('Please select a photo first');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      
      const response = await fetch('/api/photo-enhancement/analyze-advanced', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to analyze photo');
      }
      
      setAdvancedAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Inspect property using Anthropic
  const inspectProperty = async () => {
    if (!selectedFile) {
      setError('Please select a photo first');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      
      const response = await fetch('/api/photo-enhancement/inspect', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to inspect property');
      }
      
      setInspectionReport(data.inspectionReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset the form
  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setEnhancedUrl(null);
    setAnalysis(null);
    setAdvancedAnalysis(null);
    setInspectionReport(null);
    setError(null);
    
    // Reset enhancement options to defaults
    setEnhancementOptions({
      enhanceQuality: true,
      fixLighting: true,
      removeGlare: false,
      removeNoise: true,
      enhanceColors: true,
      improveComposition: false
    });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold">TerraField AI Photo Enhancement</h1>
        <p className="text-muted-foreground">
          Improve property photos with AI-powered enhancement and analysis.
        </p>
        
        {error && (
          <Alert variant="destructive">
            <CircleAlert className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Photo Upload</CardTitle>
              <CardDescription>
                Select a property photo to enhance or analyze
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="photo-upload">Upload Photo</Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1"
                />
              </div>
              
              {previewUrl && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Preview:</h3>
                  <div className="border rounded-md overflow-hidden">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-auto object-contain max-h-[300px]"
                    />
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Enhancement Options:</h3>
                <div className="space-y-3">
                  {Object.entries(enhancementOptions).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="flex-1 cursor-pointer capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </Label>
                      <Switch
                        id={key}
                        checked={value}
                        onCheckedChange={() => handleOptionChange(key)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
              <div className="space-x-2">
                <Button 
                  variant="secondary" 
                  onClick={analyzePhoto}
                  disabled={!selectedFile || isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Scan className="mr-2 h-4 w-4" />}
                  Analyze
                </Button>
                <Button 
                  onClick={enhancePhoto}
                  disabled={!selectedFile || isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                  Enhance
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                View enhanced photos and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="enhanced" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="enhanced">Enhanced</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                
                <TabsContent value="enhanced" className="space-y-4">
                  {enhancedUrl ? (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Enhanced Photo:</h3>
                      <div className="border rounded-md overflow-hidden">
                        <img 
                          src={enhancedUrl} 
                          alt="Enhanced" 
                          className="w-full h-auto object-contain max-h-[400px]"
                        />
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => window.open(enhancedUrl, '_blank')}>
                          View Full Size
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      <ImageUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Enhanced photo will appear here</p>
                      <p className="text-sm mt-2">Click "Enhance" to process your photo</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="analysis" className="space-y-4">
                  {analysis ? (
                    <div className="space-y-4">
                      <div className="border rounded-md p-4">
                        <h3 className="font-medium mb-2">Description</h3>
                        <p>{analysis.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border rounded-md p-4">
                          <h3 className="font-medium mb-2">Quality</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold">{analysis.quality.score}/10</span>
                          </div>
                          
                          <h4 className="text-sm font-medium mt-4 mb-1">Strengths:</h4>
                          <ul className="text-sm list-disc list-inside">
                            {analysis.quality.strengths.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                          
                          <h4 className="text-sm font-medium mt-4 mb-1">Issues:</h4>
                          <ul className="text-sm list-disc list-inside">
                            {analysis.quality.issues.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="border rounded-md p-4">
                          <h3 className="font-medium mb-2">Composition</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold">{analysis.composition.score}/10</span>
                          </div>
                          <p className="text-sm">{analysis.composition.feedback}</p>
                        </div>
                        
                        <div className="border rounded-md p-4">
                          <h3 className="font-medium mb-2">Lighting</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold">{analysis.lighting.score}/10</span>
                          </div>
                          <p className="text-sm">{analysis.lighting.feedback}</p>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <h3 className="font-medium mb-2">Recommendations</h3>
                        <ul className="text-sm list-disc list-inside">
                          {analysis.recommendedImprovements.map((r: string, i: number) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Photo analysis will appear here</p>
                      <p className="text-sm mt-2">Click "Analyze" to assess your photo</p>
                      <Button 
                        className="mt-4" 
                        variant="outline"
                        size="sm"
                        onClick={analyzePhoto}
                        disabled={!selectedFile || isLoading}
                      >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Scan className="mr-2 h-4 w-4" />}
                        Analyze with OpenAI
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4">
                  <div className="flex space-x-2 mb-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={analyzePhotoAdvanced}
                      disabled={!selectedFile || isLoading}
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Analysis
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={inspectProperty}
                      disabled={!selectedFile || isLoading}
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Inspection
                    </Button>
                  </div>
                  
                  {advancedAnalysis && (
                    <div className="space-y-4">
                      <h3 className="font-medium">Anthropic Property Analysis</h3>
                      <div className="border rounded-md p-4">
                        <h4 className="font-medium mb-2">Description</h4>
                        <p>{advancedAnalysis.description}</p>
                        
                        <h4 className="font-medium mt-4 mb-2">Property Type</h4>
                        <p>{advancedAnalysis.propertyType}</p>
                        
                        <h4 className="font-medium mt-4 mb-2">Visible Features</h4>
                        <ul className="list-disc list-inside">
                          {advancedAnalysis.visibleFeatures.map((feature: string, i: number) => (
                            <li key={i}>{feature}</li>
                          ))}
                        </ul>
                        
                        <h4 className="font-medium mt-4 mb-2">Estimated Value</h4>
                        <div className="pl-4">
                          <p><strong>Range:</strong> {advancedAnalysis.estimatedValue.range}</p>
                          <p><strong>Confidence:</strong> {(advancedAnalysis.estimatedValue.confidence * 100).toFixed(0)}%</p>
                          <p><strong>Factors:</strong></p>
                          <ul className="list-disc list-inside">
                            {advancedAnalysis.estimatedValue.factors.map((factor: string, i: number) => (
                              <li key={i}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <h4 className="font-medium mt-4 mb-2">Condition</h4>
                        <div className="pl-4">
                          <p><strong>Rating:</strong> {advancedAnalysis.condition.rating}/10</p>
                          <p><strong>Notes:</strong></p>
                          <ul className="list-disc list-inside">
                            {advancedAnalysis.condition.notes.map((note: string, i: number) => (
                              <li key={i}>{note}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <h4 className="font-medium mt-4 mb-2">Recommendations</h4>
                        <ul className="list-disc list-inside">
                          {advancedAnalysis.recommendations.map((rec: string, i: number) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {inspectionReport && (
                    <div className="space-y-4 mt-6">
                      <h3 className="font-medium">Anthropic Property Inspection</h3>
                      
                      {inspectionReport.exterior && (
                        <div className="border rounded-md p-4">
                          <h4 className="font-medium mb-2">Exterior</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p><strong>Foundation:</strong> {inspectionReport.exterior.foundation}</p>
                              <p><strong>Siding:</strong> {inspectionReport.exterior.siding}</p>
                              <p><strong>Roof:</strong> {inspectionReport.exterior.roof}</p>
                            </div>
                            <div>
                              <p><strong>Windows:</strong> {inspectionReport.exterior.windows}</p>
                              <p><strong>Landscaping:</strong> {inspectionReport.exterior.landscaping}</p>
                              <p><strong>Overall:</strong> {inspectionReport.exterior.overallCondition}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {inspectionReport.interior && (
                        <div className="border rounded-md p-4">
                          <h4 className="font-medium mb-2">Interior</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p><strong>Flooring:</strong> {inspectionReport.interior.flooring}</p>
                              <p><strong>Walls:</strong> {inspectionReport.interior.walls}</p>
                              <p><strong>Ceilings:</strong> {inspectionReport.interior.ceilings}</p>
                            </div>
                            <div>
                              <p><strong>Fixtures:</strong> {inspectionReport.interior.fixtures}</p>
                              <p><strong>Overall:</strong> {inspectionReport.interior.overallCondition}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-md p-4">
                          <h4 className="font-medium mb-2">Unique Features</h4>
                          <ul className="list-disc list-inside">
                            {inspectionReport.uniqueFeatures.map((feature: string, i: number) => (
                              <li key={i}>{feature}</li>
                            ))}
                          </ul>
                          
                          <h4 className="font-medium mt-4 mb-2">Defects</h4>
                          <ul className="list-disc list-inside">
                            {inspectionReport.defects.map((defect: string, i: number) => (
                              <li key={i}>{defect}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="border rounded-md p-4">
                          <h4 className="font-medium mb-2">Quality Indicators</h4>
                          <ul className="list-disc list-inside">
                            {inspectionReport.qualityIndicators.map((indicator: string, i: number) => (
                              <li key={i}>{indicator}</li>
                            ))}
                          </ul>
                          
                          <h4 className="font-medium mt-4 mb-2">Maintenance Needs</h4>
                          <ul className="list-disc list-inside">
                            {inspectionReport.maintenanceNeeds.map((need: string, i: number) => (
                              <li key={i}>{need}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <h4 className="font-medium mb-2">Appraisal Considerations</h4>
                        <ul className="list-disc list-inside">
                          {inspectionReport.appraisalConsiderations.map((consideration: string, i: number) => (
                            <li key={i}>{consideration}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {!advancedAnalysis && !inspectionReport && (
                    <div className="p-6 text-center text-muted-foreground">
                      <BarChart className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Advanced property analysis and inspection</p>
                      <p className="text-sm mt-2">Click on the buttons above to process your photo with Anthropic Claude</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PhotoEnhancementPage;