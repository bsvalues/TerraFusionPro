import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Database, CheckCircle, AlertCircle, Eye, MapPin } from "lucide-react";

interface ImportJob {
  id: number;
  jobName: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  detectedSystems: string[];
  createdAt: string;
}

export default function LegacyImporter() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'extract' | 'map' | 'preview' | 'import'>('upload');
  const [jobName, setJobName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [systemType, setSystemType] = useState("");
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sample import jobs for demonstration
  const sampleJobs: ImportJob[] = [
    {
      id: 1,
      jobName: "Q4 2024 TOTAL Legacy Import",
      status: "completed",
      totalRecords: 1250,
      processedRecords: 1250,
      detectedSystems: ["TOTAL", "ClickForms"],
      createdAt: "2024-12-15"
    },
    {
      id: 2,
      jobName: "ACI Data Migration",
      status: "processing",
      totalRecords: 875,
      processedRecords: 420,
      detectedSystems: ["ACI"],
      createdAt: "2024-12-20"
    }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || !jobName.trim()) return;
    
    setIsProcessing(true);
    setProgress(10);
    
    // Simulate processing steps
    setTimeout(() => setProgress(40), 1000);
    setTimeout(() => {
      setProgress(100);
      setCurrentStep('extract');
      setIsProcessing(false);
    }, 2000);
  };

  const handleMapping = () => {
    setIsProcessing(true);
    setProgress(70);
    setTimeout(() => {
      setCurrentStep('preview');
      setIsProcessing(false);
    }, 1500);
  };

  const handleImport = () => {
    setIsProcessing(true);
    setProgress(100);
    setTimeout(() => {
      setCurrentStep('import');
      setIsProcessing(false);
    }, 2000);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: "bg-green-100 text-green-800",
      processing: "bg-blue-100 text-blue-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800"
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.pending}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const resetWorkflow = () => {
    setCurrentStep('upload');
    setJobName('');
    setSelectedFiles([]);
    setSystemType('');
    setProgress(0);
    setIsProcessing(false);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Universal Legacy Appraisal Importer</h1>
        <p className="text-muted-foreground">
          Import and convert legacy appraisal data from TOTAL, ClickForms, ACI, DataMaster, and Alamode systems
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Import Legacy Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={currentStep} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="extract" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Extract
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Map Fields
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Import
              </TabsTrigger>
            </TabsList>

            {progress > 0 && (
              <div className="mt-4">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">
                  Processing: {progress}% complete
                </p>
              </div>
            )}

            {/* Upload Step */}
            <TabsContent value="upload" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="jobName">Import Job Name</Label>
                  <Input
                    id="jobName"
                    placeholder="e.g., Q4 2024 Legacy Data Import"
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                  />
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Upload Legacy Files</h3>
                    <p className="text-sm text-muted-foreground">
                      Supports ZIP, XML, ENV, SQL, CSV, PDF, XLSX files up to 100MB
                    </p>
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      accept=".zip,.xml,.env,.sql,.csv,.pdf,.xlsx,.xls"
                      className="max-w-md mx-auto"
                    />
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Selected Files:</h4>
                    <div className="space-y-1">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleUpload}
                  disabled={!selectedFiles.length || !jobName.trim() || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : 'Upload & Analyze Files'}
                </Button>
              </div>
            </TabsContent>

            {/* Extract Step */}
            <TabsContent value="extract" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Analysis complete! Detected 2 legacy system formats with 1,250 total records.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Detected Systems</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge variant="outline">TOTAL</Badge>
                      <Badge variant="outline">ClickForms</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">File Processing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>legacy_data.zip</span>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>forms_export.xml</span>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Button onClick={() => setCurrentStep('map')} className="w-full">
                Proceed to Field Mapping
              </Button>
            </TabsContent>

            {/* Mapping Step */}
            <TabsContent value="map" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="systemType">Select Legacy System Type</Label>
                  <Select value={systemType} onValueChange={setSystemType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose detected system" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOTAL">TOTAL</SelectItem>
                      <SelectItem value="CLICKFORMS">ClickForms</SelectItem>
                      <SelectItem value="ACI">ACI</SelectItem>
                      <SelectItem value="DATAMASTER">DataMaster</SelectItem>
                      <SelectItem value="ALAMODE">Alamode</SelectItem>
                      <SelectItem value="CUSTOM">Custom Mapping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {systemType === 'CUSTOM' && (
                  <div>
                    <Label htmlFor="customMappings">Custom Field Mappings (JSON)</Label>
                    <Textarea
                      id="customMappings"
                      placeholder='{"legacy_field": "modern_field", "property_address": "address"}'
                      rows={6}
                    />
                  </div>
                )}

                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Field mapping templates will be auto-generated based on detected system type.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={handleMapping}
                  disabled={!systemType || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Generating Mappings...' : 'Generate Field Mappings'}
                </Button>
              </div>
            </TabsContent>

            {/* Preview Step */}
            <TabsContent value="preview" className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Ready to import 1,250 records. Review the mapping preview below.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Field Mapping Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-4 font-medium border-b pb-2">
                      <span>Legacy Field</span>
                      <span>Modern Field</span>
                      <span>Sample Value</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <span className="font-mono">total_subject_property</span>
                      <span className="font-mono">address</span>
                      <span className="text-muted-foreground">123 Main St</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <span className="font-mono">total_sale_price</span>
                      <span className="font-mono">salePrice</span>
                      <span className="text-muted-foreground">$450,000</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <span className="font-mono">total_square_feet</span>
                      <span className="font-mono">squareFootage</span>
                      <span className="text-muted-foreground">2,150</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setCurrentStep('map')}
                  variant="outline"
                  className="flex-1"
                >
                  Back to Mapping
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? 'Importing...' : 'Approve & Import All'}
                </Button>
              </div>
            </TabsContent>

            {/* Import Step */}
            <TabsContent value="import" className="space-y-4">
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-semibold">Import Complete!</h3>
                <p className="text-muted-foreground">
                  Successfully imported 1,250 legacy records to your TerraFusion system.
                </p>
                
                <div className="flex gap-2 justify-center">
                  <Button onClick={resetWorkflow}>
                    Start New Import
                  </Button>
                  <Button variant="outline">
                    View Imported Data
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Recent Import Jobs */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Recent Import Jobs</h3>
            <div className="space-y-3">
              {sampleJobs.map((job) => (
                <Card key={job.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{job.jobName}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.processedRecords}/{job.totalRecords} records • 
                        {new Date(job.createdAt).toLocaleDateString()} • 
                        Systems: {job.detectedSystems.join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(job.status)}
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}