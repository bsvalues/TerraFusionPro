import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { PageLayout } from '@/components/layout/page-layout';
import { AIFeatureIntro } from '@/components/home/AIFeatureIntro';
import NotificationPanel, { Notification } from '@/components/notifications/NotificationPanel';
import { 
  Plus, 
  FileText, 
  ArrowRight, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  CircleDashed,
  FileBarChart2,
  Building2,
  ClipboardList,
  Image,
  PencilRuler,
  ArrowUpDown,
  MailPlus,
  Brain,
  BookOpen,
  Layers,
  ShieldCheck,
  Home as HomeIcon,
  LayoutDashboard,
  BarChart
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useEffect, useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ProfileMiniCard } from '@/components/gamification/ProfileMiniCard';

// Interface for active appraisal reports
interface AppraisalReport {
  id: string;
  address: string;
  type: string;
  clientName: string;
  dueDate: string;
  status: 'draft' | 'in-progress' | 'review' | 'completed';
  progress: number;
  lastUpdated: string;
}

// Using the Notification type from our NotificationPanel component

// Component for displaying status badge
function StatusBadge({ status }: { status: AppraisalReport['status'] }) {
  const variants = {
    'draft': { variant: 'outline', icon: <CircleDashed className="h-3 w-3 mr-1" /> },
    'in-progress': { variant: 'secondary', icon: <Clock className="h-3 w-3 mr-1" /> },
    'review': { variant: 'default', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
    'completed': { variant: 'success', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
  };

  const { variant, icon } = variants[status];
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');

  return (
    <Badge variant={variant as any} className="flex items-center">
      {icon}
      <span>{label}</span>
    </Badge>
  );
}

// Main Dashboard Component
export default function EnhancedHome() {
  const [_, setLocation] = useLocation();
  const { startLoading, stopLoading, setError, clearError, startSync, syncSuccess, state } = useApp();
  const [activeReports, setActiveReports] = useState<AppraisalReport[]>([]);
  const [recentReports, setRecentReports] = useState<AppraisalReport[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Notification handlers
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };
  
  const handleDismissNotification = (id: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  };
  
  console.log("Home component rendering");

  // Simulate loading on initial render
  useEffect(() => {
    const loadDashboard = async () => {
      startLoading("Loading dashboard data...");
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Load mock data for demonstration
      setActiveReports([
        {
          id: "apr-1001",
          address: "123 Main St, Cityville, CA 90210",
          type: "Single Family",
          clientName: "First National Bank",
          dueDate: "2025-05-15",
          status: 'in-progress',
          progress: 65,
          lastUpdated: "2025-04-25"
        },
        {
          id: "apr-998",
          address: "456 Oak Avenue, Townsburg, CA 90211",
          type: "Condominium",
          clientName: "Homeward Mortgage",
          dueDate: "2025-05-02",
          status: 'review',
          progress: 92,
          lastUpdated: "2025-04-26"
        }
      ]);
      
      setRecentReports([
        {
          id: "apr-997",
          address: "789 Pine Road, Villageton, CA 90212",
          type: "Multi-Family",
          clientName: "Unity Credit Union",
          dueDate: "2025-04-20",
          status: 'completed',
          progress: 100,
          lastUpdated: "2025-04-19"
        },
        {
          id: "apr-995",
          address: "321 Cedar Lane, Hamletville, CA 90213",
          type: "Single Family",
          clientName: "Regional Bank Trust",
          dueDate: "2025-04-15",
          status: 'completed',
          progress: 100,
          lastUpdated: "2025-04-14"
        }
      ]);
      
      setNotifications([
        {
          id: "notif-1",
          type: "compliance",
          message: "Appraisal #apr-998 requires compliance review before submission",
          date: "2025-04-26",
          read: false,
          importance: "high",
          aiGenerated: true
        },
        {
          id: "notif-2",
          type: "reminder",
          message: "Appraisal #apr-1001 due in 18 days",
          date: "2025-04-27",
          read: true,
          importance: "medium"
        },
        {
          id: "notif-3",
          type: "update",
          message: "TerraField mobile app synced 15 new photos for 123 Main St",
          date: "2025-04-25",
          read: true
        },
        {
          id: "notif-4",
          type: "insight",
          message: "AI analysis detected a 3.2% valuation variance in comparable selection",
          date: "2025-04-26",
          read: false,
          importance: "high",
          aiGenerated: true
        },
        {
          id: "notif-5",
          type: "market",
          message: "Market trend analysis shows price stability in the subject property zone",
          date: "2025-04-25",
          read: false,
          importance: "medium",
          aiGenerated: true
        }
      ]);
      
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

  const renderAppraisalCard = (report: AppraisalReport) => (
    <Card key={report.id} className="group hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="mb-1 font-normal">
            {report.type}
          </Badge>
          <StatusBadge status={report.status} />
        </div>
        <CardTitle className="text-lg">{report.address}</CardTitle>
        <CardDescription>
          Client: {report.clientName}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Due: {new Date(report.dueDate).toLocaleDateString()}</span>
            <span>Last updated: {new Date(report.lastUpdated).toLocaleDateString()}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Progress</span>
              <span>{report.progress}%</span>
            </div>
            <Progress value={report.progress} className="h-2" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-1">
        <Button 
          variant="ghost" 
          className="text-xs h-8 px-2 mr-1"
          onClick={() => setLocation(`/property/${report.id}`)}
        >
          <Building2 className="h-3.5 w-3.5 mr-1" />
          Property
        </Button>
        <Button 
          variant="ghost" 
          className="text-xs h-8 px-2 mr-1"
          onClick={() => setLocation(`/workflow/${report.id}`)}
        >
          <Layers className="h-3.5 w-3.5 mr-1" />
          Workflow
        </Button>
        <Button 
          variant="ghost" 
          className="ml-auto text-xs h-8 px-3"
          onClick={() => setLocation(`/reports/${report.id}`)}
        >
          Continue
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <PageLayout
      title="TerraFusion Dashboard"
      description="Your real estate appraisal command center"
      showSyncStatus={true}
      actions={
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              console.log("Create New Report clicked");
              setLocation('/appraisal/new');
            }}
            className="hidden sm:flex"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Appraisal
          </Button>
          <Button 
            onClick={() => {
              console.log("Import Order clicked");
              setLocation('/email-order');
            }}
          >
            <MailPlus className="mr-2 h-4 w-4" />
            Import Order
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Active Appraisal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation('/appraisal/new')}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="bg-green-100 p-3 rounded-full border border-green-200">
                  <Plus className="h-6 w-6 text-green-700" />
                </div>
                <h3 className="font-semibold text-green-800">Create New Appraisal</h3>
                <p className="text-sm text-green-700">
                  Start a new property appraisal from scratch
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation('/email-order')}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="bg-blue-100 p-3 rounded-full border border-blue-200">
                  <MailPlus className="h-6 w-6 text-blue-700" />
                </div>
                <h3 className="font-semibold text-blue-800">Import Order</h3>
                <p className="text-sm text-blue-700">
                  Import an appraisal order from email
                </p>
              </div>
            </CardContent>
          </Card>
          
          {activeReports.length > 0 && (
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setLocation(`/report/${activeReports[0].id}`)}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="bg-amber-100 p-3 rounded-full border border-amber-200">
                    <ClipboardList className="h-6 w-6 text-amber-700" />
                  </div>
                  <h3 className="font-semibold text-amber-800">Continue Active Report</h3>
                  <p className="text-sm text-amber-700 line-clamp-1">
                    {activeReports[0].address || "Resume your most recent work"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation('/reports')}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="bg-purple-100 p-3 rounded-full border border-purple-200">
                  <FileText className="h-6 w-6 text-purple-700" />
                </div>
                <h3 className="font-semibold text-purple-800">View All Reports</h3>
                <p className="text-sm text-purple-700">
                  Access your complete report history
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Appraisal Workflow Guide */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Appraisal Workflow</CardTitle>
            <CardDescription>
              Follow these steps to complete your appraisal report efficiently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="relative pl-10 pb-8 border-l-2 border-primary border-dashed">
                  <div className="absolute left-[-10px] top-0 bg-background p-1">
                    <div className="flex items-center justify-center w-6 h-6 bg-primary text-white rounded-full">
                      1
                    </div>
                  </div>
                  <h3 className="text-base font-semibold">Receive Order</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a new report from scratch or import from email
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setLocation('/appraisal/new')}>
                      <Plus className="h-3 w-3 mr-1" /> New
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setLocation('/email-order')}>
                      <MailPlus className="h-3 w-3 mr-1" /> Import
                    </Button>
                  </div>
                </div>
                
                {/* Step 2 */}
                <div className="relative pl-10 pb-8 border-l-2 border-primary border-dashed">
                  <div className="absolute left-[-10px] top-0 bg-background p-1">
                    <div className="flex items-center justify-center w-6 h-6 bg-primary text-white rounded-full">
                      2
                    </div>
                  </div>
                  <h3 className="text-base font-semibold">Property Research</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter property details and analyze market trends
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setLocation('/property-entry')}>
                      <Building2 className="h-3 w-3 mr-1" /> Enter Details
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setLocation('/market-analysis')}>
                      <BarChart className="h-3 w-3 mr-1" /> Market Data
                    </Button>
                  </div>
                </div>
                
                {/* Step 3 */}
                <div className="relative pl-10 pb-8 border-l-2 border-primary border-dashed">
                  <div className="absolute left-[-10px] top-0 bg-background p-1">
                    <div className="flex items-center justify-center w-6 h-6 bg-primary text-white rounded-full">
                      3
                    </div>
                  </div>
                  <h3 className="text-base font-semibold">Comparable Selection</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select and adjust comparable properties
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setLocation('/comparables')}>
                      <ArrowUpDown className="h-3 w-3 mr-1" /> Select Comps
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setLocation('/adjustments')}>
                      <PencilRuler className="h-3 w-3 mr-1" /> Adjustments
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Step 4 */}
                <div className="relative pl-10 pb-8 border-l-2 border-primary border-dashed">
                  <div className="absolute left-[-10px] top-0 bg-background p-1">
                    <div className="flex items-center justify-center w-6 h-6 bg-primary text-white rounded-full">
                      4
                    </div>
                  </div>
                  <h3 className="text-base font-semibold">Site Inspection</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Document property condition with photos
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setLocation('/photo-manager')}>
                      <Image className="h-3 w-3 mr-1" /> Upload Photos
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setLocation('/condition')}>
                      <HomeIcon className="h-3 w-3 mr-1" /> Property Condition
                    </Button>
                  </div>
                </div>
                
                {/* Step 5 */}
                <div className="relative pl-10 pb-8 border-l-2 border-primary border-dashed">
                  <div className="absolute left-[-10px] top-0 bg-background p-1">
                    <div className="flex items-center justify-center w-6 h-6 bg-primary text-white rounded-full">
                      5
                    </div>
                  </div>
                  <h3 className="text-base font-semibold">Report Creation</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generate a complete appraisal report
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setLocation('/report-editor')}>
                      <FileBarChart2 className="h-3 w-3 mr-1" /> Edit Report
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setLocation('/preview')}>
                      <BookOpen className="h-3 w-3 mr-1" /> Preview
                    </Button>
                  </div>
                </div>
                
                {/* Step 6 */}
                <div className="relative pl-10 pb-0 border-l-2 border-green-500">
                  <div className="absolute left-[-10px] top-0 bg-background p-1">
                    <div className="flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full">
                      6
                    </div>
                  </div>
                  <h3 className="text-base font-semibold">Quality Control & Submission</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Review, validate and submit your final report
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setLocation('/quality-check')}>
                      <ShieldCheck className="h-3 w-3 mr-1" /> QC Check
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setLocation('/submit')}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Submit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Bottom Grid: Reports + Notifications */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active/Recent Reports */}
          <div className="md:col-span-2">
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="active">Active Reports ({activeReports.length})</TabsTrigger>
                <TabsTrigger value="recent">Recent Reports ({recentReports.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="mt-4 space-y-4">
                {activeReports.length > 0 ? (
                  <div className="space-y-3">
                    {activeReports.map((report) => (
                      <div 
                        key={report.id} 
                        className="flex items-center justify-between p-3 rounded-md border border-muted hover:border-primary hover:bg-muted/30 cursor-pointer transition-all"
                        onClick={() => setLocation(`/report/${report.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${report.status === 'draft' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                            <FileText className={`h-4 w-4 ${report.status === 'draft' ? 'text-orange-600' : 'text-blue-600'}`} />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">
                              {report.address}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>#{report.orderNumber}</span>
                              <span>•</span>
                              <span>{report.lastUpdated}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={report.status} />
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="text-center pt-2">
                      <Button variant="link" onClick={() => setLocation('/reports')}>
                        View All Reports
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center border rounded-md bg-muted/30">
                    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-medium mb-1">No active reports</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start a new appraisal or import an order
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => setLocation('/appraisal/new')}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Appraisal
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="recent" className="mt-4 space-y-4">
                {recentReports.length > 0 ? (
                  <div className="space-y-3">
                    {recentReports.map((report) => (
                      <div 
                        key={report.id} 
                        className="flex items-center justify-between p-3 rounded-md border border-muted hover:border-primary hover:bg-muted/30 cursor-pointer transition-all"
                        onClick={() => setLocation(`/report/${report.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-green-100">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">
                              {report.address}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>#{report.orderNumber}</span>
                              <span>•</span>
                              <span>{report.lastUpdated}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={report.status} />
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="text-center pt-2">
                      <Button variant="link" onClick={() => setLocation('/reports')}>
                        View All Reports
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center border rounded-md bg-muted/30">
                    <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-medium mb-1">No recent reports</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You haven't submitted any reports recently
                    </p>
                    <Button variant="outline" onClick={() => setLocation('/reports')}>
                      <FileText className="h-4 w-4 mr-2" />
                      View All Reports
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Notifications */}
          <div className="md:col-span-1">
            <NotificationPanel 
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onDismiss={handleDismissNotification}
            />
          </div>
        </div>
        
        {/* Workflow Overview Panel */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Appraisal Workflow</CardTitle>
              <CardDescription>
                The TerraFusion Platform guides you through every step of the appraisal process
              </CardDescription>
            </div>
            <Button 
              variant="default" 
              className="hidden md:flex"
              onClick={() => setLocation('/workflow')}
            >
              <Layers className="mr-2 h-4 w-4" />
              Open Guided Workflow
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div 
                className="flex flex-col items-center text-center p-3 border rounded-lg bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setLocation('/workflow')}
              >
                <div className="bg-primary/10 p-3 rounded-full mb-2">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-1">Guided Workflow</h3>
                <p className="text-xs text-muted-foreground">Follow our step-by-step process for complete appraisals</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation('/workflow');
                  }}
                >
                  Start workflow
                </Button>
              </div>
              
              <div className="flex flex-col items-center text-center p-3 border rounded-lg bg-muted/20">
                <div className="bg-primary/10 p-3 rounded-full mb-2">
                  <MailPlus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-1">Import Order</h3>
                <p className="text-xs text-muted-foreground">Parse emails or documents to auto-create appraisal orders</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setLocation('/email-order')}
                >
                  Start here
                </Button>
              </div>
              
              <div className="flex flex-col items-center text-center p-3 border rounded-lg bg-muted/20">
                <div className="bg-primary/10 p-3 rounded-full mb-2">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-1">Property Data</h3>
                <p className="text-xs text-muted-foreground">Collect property details and sync with mobile inspection data</p>
                <div className="flex gap-2 mt-2 justify-center">
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => setLocation('/property-data')}
                  >
                    Classic Entry
                  </Button>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => setLocation('/property-entry')}
                  >
                    Enhanced Entry
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center p-3 border rounded-lg bg-muted/20">
                <div className="bg-primary/10 p-3 rounded-full mb-2">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-1">Report Generation</h3>
                <p className="text-xs text-muted-foreground">Generate compliant PDF and XML reports with a single click</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setLocation('/reports')}
                >
                  Create reports
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active and Recent Reports */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Left column - tabs containing reports */}
          <div className="md:col-span-3">
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="active" className="relative">
                  Active Appraisals
                  {activeReports.length > 0 && (
                    <Badge className="ml-2 text-xs">{activeReports.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="recent">Recent Appraisals</TabsTrigger>
                <TabsTrigger value="notifications">
                  Notifications
                  {notifications.filter(n => !n.read).length > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {notifications.filter(n => !n.read).length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
          
              <TabsContent value="active" className="space-y-4">
                {activeReports.length === 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Active Appraisals</CardTitle>
                      <CardDescription>
                        You don't have any active appraisal reports. Create a new one to get started.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4">
                        <Button
                          onClick={() => {
                            console.log("Start Guided Workflow clicked");
                            setLocation('/workflow');
                          }}
                        >
                          <Layers className="mr-2 h-4 w-4" />
                          Start Guided Workflow
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            console.log("Create New Report clicked");
                            setLocation('/property-entry');
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create New Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeReports.map(report => renderAppraisalCard(report))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="recent" className="space-y-4">
                {recentReports.length === 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>No Recent Appraisals</CardTitle>
                      <CardDescription>
                        You haven't completed any appraisals recently.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recentReports.map(report => renderAppraisalCard(report))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>
                      Stay updated on your appraisal activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No notifications</p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map(notification => (
                          <div 
                            key={notification.id}
                            className={`p-3 border rounded-lg flex items-start ${!notification.read ? 'bg-muted/20' : ''}`}
                          >
                            <div className="mr-3 mt-0.5">
                              {notification.type === 'alert' ? (
                                <AlertCircle className="h-5 w-5 text-destructive" />
                              ) : notification.type === 'reminder' ? (
                                <Clock className="h-5 w-5 text-yellow-500" />
                              ) : (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(notification.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right column - user progress card */}
          <div className="md:col-span-1">
            <ProfileMiniCard />
          </div>
        </div>
        
        {/* Tools and Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="group hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Image className="h-5 w-5 mr-2" />
                <span>TerraField Mobile</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Capture property photos, sketches, and details in the field with offline capabilities and automatic syncing.
              </p>
              <Button 
                variant="ghost" 
                className="group-hover:translate-x-1 transition-transform"
                onClick={() => setLocation('/photo-sync-test')}
              >
                <span>Mobile Sync Center</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-md transition-all">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  <span>AI Valuation Tools</span>
                </CardTitle>
                <Badge variant="outline" className="bg-green-50 text-xs">Updated</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Leverage advanced AI to get accurate property valuations, market trend analysis, and assistance with URAR forms.
              </p>
              <div className="flex flex-col space-y-2">
                <Button 
                  variant="ghost" 
                  className="group-hover:translate-x-1 transition-transform justify-start"
                  onClick={() => setLocation('/ai-valuation')}
                >
                  <span>AI Assistant</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  className="group-hover:translate-x-1 transition-transform justify-start"
                  onClick={() => setLocation('/legal-urar')}
                >
                  <span className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    URAR + AI Assistant
                    <Badge className="ml-2 h-5" variant="secondary">New</Badge>
                  </span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  className="group-hover:translate-x-1 transition-transform justify-start"
                  onClick={() => setLocation('/shap-viewer')}
                >
                  <span>SHAP Explorer</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2" />
                <span>Compliance Engine</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Ensure your appraisals meet industry standards with automatic compliance checks and validation.
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