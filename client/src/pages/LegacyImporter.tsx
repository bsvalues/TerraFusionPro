import React, { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeader } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Database, CheckCircle, AlertCircle, Download, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface FileUpload {
  originalname: string;
  size: number;
  type: string;
  processed: boolean;
  error?: string;
}

interface ImportJob {
  id: number;
  jobName: string;
  status: string;
  uploadedFiles: FileUpload[];
  detectedFormats: string[];
  extractedData: any;
  fieldMappings: any;
  previewData: any;
  processedRecords: number;
  totalRecords: number;
  errorLogs: any[];
  createdAt: string;
  updatedAt: string;
}

interface PreviewMapping {
  legacy: string;
  modern: string;
  sample: string;
}

export default function LegacyImporter() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'extract' | 'map' | 'preview' | 'import'>('upload');
  const [jobName, setJobName] = useState("");
  const [currentJobId, setCurrentJobId] = useState<number | null>(null);
  const [selectedSystemType, setSelectedSystemType] = useState<string>("");
  const [customMappings, setCustomMappings] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const queryClient = useQueryClient();

  // Fetch user's import jobs
  const { data: importJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/legacy-import/jobs'],
    queryFn: () => apiRequest('/api/legacy-import/jobs?userId=1'),
  });

  // Fetch current job details
  const { data: currentJob, isLoading: jobLoading } = useQuery({
    queryKey: ['/api/legacy-import/jobs', currentJobId],
    queryFn: () => currentJobId ? apiRequest(`/api/legacy-import/jobs/${currentJobId}`) : null,
    enabled: !!currentJobId,
  });

  // File upload and extraction mutation
  const extractMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/legacy-import/extract', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentJobId(data.jobId);
      setCurrentStep('extract');
      setProgress(40);
      queryClient.invalidateQueries({ queryKey: ['/api/legacy-import/jobs'] });
    },
  });

  // Field mapping mutation
  const mapMutation = useMutation({
    mutationFn: async ({ jobId, systemType, customMappings }: { jobId: number; systemType: string; customMappings: any }) => {
      return apiRequest(`/api/legacy-import/${jobId}/map`, {
        method: 'POST',
        body: { systemType, customMappings }
      });
    },
    onSuccess: () => {
      setCurrentStep('preview');
      setProgress(70);
      queryClient.invalidateQueries({ queryKey: ['/api/legacy-import/jobs', currentJobId] });
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (jobId: number) => {
      return apiRequest(`/api/legacy-import/${jobId}/import`, {
        method: 'POST',
        body: { approved: true }
      });
    },
    onSuccess: () => {
      setCurrentStep('import');
      setProgress(100);
      queryClient.invalidateQueries({ queryKey: ['/api/legacy-import/jobs'] });
    },
  });

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'text/xml': ['.xml'],
      'text/plain': ['.env'],
      'application/sql': ['.sql'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: true,
    maxSize: 100 * 1024 * 1024 // 100MB
  });

  const handleUpload = async () => {
    if (!uploadedFiles.length || !jobName.trim()) return;

    setIsProcessing(true);
    setProgress(10);

    const formData = new FormData();
    uploadedFiles.forEach(file => {
      formData.append('files', file);
    });
    formData.append('jobName', jobName);
    formData.append('userId', '1'); // Replace with actual user ID

    try {
      await extractMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMapping = async () => {
    if (!currentJobId || !selectedSystemType) return;

    setIsProcessing(true);
    try {
      await mapMutation.mutateAsync({
        jobId: currentJobId,
        systemType: selectedSystemType,
        customMappings
      });
    } catch (error) {
      console.error('Mapping failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!currentJobId) return;

    setIsProcessing(true);
    try {
      await importMutation.mutateAsync(currentJobId);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'upload': return <Upload className="h-4 w-4" />;
      case 'extract': return <FileText className="h-4 w-4" />;
      case 'map': return <Database className="h-4 w-4" />;
      case 'preview': return <Eye className="h-4 w-4" />;
      case 'import': return <CheckCircle className="h-4 w-4" />;
      default: return <Upload className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      mapping: 'default',
      review: 'default',
      completed: 'success',
      failed: 'destructive'
    };
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Universal Legacy Appraisal Importer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={currentStep} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                {getStepIcon('upload')}
                Upload Files
              </TabsTrigger>
              <TabsTrigger value="extract" className="flex items-center gap-2">
                {getStepIcon('extract')}
                Extract & Analyze
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                {getStepIcon('map')}
                Field Mapping
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                {getStepIcon('preview')}
                Preview & Review
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                {getStepIcon('import')}
                Import Data
              </TabsTrigger>
            </TabsList>

            {/* Progress Bar */}
            {progress > 0 && (
              <div className="mt-4">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">
                  Processing: {progress}% complete
                </p>
              </div>
            )}

            {/* Upload Step */}
            <TabsContent value="upload" className="space-y-4">
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

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    {isDragActive ? 'Drop files here' : 'Drag & drop legacy files'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports ZIP, XML, ENV, SQL, CSV, PDF, XLSX files up to 100MB
                  </p>
                  <Button variant="outline">
                    Choose Files
                  </Button>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Selected Files:</h4>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <Button 
                  onClick={handleUpload}
                  disabled={!uploadedFiles.length || !jobName.trim() || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : 'Upload & Analyze Files'}
                </Button>
              </div>
            </TabsContent>

            {/* Extract Step */}
            <TabsContent value="extract" className="space-y-4">
              {currentJob && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Analysis complete! Detected {currentJob.detectedFormats?.length || 0} legacy system(s) 
                      with {currentJob.totalRecords} total records.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Detected Systems</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {currentJob.detectedFormats?.map((format: string, index: number) => (
                            <Badge key={index} variant="outline">{format}</Badge>
                          )) || <span className="text-muted-foreground">None detected</span>}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Processed Files</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {currentJob.uploadedFiles?.map((file: FileUpload, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{file.originalname}</span>
                              {file.processed ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          )) || []}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Button 
                    onClick={() => setCurrentStep('map')}
                    className="w-full"
                  >
                    Proceed to Field Mapping
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Mapping Step */}
            <TabsContent value="map" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="systemType">Select Legacy System Type</Label>
                  <Select value={selectedSystemType} onValueChange={setSelectedSystemType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose detected system or manual" />
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

                {selectedSystemType === 'CUSTOM' && (
                  <div>
                    <Label htmlFor="customMappings">Custom Field Mappings (JSON)</Label>
                    <Textarea
                      id="customMappings"
                      placeholder='{"legacy_field": "modern_field", "property_address": "address"}'
                      value={JSON.stringify(customMappings, null, 2)}
                      onChange={(e) => {
                        try {
                          setCustomMappings(JSON.parse(e.target.value));
                        } catch {
                          // Invalid JSON, ignore
                        }
                      }}
                      rows={6}
                    />
                  </div>
                )}

                <Button 
                  onClick={handleMapping}
                  disabled={!selectedSystemType || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Generating Mappings...' : 'Generate Field Mappings'}
                </Button>
              </div>
            </TabsContent>

            {/* Preview Step */}
            <TabsContent value="preview" className="space-y-4">
              {currentJob?.previewData && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Ready to import {currentJob.processedRecords} records. 
                      Review the preview below before proceeding.
                    </AlertDescription>
                  </Alert>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Field Mapping Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Legacy Field</TableHead>
                            <TableHead>Modern Field</TableHead>
                            <TableHead>Sample Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(currentJob.fieldMappings || {}).slice(0, 10).map(([legacy, modern], index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono text-sm">{legacy}</TableCell>
                              <TableCell className="font-mono text-sm">{modern as string}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                Sample data...
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
                </div>
              )}
            </TabsContent>

            {/* Import Step */}
            <TabsContent value="import" className="space-y-4">
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-semibold">Import Complete!</h3>
                <p className="text-muted-foreground">
                  All legacy records have been successfully imported to your TerraFusion system.
                </p>
                
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={() => {
                      setCurrentStep('upload');
                      setCurrentJobId(null);
                      setProgress(0);
                      setUploadedFiles([]);
                      setJobName('');
                    }}
                  >
                    Start New Import
                  </Button>
                  <Button variant="outline">
                    View Imported Data
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Previous Import Jobs */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Recent Import Jobs</h3>
            <div className="space-y-2">
              {importJobs.slice(0, 5).map((job: ImportJob) => (
                <Card key={job.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{job.jobName}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.processedRecords}/{job.totalRecords} records • 
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(job.status)}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentJobId(job.id)}
                      >
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