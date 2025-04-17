import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppraisal } from '@/contexts/AppraisalContext';
import { AppraisalReport } from '@shared/schema';

export default function ReportsPage() {
  const { 
    currentReport, 
    currentProperty, 
    comparables, 
    photos, 
    complianceChecks, 
    generatePDF, 
    generateXML 
  } = useAppraisal();
  
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'xml'>('pdf');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportLoading, setExportLoading] = useState(false);
  const [generatedFileUrl, setGeneratedFileUrl] = useState<string | null>(null);

  // Checks if the report is complete enough to export
  const checkReportCompleteness = useCallback((report: AppraisalReport | null) => {
    if (!report || !currentProperty) return 0;
    
    let score = 0;
    const totalPoints = 5; // Property, report details, comparables, photos, compliance
    
    // Property information
    if (currentProperty.address && 
        currentProperty.city && 
        currentProperty.state && 
        currentProperty.zipCode) {
      score += 1;
    }
    
    // Report details
    if (report.purpose && 
        report.effectiveDate && 
        report.clientName) {
      score += 1;
    }
    
    // Comparables
    if (comparables.length >= 3) {
      score += 1;
    }
    
    // Photos
    if (photos.length >= 3) {
      score += 1;
    }
    
    // Compliance
    if (complianceChecks.length > 0 && 
        complianceChecks.filter(check => check.status === 'pass').length > 
        complianceChecks.filter(check => check.status === 'fail').length) {
      score += 1;
    }
    
    return (score / totalPoints) * 100;
  }, [currentProperty, comparables, photos, complianceChecks]);

  // Handle export report
  const handleExportReport = useCallback(async () => {
    if (!currentReport) return;
    
    try {
      setExportLoading(true);
      setExportProgress(10);
      
      // Simulate progress for better UX
      const interval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      let fileData;
      let fileName;
      let mimeType;
      
      if (exportType === 'pdf') {
        fileData = await generatePDF(currentReport.id);
        fileName = `appraisal-report-${currentReport.id}.pdf`;
        mimeType = 'application/pdf';
      } else {
        const xmlText = await generateXML(currentReport.id);
        fileData = new Blob([xmlText], { type: 'application/xml' });
        fileName = `appraisal-report-${currentReport.id}.xml`;
        mimeType = 'application/xml';
      }
      
      // Create a download URL
      const url = URL.createObjectURL(fileData);
      setGeneratedFileUrl(url);
      
      clearInterval(interval);
      setExportProgress(100);
      
      // Add a small delay before removing loading state for UX
      setTimeout(() => {
        setExportLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error exporting report:', error);
      setExportLoading(false);
      setExportProgress(0);
      alert('Error exporting report. Please try again.');
    }
  }, [currentReport, exportType, generatePDF, generateXML]);

  // Download the generated file
  const handleDownloadFile = useCallback(() => {
    if (!generatedFileUrl || !currentReport) return;
    
    const fileName = exportType === 'pdf' 
      ? `appraisal-report-${currentReport.id}.pdf`
      : `appraisal-report-${currentReport.id}.xml`;
      
    const link = document.createElement('a');
    link.href = generatedFileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Close the dialog
    setExportDialogOpen(false);
    // Clean up the generated URL
    URL.revokeObjectURL(generatedFileUrl);
    setGeneratedFileUrl(null);
    setExportProgress(0);
  }, [generatedFileUrl, currentReport, exportType]);

  if (!currentReport || !currentProperty) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>Loading data...</p>
      </div>
    );
  }

  // Calculate completeness
  const completenessScore = checkReportCompleteness(currentReport);
  
  // Compliance checks summary
  const passedChecks = complianceChecks.filter(check => check.status === 'pass').length;
  const failedChecks = complianceChecks.filter(check => check.status === 'fail').length;
  const warningChecks = complianceChecks.filter(check => check.status === 'warning').length;
  const totalChecks = complianceChecks.length;
  
  const requirementsMet = completenessScore >= 80;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-neutral-medium p-4 flex justify-between items-center">
        <h2 className="text-lg font-medium">Report Generation</h2>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setExportDialogOpen(true)}
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Export Report
          </Button>
          
          <Button 
            size="sm"
            disabled={!requirementsMet}
            onClick={() => setFinishDialogOpen(true)}
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Finalize Report
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6 bg-neutral-lightest">
        <div className="max-w-5xl mx-auto">
          {/* Report Completeness Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Report Completeness</CardTitle>
              <CardDescription>
                Your report is {completenessScore.toFixed(0)}% complete. 
                {!requirementsMet && ' Complete at least 80% before finalizing.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={completenessScore} className="h-2" />
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Property Information</span>
                    <span className={currentProperty.address ? 'text-status-success' : 'text-status-error'}>
                      {currentProperty.address ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Report Details</span>
                    <span className={currentReport.purpose ? 'text-status-success' : 'text-status-error'}>
                      {currentReport.purpose ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Comparable Properties</span>
                    <span className={comparables.length >= 3 ? 'text-status-success' : 'text-status-error'}>
                      {comparables.length}/3 Required
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Property Photos</span>
                    <span className={photos.length >= 3 ? 'text-status-success' : 'text-status-error'}>
                      {photos.length}/3 Required
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Compliance Checks</span>
                    <span className={totalChecks > 0 ? 'text-status-success' : 'text-status-warning'}>
                      {totalChecks > 0 ? `${passedChecks}/${totalChecks} Passed` : 'Not Run'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Market Value</span>
                    <span className={currentReport.marketValue ? 'text-status-success' : 'text-status-error'}>
                      {currentReport.marketValue 
                        ? `$${Number(currentReport.marketValue).toLocaleString()}` 
                        : 'Not Set'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Report Options */}
          <Tabs defaultValue="export" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="export">Export Options</TabsTrigger>
              <TabsTrigger value="delivery">Delivery Options</TabsTrigger>
              <TabsTrigger value="settings">Report Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="export" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Export Report</CardTitle>
                  <CardDescription>
                    Export your appraisal report in various formats
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="hover:shadow-md cursor-pointer transition-shadow">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">PDF Report</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm text-neutral-gray">Standard PDF format for printing and sharing</p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => {
                          setExportType('pdf');
                          setExportDialogOpen(true);
                        }}>
                          Export PDF
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card className="hover:shadow-md cursor-pointer transition-shadow">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">MISMO XML</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm text-neutral-gray">Industry standard format for lender submission</p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => {
                          setExportType('xml');
                          setExportDialogOpen(true);
                        }}>
                          Export XML
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card className="hover:shadow-md cursor-pointer transition-shadow">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">Submit to Lender</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm text-neutral-gray">Directly submit to lender portal systems</p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-end">
                        <Button variant="outline" size="sm" disabled>
                          Coming Soon
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="delivery" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Options</CardTitle>
                  <CardDescription>
                    Configure how your report will be delivered
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="client-email">Client Email</Label>
                        <Input 
                          id="client-email" 
                          placeholder="client@example.com" 
                          type="email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lender-email">Lender Email</Label>
                        <Input 
                          id="lender-email" 
                          placeholder="lender@example.com" 
                          type="email"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="delivery-message">Delivery Message</Label>
                      <Textarea 
                        id="delivery-message" 
                        placeholder="Enter a message to include with the delivery"
                        className="h-24"
                      />
                    </div>
                    
                    <Button className="w-full">Save Delivery Options</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Report Settings</CardTitle>
                  <CardDescription>
                    Configure report settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company-name">Company Name</Label>
                        <Input 
                          id="company-name" 
                          placeholder="Your Company" 
                          defaultValue={currentReport.lenderName || ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="appraiser-name">Appraiser Name</Label>
                        <Input 
                          id="appraiser-name" 
                          placeholder="Your Name"
                          defaultValue="John Appraiser" 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="report-disclaimer">Report Disclaimer</Label>
                      <Textarea 
                        id="report-disclaimer" 
                        placeholder="Enter report disclaimer text"
                        className="h-24"
                        defaultValue="This appraisal report is subject to the following scope of work, intended use, intended user, definition of market value, statement of assumptions and limiting conditions, and certifications."
                      />
                    </div>
                    
                    <Button className="w-full">Save Report Settings</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Export Report as {exportType === 'pdf' ? 'PDF' : 'MISMO XML'}
            </DialogTitle>
            <DialogDescription>
              {exportType === 'pdf' 
                ? 'Generate a PDF report that can be printed or shared with clients.'
                : 'Generate a MISMO XML file for submission to lenders or government agencies.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {exportLoading ? (
              <div className="space-y-4">
                <Progress value={exportProgress} className="h-2" />
                <p className="text-center text-sm text-neutral-gray">
                  {exportProgress < 100 
                    ? `Generating ${exportType.toUpperCase()}...`
                    : `${exportType.toUpperCase()} generated successfully!`}
                </p>
              </div>
            ) : generatedFileUrl ? (
              <div className="space-y-4">
                <div className="p-6 border border-neutral-medium rounded-md bg-neutral-lightest text-center">
                  <svg className="h-12 w-12 mx-auto mb-2 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <p>Your {exportType.toUpperCase()} file is ready to download!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 border border-neutral-medium rounded-md">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="include-photos" defaultChecked className="rounded" />
                    <Label htmlFor="include-photos">Include Photos</Label>
                  </div>
                  
                  {exportType === 'pdf' && (
                    <div className="flex items-center space-x-2 mt-2">
                      <input type="checkbox" id="include-sketches" defaultChecked className="rounded" />
                      <Label htmlFor="include-sketches">Include Sketches</Label>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border border-neutral-medium rounded-md">
                  <h4 className="font-medium mb-2">Report Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Property Address:</div>
                    <div>{currentProperty.address}, {currentProperty.city}, {currentProperty.state}</div>
                    
                    <div>Report Type:</div>
                    <div>{currentReport.formType}</div>
                    
                    <div>Effective Date:</div>
                    <div>{currentReport.effectiveDate ? new Date(currentReport.effectiveDate).toLocaleDateString() : 'Not set'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            {generatedFileUrl ? (
              <Button onClick={handleDownloadFile}>Download {exportType.toUpperCase()}</Button>
            ) : (
              <Button 
                onClick={handleExportReport} 
                disabled={exportLoading}
              >
                {exportLoading ? 'Exporting...' : `Export as ${exportType.toUpperCase()}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Finalize Report Dialog */}
      <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize Appraisal Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to finalize this report? This will mark the report as complete and ready for delivery.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="p-4 border border-neutral-medium rounded-md bg-neutral-lightest">
              <h4 className="font-medium mb-2">Report Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Property Address:</div>
                <div>{currentProperty.address}, {currentProperty.city}, {currentProperty.state}</div>
                
                <div>Report Type:</div>
                <div>{currentReport.formType}</div>
                
                <div>Market Value:</div>
                <div>{currentReport.marketValue ? `$${Number(currentReport.marketValue).toLocaleString()}` : 'Not set'}</div>
                
                <div>Compliance Checks:</div>
                <div>
                  <span className="text-status-success">{passedChecks} passed</span>,&nbsp;
                  <span className="text-status-error">{failedChecks} failed</span>,&nbsp;
                  <span className="text-status-warning">{warningChecks} warnings</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="finalize-notes">Additional Notes</Label>
              <Textarea 
                id="finalize-notes" 
                placeholder="Enter any additional notes about this report"
                className="h-24"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinishDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // In a real application, this would update the report status
              alert('Report finalized successfully!');
              setFinishDialogOpen(false);
            }}>
              Finalize Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
