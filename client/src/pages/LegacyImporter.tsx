import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Database, CheckCircle, AlertCircle, Eye, MapPin } from "lucide-react";

export default function LegacyImporter() {
  const [currentStep, setCurrentStep] = useState(0);
  const [jobName, setJobName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [systemType, setSystemType] = useState("");
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const steps = ['Upload', 'Extract', 'Map Fields', 'Preview', 'Import'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || !jobName.trim()) return;
    
    setIsProcessing(true);
    setProgress(20);
    
    setTimeout(() => {
      setProgress(50);
      setCurrentStep(1);
      setIsProcessing(false);
    }, 1500);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setProgress((currentStep + 2) * 20);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setProgress((currentStep) * 20);
    }
  };

  const resetWorkflow = () => {
    setCurrentStep(0);
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
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              {steps.map((step, index) => (
                <div key={index} className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                  `}>
                    {index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${index < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
            </div>
            {progress > 0 && (
              <Progress value={progress} className="w-full" />
            )}
          </div>

          {/* Step Content */}
          {currentStep === 0 && (
            <div className="space-y-6">
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
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
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
                    <CardTitle className="text-sm">File Processing Status</CardTitle>
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

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Proceed to Field Mapping
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="systemType">Select Legacy System Type</Label>
                <select
                  id="systemType"
                  value={systemType}
                  onChange={(e) => setSystemType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Choose detected system</option>
                  <option value="TOTAL">TOTAL</option>
                  <option value="CLICKFORMS">ClickForms</option>
                  <option value="ACI">ACI</option>
                  <option value="DATAMASTER">DataMaster</option>
                  <option value="ALAMODE">Alamode</option>
                  <option value="CUSTOM">Custom Mapping</option>
                </select>
              </div>

              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Field mapping templates will be auto-generated based on detected system type.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleNext} 
                  disabled={!systemType}
                  className="flex-1"
                >
                  Generate Field Mappings
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
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
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back to Mapping
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Approve & Import All
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
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
          )}

          {/* Recent Import Jobs */}
          {currentStep === 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Recent Import Jobs</h3>
              <div className="space-y-3">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Q4 2024 TOTAL Legacy Import</p>
                      <p className="text-sm text-muted-foreground">
                        1,250/1,250 records • Dec 15, 2024 • Systems: TOTAL, ClickForms
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">COMPLETED</Badge>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">ACI Data Migration</p>
                      <p className="text-sm text-muted-foreground">
                        420/875 records • Dec 20, 2024 • Systems: ACI
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800">PROCESSING</Badge>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}