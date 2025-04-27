import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { PageLayout } from '@/components/layout/page-layout';
import { AppraisalWorkflow, AppraisalStep } from '@/components/workflow/AppraisalWorkflow';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Clipboard, FileText, ArrowLeft } from 'lucide-react';

// Demo data for testing
interface DemoAppraisal {
  id: string;
  name: string;
  currentStep: AppraisalStep;
  completedSteps: AppraisalStep[];
}

export default function WorkflowPage() {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const reportId = params?.reportId;
  
  // Mock data for demonstration purposes
  const [demoAppraisals] = useState<DemoAppraisal[]>([
    {
      id: "apr-1001",
      name: "123 Main St, Cityville",
      currentStep: AppraisalStep.FORM_COMPLETION,
      completedSteps: [
        AppraisalStep.ORDER_INTAKE,
        AppraisalStep.PROPERTY_DATA,
        AppraisalStep.SUBJECT_PHOTOS,
        AppraisalStep.COMPARABLE_SELECTION,
      ]
    },
    {
      id: "apr-998",
      name: "456 Oak Avenue, Townsburg",
      currentStep: AppraisalStep.REPORT_GENERATION,
      completedSteps: [
        AppraisalStep.ORDER_INTAKE,
        AppraisalStep.PROPERTY_DATA,
        AppraisalStep.SUBJECT_PHOTOS,
        AppraisalStep.COMPARABLE_SELECTION,
        AppraisalStep.FORM_COMPLETION,
        AppraisalStep.ADJUSTMENTS,
        AppraisalStep.COMPLIANCE_CHECK,
        AppraisalStep.FINAL_REVIEW,
      ]
    },
    {
      id: "new",
      name: "New Appraisal",
      currentStep: AppraisalStep.ORDER_INTAKE,
      completedSteps: []
    }
  ]);
  
  // Find the current appraisal based on reportId
  const currentAppraisal = reportId 
    ? demoAppraisals.find(appraisal => appraisal.id === reportId) 
    : demoAppraisals[2]; // Default to new appraisal
  
  // Set page title based on current appraisal
  const pageTitle = currentAppraisal?.id !== "new" 
    ? `Appraisal Workflow: ${currentAppraisal?.name}` 
    : "New Appraisal Workflow";
  
  const pageDescription = "Follow this guided workflow to complete your appraisal report";
  
  return (
    <PageLayout
      title={pageTitle}
      description={pageDescription}
      backUrl="/"
      backText="Dashboard"
      actions={
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              console.log("Form view clicked");
              setLocation('/uad-form');
            }}
            className="hidden sm:flex"
          >
            <Clipboard className="mr-2 h-4 w-4" />
            Form View
          </Button>
          <Button 
            onClick={() => {
              console.log("Generate Report clicked");
              setLocation('/reports');
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {!currentAppraisal ? (
          <div className="text-center p-8">
            <div className="mb-4 text-muted-foreground">No appraisal report selected.</div>
            <Button 
              onClick={() => setLocation('/workflow/new')}
              size="lg"
            >
              Start New Appraisal
            </Button>
            <div className="mt-4">
              <Button 
                variant="outline"
                onClick={() => setLocation('/')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs for different active appraisals */}
            {demoAppraisals.length > 1 && (
              <Tabs defaultValue={currentAppraisal.id} className="w-full">
                <TabsList className="mb-4 w-full justify-start">
                  {demoAppraisals.map((appraisal) => (
                    <TabsTrigger 
                      key={appraisal.id} 
                      value={appraisal.id}
                      onClick={() => setLocation(`/workflow/${appraisal.id}`)}
                    >
                      {appraisal.id === "new" ? "New Appraisal" : appraisal.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
            
            {/* Main workflow component */}
            <AppraisalWorkflow 
              currentReportId={currentAppraisal.id !== "new" ? currentAppraisal.id : undefined}
              currentStep={currentAppraisal.currentStep}
              completedSteps={currentAppraisal.completedSteps}
            />
          </>
        )}
      </div>
    </PageLayout>
  );
}