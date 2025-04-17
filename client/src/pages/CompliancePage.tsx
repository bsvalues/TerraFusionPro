import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAppraisal } from '@/contexts/AppraisalContext';
import { ComplianceCheck } from '@shared/schema';

// Component to display a single compliance check
function ComplianceCheckItem({ check }: { check: ComplianceCheck }) {
  const statusColors = {
    pass: 'text-status-success bg-status-success/10 border-status-success/30',
    fail: 'text-status-error bg-status-error/10 border-status-error/30',
    warning: 'text-accent bg-accent/10 border-accent/30',
  };
  
  const statusIcons = {
    pass: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    ),
    fail: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  };
  
  const severityBadges = {
    critical: 'bg-status-error text-white',
    high: 'bg-status-error/80 text-white',
    medium: 'bg-accent text-white',
    low: 'bg-accent/80 text-white',
  };

  return (
    <div className={`p-4 border rounded-md mb-2 ${statusColors[check.status as keyof typeof statusColors]}`}>
      <div className="flex items-start">
        <div className="mr-3 mt-0.5">
          {statusIcons[check.status as keyof typeof statusIcons]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{check.checkType}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${severityBadges[check.severity as keyof typeof severityBadges]}`}>
              {check.severity}
            </span>
          </div>
          <p className="text-sm mt-1">{check.message}</p>
          {check.field && (
            <p className="text-xs mt-1">Field: {check.field}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CompliancePage() {
  const { 
    currentReport, 
    complianceChecks, 
    validateCompliance 
  } = useAppraisal();
  
  const [runningChecks, setRunningChecks] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Group compliance checks by type
  const groupedChecks = complianceChecks.reduce((acc, check) => {
    const type = check.checkType.toLowerCase();
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(check);
    return acc;
  }, {} as Record<string, ComplianceCheck[]>);
  
  // Filter checks based on active tab
  const filteredChecks = activeTab === 'all' 
    ? complianceChecks 
    : activeTab === 'issues'
      ? complianceChecks.filter(check => check.status === 'fail')
      : complianceChecks.filter(check => check.checkType.toLowerCase() === activeTab);
  
  // Compliance stats
  const totalChecks = complianceChecks.length;
  const passedChecks = complianceChecks.filter(check => check.status === 'pass').length;
  const failedChecks = complianceChecks.filter(check => check.status === 'fail').length;
  const warningChecks = complianceChecks.filter(check => check.status === 'warning').length;
  
  // Available check types
  const checkTypes = Array.from(new Set(complianceChecks.map(check => 
    check.checkType.toLowerCase()
  )));
  
  // Calculate compliance score
  const complianceScore = totalChecks > 0 
    ? Math.round((passedChecks / totalChecks) * 100) 
    : 0;
  
  // Run all compliance checks
  const runComplianceChecks = async () => {
    if (!currentReport) return;
    
    setRunningChecks(true);
    
    try {
      await validateCompliance(currentReport.id, ['UAD', 'USPAP', 'Client-Specific']);
    } catch (error) {
      console.error('Error running compliance checks:', error);
    } finally {
      setRunningChecks(false);
    }
  };

  // Determine score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-status-success';
    if (score >= 70) return 'text-accent';
    return 'text-status-error';
  };

  if (!currentReport) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-neutral-medium p-4 flex justify-between items-center">
        <h2 className="text-lg font-medium">Compliance Checks</h2>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={runComplianceChecks}
            disabled={runningChecks}
          >
            {runningChecks ? 'Running Checks...' : 'Run Compliance Checks'}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-5xl mx-auto">
          {/* Compliance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Compliance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(complianceScore)}`}>
                  {complianceScore}%
                </div>
                <Progress value={complianceScore} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Checks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {totalChecks}
                </div>
                <div className="text-sm text-neutral-gray mt-2">
                  {checkTypes.map(type => type.toUpperCase()).join(', ')}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Passed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-status-success">
                  {passedChecks}
                </div>
                <div className="text-sm text-neutral-gray mt-2">
                  {Math.round((passedChecks / Math.max(1, totalChecks)) * 100)}% of all checks
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-status-error">
                  {failedChecks}
                </div>
                <div className="text-sm text-neutral-gray mt-2">
                  {warningChecks > 0 && `+${warningChecks} warnings`}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Compliance Checks Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Details</CardTitle>
              <CardDescription>
                Review compliance issues and warnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Checks ({totalChecks})</TabsTrigger>
                  <TabsTrigger value="issues">Issues ({failedChecks})</TabsTrigger>
                  {checkTypes.map(type => (
                    <TabsTrigger key={type} value={type}>
                      {type.toUpperCase()} ({groupedChecks[type]?.length || 0})
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                <TabsContent value={activeTab} className="mt-0">
                  {filteredChecks.length > 0 ? (
                    <div>
                      {filteredChecks.map((check) => (
                        <ComplianceCheckItem key={check.id} check={check} />
                      ))}
                    </div>
                  ) : complianceChecks.length === 0 ? (
                    <div className="text-center p-6 text-neutral-gray">
                      <svg className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <p>No compliance checks have been run yet</p>
                      <Button 
                        className="mt-4"
                        onClick={runComplianceChecks}
                        disabled={runningChecks}
                      >
                        Run Compliance Checks
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-neutral-gray">
                      <p>No {activeTab === 'issues' ? 'issues' : activeTab} found</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Compliance Standards */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Compliance Standards</CardTitle>
              <CardDescription>
                Learn about the compliance standards being checked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border p-4 rounded-md">
                  <h3 className="font-medium text-lg mb-2">UAD (Uniform Appraisal Dataset)</h3>
                  <p className="text-sm text-neutral-gray">
                    The Uniform Appraisal Dataset defines standardized data points, formats, and responses that are required for residential appraisal reports. It was established by Fannie Mae and Freddie Mac to improve data quality and consistency.
                  </p>
                  <a 
                    href="https://singlefamily.fanniemae.com/media/9156/display" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline mt-2 inline-block"
                  >
                    Learn more about UAD
                  </a>
                </div>
                
                <div className="border p-4 rounded-md">
                  <h3 className="font-medium text-lg mb-2">USPAP (Uniform Standards of Professional Appraisal Practice)</h3>
                  <p className="text-sm text-neutral-gray">
                    USPAP contains standards for all types of appraisal services, including real estate, personal property, business and mass appraisal. Compliance with USPAP is required by professional appraisal associations, client groups, and by state law.
                  </p>
                  <a 
                    href="https://www.appraisalfoundation.org/TAF/Standards/USPAP/TAF/USPAP.aspx" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline mt-2 inline-block"
                  >
                    Learn more about USPAP
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
