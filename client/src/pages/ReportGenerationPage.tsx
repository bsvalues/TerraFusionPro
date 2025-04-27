import React, { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { PageLayout } from '@/components/layout/page-layout';
import { ReportGeneration } from '@/components/workflow/ReportGeneration';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  ArrowLeft, 
  Check, 
  AlertTriangle, 
  ChevronRight,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReportGenerationPage() {
  const [_, setLocation] = useLocation();
  const params = useParams();
  const reportId = params?.reportId || 'apr-1001';
  const { toast } = useToast();
  
  // Mock property address
  const [propertyAddress, setPropertyAddress] = useState('123 Main St, Cityville, CA 90210');
  
  // Mock compliance state
  const [isCompliant, setIsCompliant] = useState(true);
  
  // Handler for PDF generation
  const handleGeneratePdf = () => {
    toast({
      title: "PDF Generated Successfully",
      description: "Your appraisal report PDF is ready for download or delivery.",
      variant: "success"
    });
  };
  
  // Handler for XML generation
  const handleGenerateXml = () => {
    toast({
      title: "MISMO XML Generated",
      description: "The XML file is ready for submission to GSE systems.",
      variant: "success"
    });
  };
  
  // Handler for email sending
  const handleSendEmail = () => {
    toast({
      title: "Email Delivery Initiated",
      description: "Your report is being sent to the client.",
      variant: "default"
    });
  };
  
  // Handler for printing
  const handlePrint = () => {
    toast({
      title: "Preparing Print Version",
      description: "The report is being prepared for printing.",
      variant: "default"
    });
  };
  
  // Handler for CSV export
  const handleExportCsv = () => {
    toast({
      title: "CSV Export Ready",
      description: "Your data has been exported in CSV format.",
      variant: "default"
    });
  };
  
  return (
    <PageLayout
      title="Report Generation"
      description="Generate and deliver your appraisal report"
      backUrl={`/workflow/${reportId}`}
      backText="Return to Workflow"
      actions={
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setLocation(`/workflow/${reportId}`);
            }}
            className="hidden sm:flex"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Workflow
          </Button>
          <Button 
            onClick={() => {
              setLocation(`/compliance/${reportId}`);
            }}
          >
            {isCompliant ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Compliance Verified
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Review Compliance
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Property Info Summary */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Generate Report for Property</CardTitle>
              <Badge variant="outline">Report #{reportId}</Badge>
            </div>
            <CardDescription>{propertyAddress}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={isCompliant ? "success" : "destructive"} className="px-2 py-1">
                {isCompliant ? (
                  <>
                    <Check className="mr-1 h-3 w-3" />
                    <span>Compliant</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    <span>Non-Compliant</span>
                  </>
                )}
              </Badge>
              
              <Badge variant="outline" className="px-2 py-1">
                Single Family
              </Badge>
              
              <Badge variant="outline" className="px-2 py-1">
                Form 1004
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        {/* Report Generation Component */}
        <ReportGeneration 
          reportId={reportId}
          propertyAddress={propertyAddress}
          isCompliant={isCompliant}
          onGeneratePdf={handleGeneratePdf}
          onGenerateXml={handleGenerateXml}
          onSendEmail={handleSendEmail}
          onPrint={handlePrint}
          onExportCsv={handleExportCsv}
        />
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button 
            variant="outline"
            onClick={() => setLocation(`/workflow/${reportId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Workflow
          </Button>
          <Button 
            onClick={() => setLocation(`/delivery/${reportId}`)}
          >
            Proceed to Delivery
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}