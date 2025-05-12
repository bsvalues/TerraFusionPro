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
  ChevronRight,
  CircleDashed,
  Clipboard,
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
  LineChart,
  Send,
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
  orderNumber: string; // Added field for order reference
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
          lastUpdated: "2025-04-25",
          orderNumber: "ORD-4581"
        },
        {
          id: "apr-998",
          address: "456 Oak Avenue, Townsburg, CA 90211",
          type: "Condominium",
          clientName: "Homeward Mortgage",
          dueDate: "2025-05-02",
          status: 'review',
          progress: 92,
          lastUpdated: "2025-04-26",
          orderNumber: "ORD-4492"
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
          lastUpdated: "2025-04-19",
          orderNumber: "ORD-4389"
        },
        {
          id: "apr-995",
          address: "321 Cedar Lane, Hamletville, CA 90213",
          type: "Single Family",
          clientName: "Regional Bank Trust",
          dueDate: "2025-04-15",
          status: 'completed',
          progress: 100,
          lastUpdated: "2025-04-14",
          orderNumber: "ORD-4350"
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
      <div className="space-y-10">
        {/* Hero Section - Ultra minimalist Apple/Tesla style */}
        <div className="py-20 flex flex-col items-center text-center">
          <h1 className="text-5xl font-medium mb-10 tracking-tight">
            TerraFusion
          </h1>
          <p className="text-neutral-500 max-w-[500px] text-lg mb-16">
            Intelligent property valuation
          </p>
          
          <div className="flex gap-6 justify-center">
            <Button 
              size="lg" 
              className="bg-black text-white hover:bg-black/90 h-14 px-8 rounded-full"
              onClick={() => setLocation('/appraisal/new')}
            >
              New Appraisal
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="h-14 px-8 rounded-full border-2"
              onClick={() => setLocation('/email-order')}
            >
              Import Order
            </Button>
          </div>
        </div>
        
        {/* Active Reports - Tesla-inspired simplicity */}
        {activeReports.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-medium mb-8">Recent Work</h2>
            <div className="space-y-5">
              {activeReports.map(report => (
                <div 
                  key={report.id}
                  className="group py-5 border-t border-neutral-200 flex flex-col md:flex-row md:items-center md:justify-between cursor-pointer"
                  onClick={() => setLocation(`/report/${report.id}`)}
                >
                  <div className="flex-1 mb-3 md:mb-0">
                    <h3 className="font-medium text-lg mb-1">{report.address}</h3>
                    <div className="text-sm text-neutral-500">
                      {report.orderNumber} • Due {report.dueDate}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <span className="text-sm mr-2">{report.progress}%</span>
                      <Progress value={report.progress} className="w-24 h-1.5" />
                    </div>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Appraisal Workflow - Tesla/Apple inspired */}
        <div className="pb-6">
          <h2 className="text-xl font-medium mb-6">Appraisal Workflow</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col">
              <div className="bg-neutral-100 rounded-t-lg px-6 py-4 border-b border-neutral-200">
                <h3 className="font-medium">1. Preparation</h3>
              </div>
              <div className="bg-white rounded-b-lg px-6 py-6 space-y-5 border border-t-0 border-neutral-200 flex-1">
                <div>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start pl-3 py-6 h-auto"
                    onClick={() => setLocation('/order-entry')}
                  >
                    <div className="flex gap-3 items-center">
                      <div className="bg-neutral-100 p-2 rounded-full">
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Order Entry</div>
                        <div className="text-xs text-muted-foreground mt-1">Create or import appraisal order</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start pl-3 py-6 h-auto"
                    onClick={() => setLocation('/property-entry')}
                  >
                    <div className="flex gap-3 items-center">
                      <div className="bg-neutral-100 p-2 rounded-full">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Property Details</div>
                        <div className="text-xs text-muted-foreground mt-1">Enter property specifications</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="bg-neutral-100 rounded-t-lg px-6 py-4 border-b border-neutral-200">
                <h3 className="font-medium">2. Analysis</h3>
              </div>
              <div className="bg-white rounded-b-lg px-6 py-6 space-y-5 border border-t-0 border-neutral-200 flex-1">
                <div>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start pl-3 py-6 h-auto"
                    onClick={() => setLocation('/market-analysis')}
                  >
                    <div className="flex gap-3 items-center">
                      <div className="bg-neutral-100 p-2 rounded-full">
                        <BarChart className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Market Analysis</div>
                        <div className="text-xs text-muted-foreground mt-1">Review local market trends</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start pl-3 py-6 h-auto"
                    onClick={() => setLocation('/comparables')}
                  >
                    <div className="flex gap-3 items-center">
                      <div className="bg-neutral-100 p-2 rounded-full">
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Comparables</div>
                        <div className="text-xs text-muted-foreground mt-1">Select and adjust property comps</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start pl-3 py-6 h-auto"
                    onClick={() => setLocation('/photo-manager')}
                  >
                    <div className="flex gap-3 items-center">
                      <div className="bg-neutral-100 p-2 rounded-full">
                        <Image className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Property Photos</div>
                        <div className="text-xs text-muted-foreground mt-1">Upload and manage property images</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="bg-neutral-100 rounded-t-lg px-6 py-4 border-b border-neutral-200">
                <h3 className="font-medium">3. Completion</h3>
              </div>
              <div className="bg-white rounded-b-lg px-6 py-6 space-y-5 border border-t-0 border-neutral-200 flex-1">
                <div>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start pl-3 py-6 h-auto"
                    onClick={() => setLocation('/report-editor')}
                  >
                    <div className="flex gap-3 items-center">
                      <div className="bg-neutral-100 p-2 rounded-full">
                        <FileBarChart2 className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Report Generation</div>
                        <div className="text-xs text-muted-foreground mt-1">Create and edit complete report</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start pl-3 py-6 h-auto"
                    onClick={() => setLocation('/quality-check')}
                  >
                    <div className="flex gap-3 items-center">
                      <div className="bg-neutral-100 p-2 rounded-full">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Quality Control</div>
                        <div className="text-xs text-muted-foreground mt-1">Verify report completeness</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start pl-3 py-6 h-auto"
                    onClick={() => setLocation('/submit')}
                  >
                    <div className="flex gap-3 items-center">
                      <div className="bg-neutral-100 p-2 rounded-full">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Submit Report</div>
                        <div className="text-xs text-muted-foreground mt-1">Finalize and deliver appraisal</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* My Reports - Apple/Tesla inspired minimal design */}
        <div className="mt-4 border-t border-neutral-200 pt-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-medium">My Reports</h2>
            <Button variant="outline" onClick={() => setLocation('/reports')} className="rounded-full px-4">
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Active Reports */}
            <div className="col-span-2">
              <div className="border border-neutral-200 bg-white rounded-xl overflow-hidden">
                <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-3 flex justify-between items-center">
                  <h3 className="font-medium">Active Reports</h3>
                  <span className="text-sm text-muted-foreground">{activeReports.length} reports</span>
                </div>
                
                <div className="divide-y divide-neutral-200">
                  {activeReports.map((report) => (
                    <div 
                      key={report.id}
                      className="px-6 py-4 hover:bg-neutral-50 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/report/${report.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{report.address}</div>
                        <StatusBadge status={report.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {report.orderNumber} • Due {report.dueDate}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground">
                            {report.progress}% complete
                          </div>
                          <Progress value={report.progress} className="w-16 h-1.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {activeReports.length === 0 && (
                    <div className="p-8 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <h3 className="text-sm font-medium mb-1">No active reports</h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        Start a new appraisal to see it here
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setLocation('/appraisal/new')}
                        className="rounded-full"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        New Appraisal
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Notifications Panel */}
            <div className="col-span-1">
              <NotificationPanel 
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onDismiss={handleDismissNotification}
              />
            </div>
          </div>
        </div>
        


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