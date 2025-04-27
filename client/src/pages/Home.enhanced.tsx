import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { PageLayout } from '@/components/layout/page-layout';
import { Plus, FileText, ArrowRight } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useEffect } from 'react';

export default function EnhancedHome() {
  const [_, setLocation] = useLocation();
  const { startLoading, stopLoading, setError, clearError, startSync, syncSuccess } = useApp();
  
  console.log("Enhanced Home component rendering");

  // Simulate loading on initial render
  useEffect(() => {
    const loadDashboard = async () => {
      startLoading("Loading dashboard data...");
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate sync process
      startSync(5);
      await new Promise(resolve => setTimeout(resolve, 500));
      syncSuccess();
      
      stopLoading();
    };
    
    loadDashboard();
    
    // Clean up
    return () => {
      stopLoading();
      clearError();
    };
  }, []);

  return (
    <PageLayout
      title="Welcome to AppraisalCore"
      description="Your all-in-one real estate appraisal platform"
      showSyncStatus={true}
      actions={
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              console.log("Create New Report clicked");
              setLocation('/form');
            }}
            className="hidden sm:flex"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
          <Button 
            onClick={() => {
              console.log("Load Demo Report clicked");
              setLocation('/form');
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Load Demo
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Begin a new appraisal or continue working on an existing one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              You don't have any active appraisal reports. Create a new one to get started or load a demo report.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  console.log("Load Demo Report clicked");
                  setLocation('/form');
                }}
              >
                Load Demo Report
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log("Create New Report clicked");
                  setLocation('/form');
                }}
              >
                Create New Report
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="group hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle>Desktop Form-Filler</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Complete appraisal forms with embedded spreadsheet-style worksheets that auto-calculate adjustments and market values.
              </p>
              <Button 
                variant="ghost" 
                className="group-hover:translate-x-1 transition-transform"
                onClick={() => setLocation('/form')}
              >
                <span>Use Form Filler</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle>Mobile Inspection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Capture property details, photos, and measurements with our mobile app - even without internet connection.
              </p>
              <Button 
                variant="ghost" 
                className="group-hover:translate-x-1 transition-transform"
                onClick={() => setLocation('/photo-sync-test')}
              >
                <span>View TerraField Sync</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle>Reports & Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Generate professional PDF reports and MISMO XML exports while ensuring compliance with industry standards.
              </p>
              <Button 
                variant="ghost" 
                className="group-hover:translate-x-1 transition-transform"
                onClick={() => setLocation('/compliance')}
              >
                <span>Check Compliance</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}