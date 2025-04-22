import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsItem, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUp, CheckCircle, AlertCircle, Info, File, FileText, Database, ArrowRight } from 'lucide-react';

// Define the supported file types
const SUPPORTED_FORMATS = {
  'application/pdf': {
    label: 'PDF Document',
    icon: <File className="h-6 w-6 text-orange-500" />,
  },
  'application/xml': {
    label: 'XML Document',
    icon: <FileText className="h-6 w-6 text-blue-500" />,
  },
  'text/xml': {
    label: 'XML Document',
    icon: <FileText className="h-6 w-6 text-blue-500" />,
  },
  'text/csv': {
    label: 'CSV File',
    icon: <Database className="h-6 w-6 text-green-500" />,
  },
  'application/vnd.ms-excel': {
    label: 'CSV File',
    icon: <Database className="h-6 w-6 text-green-500" />,
  },
  'application/json': {
    label: 'JSON File',
    icon: <Database className="h-6 w-6 text-purple-500" />,
  },
};

// File import status
type FileStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

// Import file type
interface ImportFile {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  errorMessage?: string;
  result?: any;
}

// Import result interface
interface ImportResult {
  id: string;
  fileId: string;
  fileName: string;
  format: string;
  dateProcessed: string;
  importedEntities: {
    properties: number;
    comparables: number;
    reports: number;
  };
  status: 'success' | 'partial' | 'failed';
  errors?: string[];
  warnings?: string[];
}

export default function ImportPage() {
  const [files, setFiles] = useState<ImportFile[]>([]);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Fetch previous import results
  const importHistoryQuery = useQuery({
    queryKey: ['/api/imports'],
    queryFn: async () => {
      return apiRequest<ImportResult[]>('/api/imports', {
        method: 'GET',
      });
    }
  });

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: { fileId: string; formData: FormData }) => {
      return apiRequest<any>('/api/imports/upload', {
        method: 'POST',
        body: data.formData,
        isFormData: true,
      });
    },
    onSuccess: (result, variables) => {
      // Update file status
      setFiles(prev => 
        prev.map(file => 
          file.id === variables.fileId 
            ? { ...file, status: 'processing', progress: 50 } 
            : file
        )
      );

      // Process the file after upload
      processMutation.mutate({ fileId: variables.fileId, uploadId: result.uploadId });
    },
    onError: (error, variables) => {
      // Update file status to error
      setFiles(prev => 
        prev.map(file => 
          file.id === variables.fileId 
            ? { ...file, status: 'error', errorMessage: 'Upload failed' } 
            : file
        )
      );

      toast({
        title: 'Upload Failed',
        description: 'There was an error uploading your file. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Process file mutation
  const processMutation = useMutation({
    mutationFn: async (data: { fileId: string; uploadId: string }) => {
      return apiRequest<any>(`/api/imports/process/${data.uploadId}`, {
        method: 'POST',
      });
    },
    onSuccess: (result, variables) => {
      // Update file status to success
      setFiles(prev => 
        prev.map(file => 
          file.id === variables.fileId 
            ? { ...file, status: 'success', progress: 100, result } 
            : file
        )
      );

      // Add result to import results
      setImportResults(prev => [result, ...prev]);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/imports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });

      toast({
        title: 'Import Successful',
        description: `File processed successfully. ${result.importedEntities.properties} properties, ${result.importedEntities.comparables} comparables, and ${result.importedEntities.reports} reports imported.`,
      });

      // Switch to results tab
      setActiveTab('results');
    },
    onError: (error, variables) => {
      // Update file status to error
      setFiles(prev => 
        prev.map(file => 
          file.id === variables.fileId 
            ? { ...file, status: 'error', progress: 100, errorMessage: 'Processing failed' } 
            : file
        )
      );

      toast({
        title: 'Processing Failed',
        description: 'There was an error processing your file. Please try again or contact support.',
        variant: 'destructive',
      });
    },
  });

  // Dropzone callbacks
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Create file objects for each accepted file
    const newFiles = acceptedFiles.map(file => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      status: 'idle' as FileStatus,
      progress: 0,
    }));

    // Add files to state
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/xml': ['.xml'],
      'text/xml': ['.xml'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'application/json': ['.json'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB max
  });

  // Upload a file
  const uploadFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    // Update file status to uploading
    setFiles(prev => 
      prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'uploading', progress: 25 } 
          : f
      )
    );

    // Create form data
    const formData = new FormData();
    formData.append('file', file.file);
    formData.append('fileName', file.file.name);
    formData.append('fileType', file.file.type);

    // Upload file
    uploadMutation.mutate({ fileId, formData });
  };

  // Upload all files
  const uploadAllFiles = () => {
    files.forEach(file => {
      if (file.status === 'idle') {
        uploadFile(file.id);
      }
    });
  };

  // Remove a file
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Clear all files
  const clearFiles = () => {
    setFiles([]);
  };

  // Get status badge for a file
  const getStatusBadge = (status: FileStatus) => {
    switch (status) {
      case 'idle':
        return <Badge variant="outline">Ready</Badge>;
      case 'uploading':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Uploading</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Processing</Badge>;
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get file type icon and label
  const getFileTypeInfo = (file: File) => {
    const fileType = file.type as keyof typeof SUPPORTED_FORMATS;
    return SUPPORTED_FORMATS[fileType] || {
      label: 'Unknown Format',
      icon: <File className="h-6 w-6 text-gray-500" />,
    };
  };

  // Get import status badge
  const getImportStatusBadge = (status: ImportResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Success</Badge>;
      case 'partial':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Partial</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // View import details
  const viewImportDetails = (importId: string) => {
    // Navigate to import details page
    navigate(`/import/${importId}`);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Import Appraisal Reports</h1>
      
      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="results">Import Results</TabsTrigger>
        </TabsList>
        
        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Appraisal Reports</CardTitle>
              <CardDescription>
                Drag and drop appraisal report files or click to select files. Supported formats: PDF, XML, CSV, JSON.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
                }`}
              >
                <input {...getInputProps()} />
                <FileUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium">Drag files here or click to select</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Upload appraisal reports in PDF, XML (MISMO), CSV, or JSON format
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  Maximum file size: 50MB
                </p>
              </div>

              {files.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Files ({files.length})</h3>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={clearFiles}>
                        Clear All
                      </Button>
                      <Button size="sm" onClick={uploadAllFiles}>
                        Upload All
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {files.map(file => {
                      const fileTypeInfo = getFileTypeInfo(file.file);
                      return (
                        <div key={file.id} className="border rounded-md p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {fileTypeInfo.icon}
                              <div>
                                <p className="font-medium">{file.file.name}</p>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <span>{fileTypeInfo.label}</span>
                                  <span>•</span>
                                  <span>{(file.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              {getStatusBadge(file.status)}
                              {file.status === 'idle' ? (
                                <Button size="sm" onClick={() => uploadFile(file.id)}>
                                  Upload
                                </Button>
                              ) : file.status === 'error' ? (
                                <Button size="sm" variant="outline" onClick={() => uploadFile(file.id)}>
                                  Retry
                                </Button>
                              ) : file.status !== 'success' ? (
                                <div className="w-20 text-center text-sm">
                                  {file.progress}%
                                </div>
                              ) : (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                              {file.status !== 'uploading' && file.status !== 'processing' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => removeFile(file.id)}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          </div>

                          {(file.status === 'uploading' || file.status === 'processing') && (
                            <Progress value={file.progress} className="mt-2" />
                          )}

                          {file.status === 'error' && file.errorMessage && (
                            <Alert variant="destructive" className="mt-2">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Error</AlertTitle>
                              <AlertDescription>
                                {file.errorMessage}
                              </AlertDescription>
                            </Alert>
                          )}

                          {file.status === 'success' && file.result && (
                            <div className="mt-3 text-sm">
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span>
                                  Successfully imported {file.result.importedEntities.properties} properties, 
                                  {file.result.importedEntities.comparables} comparables, and 
                                  {file.result.importedEntities.reports} reports.
                                </span>
                              </div>
                              {file.result.warnings && file.result.warnings.length > 0 && (
                                <div className="flex items-center mt-1 text-yellow-600">
                                  <Info className="h-4 w-4 mr-1" />
                                  <span>{file.result.warnings.length} warnings</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4 bg-gray-50">
              <div className="text-sm text-gray-500 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Data from imported reports will be used to enhance the property database
              </div>
              <Button 
                disabled={files.length === 0 || files.every(f => f.status !== 'idle')} 
                onClick={uploadAllFiles}
              >
                Upload All Files
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Results Tab */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
              <CardDescription>
                View results of previous report imports and the extracted data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importHistoryQuery.isLoading ? (
                <div className="text-center py-8">Loading import history...</div>
              ) : importHistoryQuery.error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load import history. Please try again.
                  </AlertDescription>
                </Alert>
              ) : (importHistoryQuery.data?.length === 0 && importResults.length === 0) ? (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium">No imports yet</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Import appraisal reports to see the results here
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Properties</TableHead>
                      <TableHead>Comparables</TableHead>
                      <TableHead>Reports</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Show recent results first */}
                    {importResults.map(result => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">{result.fileName}</TableCell>
                        <TableCell>{result.format}</TableCell>
                        <TableCell>{new Date(result.dateProcessed).toLocaleString()}</TableCell>
                        <TableCell>{result.importedEntities.properties}</TableCell>
                        <TableCell>{result.importedEntities.comparables}</TableCell>
                        <TableCell>{result.importedEntities.reports}</TableCell>
                        <TableCell>{getImportStatusBadge(result.status)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => viewImportDetails(result.id)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Then show historical data */}
                    {importHistoryQuery.data?.map(result => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">{result.fileName}</TableCell>
                        <TableCell>{result.format}</TableCell>
                        <TableCell>{new Date(result.dateProcessed).toLocaleString()}</TableCell>
                        <TableCell>{result.importedEntities.properties}</TableCell>
                        <TableCell>{result.importedEntities.comparables}</TableCell>
                        <TableCell>{result.importedEntities.reports}</TableCell>
                        <TableCell>{getImportStatusBadge(result.status)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => viewImportDetails(result.id)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}