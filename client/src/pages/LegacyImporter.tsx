import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Database } from "lucide-react";

export default function LegacyImporter() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleUpload = async () => {
    if (selectedFiles && selectedFiles.length > 0) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        Array.from(selectedFiles).forEach(file => {
          formData.append('files', file);
        });
        
        const response = await fetch('/api/legacy-import/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          setSelectedFiles(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          alert('Files uploaded successfully!');
        } else {
          alert('Upload failed');
        }
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Upload failed');
      } finally {
        setIsUploading(false);
      }
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
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? 'Uploading...' : 'Upload Files'}
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
              <div className="text-center p-8 text-muted-foreground">
                <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No import jobs yet. Upload some files to get started.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}