import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Database, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImportJob {
  id: number;
  jobName: string;
  status: string;
  uploadedFiles: any[];
  detectedFormats: string[];
  processedRecords: number;
  totalRecords: number;
  createdAt: string;
  errorLogs: any[];
}

export default function LegacyImporter() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch import jobs for current user
  const { data: importJobs = [], isLoading } = useQuery({
    queryKey: ["/api/legacy-import/jobs", { userId: 1 }],
    queryFn: async () => {
      const response = await fetch('/api/legacy-import/jobs?userId=1');
      if (!response.ok) {
        throw new Error('Failed to fetch import jobs');
      }
      return response.json();
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('userId', '1'); // Default user for demo
      formData.append('jobName', `Import ${new Date().toLocaleDateString()}`);

      const response = await fetch('/api/legacy-import/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legacy-import/jobs"] });
      setSelectedFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({
        title: "Upload Successful",
        description: "Your files have been uploaded and are being processed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleUpload = () => {
    if (selectedFiles && selectedFiles.length > 0) {
      uploadMutation.mutate(selectedFiles);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'processing':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      case 'processing':
        return <Clock className="w-4 h-4 animate-spin" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Legacy Data Importer</h1>
        <p className="text-muted-foreground mt-2">
          Import data from legacy appraisal systems including SQLite databases, XML files, and various formats
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="jobs">Import Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Legacy Files
              </CardTitle>
              <CardDescription>
                Select files from your legacy appraisal system. Supported formats include SQLite databases (.sqlite, .db), 
                XML files, CSV files, and compressed archives (.zip).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".sqlite,.db,.sqlite3,.xml,.csv,.zip,.sql,.xlsx,.xls,.pdf"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-4"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Select Files
                </Button>
                <p className="text-sm text-muted-foreground">
                  Or drag and drop files here
                </p>
              </div>

              {selectedFiles && selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Selected Files:</h4>
                  {Array.from(selectedFiles).map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  ))}
                  <Button
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    className="w-full"
                  >
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload Files'}
                  </Button>
                </div>
              )}

              <Alert>
                <Database className="w-4 h-4" />
                <AlertDescription>
                  <strong>Supported Systems:</strong> TOTAL by a la mode, ClickForms, ACI DataMaster, 
                  CompsImporter backups, and other legacy appraisal software databases.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <CardDescription>
                View and manage your file import jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center p-4">Loading import jobs...</div>
              ) : importJobs.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No import jobs yet. Upload some files to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {importJobs.map((job: ImportJob) => (
                    <Card key={job.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(job.status)}
                            <div>
                              <h4 className="font-medium">{job.jobName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(job.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                            {job.totalRecords > 0 && (
                              <span className="text-sm text-muted-foreground">
                                {job.processedRecords}/{job.totalRecords} records
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {job.totalRecords > 0 && (
                          <div className="mt-3">
                            <Progress 
                              value={(job.processedRecords / job.totalRecords) * 100} 
                              className="w-full"
                            />
                          </div>
                        )}

                        {job.detectedFormats && job.detectedFormats.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {job.detectedFormats.map((format, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {format}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {job.errorLogs && job.errorLogs.length > 0 && (
                          <Alert className="mt-3">
                            <AlertCircle className="w-4 h-4" />
                            <AlertDescription>
                              {job.errorLogs.length} errors encountered during processing
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}