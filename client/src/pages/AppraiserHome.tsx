import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageLayout } from '@/components/layout/page-layout';
import NotificationPanel from '@/components/notifications/NotificationPanel';
import { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  ArrowRight, 
  Clock, 
  ChevronRight,
  Clipboard,
  ClipboardList,
  Image,
  ArrowUpDown,
  PencilRuler,
  LineChart,
  Building2,
  MailPlus,
  Brain,
  ShieldCheck,
  Send,
  BookOpen,
  CheckCircle2,
  BarChart,
  LayoutDashboard
} from 'lucide-react';

// Type for the status badge component
type StatusBadgeProps = {
  status: string;
};

// Status Badge Component
const StatusBadge = ({ status }: StatusBadgeProps) => {
  let bgColor = "bg-neutral-100";
  let textColor = "text-neutral-700";
  
  if (status === "In Progress") {
    bgColor = "bg-blue-100";
    textColor = "text-blue-700";
  } else if (status === "Completed") {
    bgColor = "bg-green-100";
    textColor = "text-green-700";
  } else if (status === "Due Soon") {
    bgColor = "bg-amber-100";
    textColor = "text-amber-700";
  } else if (status === "Overdue") {
    bgColor = "bg-red-100";
    textColor = "text-red-700";
  }

  return (
    <Badge variant="outline" className={`${bgColor} ${textColor} border-0`}>
      {status}
    </Badge>
  );
};

// Temporary example data for active reports
const EXAMPLE_REPORTS = [
  {
    id: 1,
    address: "123 Main Street, Springfield, IL 62701",
    orderNumber: "APO-2025-0042",
    clientName: "Midwest Mortgage Co.",
    type: "Single Family",
    dueDate: "2025-05-15",
    status: "In Progress",
    progress: 65
  },
  {
    id: 2,
    address: "456 Oak Avenue, Chicago, IL 60601",
    orderNumber: "APO-2025-0039",
    clientName: "ABC Bank",
    type: "Condo",
    dueDate: "2025-05-17",
    status: "Due Soon",
    progress: 40
  },
  {
    id: 3,
    address: "789 Pine Lane, Aurora, IL 60502",
    orderNumber: "APO-2025-0038",
    clientName: "First National Bank",
    type: "Single Family",
    dueDate: "2025-05-02",
    status: "Overdue",
    progress: 85
  }
];

// Example notifications data
const EXAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    message: "You have been assigned a new appraisal order for 789 Pine Lane.",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    read: false,
    type: "alert" // Using allowed types from Notification interface
  },
  {
    id: "2",
    message: "Client requested revisions for order #APO-2025-0031 (345 Maple Road).",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    read: false,
    type: "reminder"
  },
  {
    id: "3",
    message: "Order #APO-2025-0029 was successfully submitted to the client.",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    read: true,
    type: "update"
  }
];

// Main AppraiserHome Component
export default function AppraiserHome() {
  const [_, setLocation] = useLocation();
  
  // Use the example data for active reports and notifications
  const [activeReports, setActiveReports] = useState(EXAMPLE_REPORTS);
  const [notifications, setNotifications] = useState(EXAMPLE_NOTIFICATIONS);
  
  // Handler for marking notification as read
  const handleMarkAsRead = (id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };
  
  // Handler for marking all notifications as read
  const handleMarkAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };
  
  // Handler for dismissing a notification
  const handleDismissNotification = (id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  };
  
  // Log when the component renders (for debugging)
  useEffect(() => {
    console.log("AppraiserHome component rendering");
  }, []);
  
  return (
    <PageLayout
      title="TerraFusion Pro"
      subtitle="Professional Appraisal Suite"
      actions={
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setLocation('/settings')}
            className="hidden md:flex"
          >
            Settings
          </Button>
          <Button 
            onClick={() => setLocation('/email-order')}
          >
            <MailPlus className="h-4 w-4 mr-2" />
            Import Order
          </Button>
        </div>
      }
    >
      <div className="space-y-10">
        {/* Hero Section - Focused on appraiser's workflow needs */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-5 flex flex-col justify-center">
              <h1 className="text-4xl font-medium tracking-tight mb-6 text-black">
                ***APPRAISER UI TEST*** <br/>PLEASE CONFIRM YOU SEE THIS
              </h1>
              
              <p className="text-lg text-neutral-600 mb-8">
                Complete URAR forms, run comps analysis, and deliver reports faster with integrated tools designed for real estate appraisers.
              </p>
              
              <div className="flex flex-col gap-4">
                <Button 
                  size="lg" 
                  className="bg-black text-white hover:bg-black/95 h-14 text-base font-normal w-full md:w-auto"
                  onClick={() => setLocation('/appraisal/new')}
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Start New Report
                </Button>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 border border-neutral-300 text-base font-normal"
                    onClick={() => setLocation('/email-order')}
                  >
                    <MailPlus className="mr-2 h-5 w-5" />
                    Import Order
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="flex-1 h-12 border border-neutral-300 text-base font-normal"
                    onClick={() => setLocation('/reports')}
                  >
                    <Clipboard className="mr-2 h-5 w-5" />
                    My Reports
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-7">
              <div className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium">Quick Tasks</h2>
                  <Badge variant="outline" className="bg-neutral-100">Appraiser Shortcuts</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="justify-start h-12 bg-white border-neutral-200"
                    onClick={() => setLocation('/continue-appraisal')}
                  >
                    <ClipboardList className="mr-2 h-5 w-5 text-neutral-600" />
                    <div className="text-left">
                      <div className="font-medium">Continue Report</div>
                      <div className="text-xs text-neutral-500">Last: 123 Main St</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start h-12 bg-white border-neutral-200"
                    onClick={() => setLocation('/comps-search')}
                  >
                    <ArrowUpDown className="mr-2 h-5 w-5 text-neutral-600" />
                    <div className="text-left">
                      <div className="font-medium">Run Comps Search</div>
                      <div className="text-xs text-neutral-500">Find comparable sales</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start h-12 bg-white border-neutral-200"
                    onClick={() => setLocation('/photo-import')}
                  >
                    <Image className="mr-2 h-5 w-5 text-neutral-600" />
                    <div className="text-left">
                      <div className="font-medium">Import Photos</div>
                      <div className="text-xs text-neutral-500">From device or TerraField</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start h-12 bg-white border-neutral-200"
                    onClick={() => setLocation('/review-submit')}
                  >
                    <Send className="mr-2 h-5 w-5 text-neutral-600" />
                    <div className="text-left">
                      <div className="font-medium">Review & Submit</div>
                      <div className="text-xs text-neutral-500">Finalize reports</div>
                    </div>
                  </Button>
                </div>
                
                {activeReports.length > 0 && (
                  <div className="mt-5 border-t border-neutral-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium">Current Assignments</h3>
                      <Badge variant="secondary" className="bg-neutral-100 text-xs">
                        {activeReports.length} Active
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {activeReports.slice(0, 2).map(report => (
                        <div 
                          key={report.id} 
                          className="flex items-center justify-between p-2 bg-white border border-neutral-200 rounded cursor-pointer hover:border-neutral-400"
                          onClick={() => setLocation(`/report/${report.id}`)}
                        >
                          <div>
                            <div className="font-medium text-sm">{report.address}</div>
                            <div className="text-xs text-neutral-500">Due: {report.dueDate} • {report.progress}% complete</div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-neutral-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Appraiser Workflow Tools - Practical appraisal functions */}
        <div className="py-12 border-t border-neutral-100">
          <h2 className="text-2xl font-medium mb-2">Appraiser Workflow</h2>
          <p className="text-neutral-500 mb-10">
            Practical tools to complete appraisals efficiently and meet client requirements
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-y-8 gap-x-6">
            {/* Primary tools - First row, more prominent */}
            <div 
              onClick={() => setLocation('/orders')} 
              className="md:col-span-4 bg-black text-white p-6 hover:bg-black/90 cursor-pointer group"
            >
              <div className="flex items-center mb-4">
                <MailPlus className="h-8 w-8 mr-3" />
                <h3 className="text-xl font-normal">Order Intake</h3>
              </div>
              <p className="mb-4 opacity-80">
                Import and manage new orders from AMCs and lenders
              </p>
              <div className="flex justify-end">
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            
            <div 
              onClick={() => setLocation('/form-filling')} 
              className="md:col-span-4 bg-black text-white p-6 hover:bg-black/90 cursor-pointer group"
            >
              <div className="flex items-center mb-4">
                <ClipboardList className="h-8 w-8 mr-3" />
                <h3 className="text-xl font-normal">Form Filling</h3>
              </div>
              <p className="mb-4 opacity-80">
                Complete URAR, 1004, and other standard appraisal forms
              </p>
              <div className="flex justify-end">
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            
            <div 
              onClick={() => setLocation('/comps-map')} 
              className="md:col-span-4 bg-black text-white p-6 hover:bg-black/90 cursor-pointer group"
            >
              <div className="flex items-center mb-4">
                <ArrowUpDown className="h-8 w-8 mr-3" />
                <h3 className="text-xl font-normal">Comp Selection</h3>
              </div>
              <p className="mb-4 opacity-80">
                Select and adjust comparable properties for accurate valuations
              </p>
              <div className="flex justify-end">
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            
            {/* Secondary tools - Second row */}
            <div 
              onClick={() => setLocation('/photo-import')} 
              className="md:col-span-3 border border-neutral-200 p-5 hover:border-neutral-400 transition-colors cursor-pointer group"
            >
              <div className="mb-3">
                <Image className="h-7 w-7 text-neutral-800" />
              </div>
              <h3 className="text-base font-medium mb-1">Photo Import</h3>
              <p className="text-neutral-500 text-sm">
                Import & organize property photos
              </p>
            </div>
            
            <div 
              onClick={() => setLocation('/sketch')} 
              className="md:col-span-3 border border-neutral-200 p-5 hover:border-neutral-400 transition-colors cursor-pointer group"
            >
              <div className="mb-3">
                <PencilRuler className="h-7 w-7 text-neutral-800" />
              </div>
              <h3 className="text-base font-medium mb-1">Sketch Tool</h3>
              <p className="text-neutral-500 text-sm">
                Draw floor plans with GLA calculation
              </p>
            </div>
            
            <div 
              onClick={() => setLocation('/ai-valuation')} 
              className="md:col-span-3 border border-neutral-200 p-5 hover:border-neutral-400 transition-colors cursor-pointer group"
            >
              <div className="mb-3">
                <Brain className="h-7 w-7 text-neutral-800" />
              </div>
              <h3 className="text-base font-medium mb-1">AI Valuation</h3>
              <p className="text-neutral-500 text-sm">
                AI-assisted valuation modeling
              </p>
            </div>
            
            <div 
              onClick={() => setLocation('/final-review')} 
              className="md:col-span-3 border border-neutral-200 p-5 hover:border-neutral-400 transition-colors cursor-pointer group"
            >
              <div className="mb-3">
                <CheckCircle2 className="h-7 w-7 text-neutral-800" />
              </div>
              <h3 className="text-base font-medium mb-1">Review & Submit</h3>
              <p className="text-neutral-500 text-sm">
                Check for errors and submit reports
              </p>
            </div>
          </div>
        </div>
        
        {/* In-Progress Assignments Section */}
        <div className="py-12 border-t border-neutral-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-medium mb-1">My Assignments</h2>
              <p className="text-neutral-500">Track deadlines and progress across all your active appraisals</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/workload')} 
                className="hidden md:flex"
              >
                <BarChart className="h-4 w-4 mr-2" />
                Workload Manager
              </Button>
              
              <Button 
                onClick={() => setLocation('/appraisal/new')} 
              >
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Active Appraisal List */}
            <div className="md:col-span-8">
              {activeReports.length > 0 ? (
                <div className="overflow-hidden border border-neutral-200 rounded-md">
                  <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-neutral-700" />
                      <h3 className="font-medium text-sm">Appraisal Queue</h3>
                    </div>
                    <Badge variant="outline" className="text-xs bg-neutral-100">
                      {activeReports.length} Active
                    </Badge>
                  </div>
                
                  <div className="divide-y divide-neutral-200">
                    {activeReports.map((report) => (
                      <div 
                        key={report.id}
                        className="hover:bg-neutral-50 cursor-pointer transition-colors"
                      >
                        <div className="p-4 pb-2">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium flex items-center">
                              {report.address}
                              <ChevronRight className="h-4 w-4 ml-1 text-neutral-400" />
                            </h4>
                            <StatusBadge status={report.status} />
                          </div>
                          
                          <div className="text-neutral-500 text-sm mb-3">
                            Order #{report.orderNumber} • {report.type} • {report.clientName}
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 items-start sm:items-center mb-2 text-sm">
                            <div className="flex items-center text-neutral-600">
                              <Clock className="h-3.5 w-3.5 mr-1.5" />
                              <span className={report.dueDate === "2025-05-02" ? "text-red-600 font-medium" : ""}>
                                Due {new Date(report.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="flex-1 w-full">
                              <div className="flex items-center gap-3">
                                <Progress value={report.progress} className="flex-1 h-1.5" />
                                <span className="text-xs text-neutral-500 whitespace-nowrap">{report.progress}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="px-4 py-2 bg-neutral-50 flex justify-between border-t border-neutral-100">
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/report/${report.id}/urar`);
                              }}
                            >
                              <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                              URAR Form
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-xs"
                              onClick={(e) => {
                                e.stopPropagation(); 
                                setLocation(`/report/${report.id}/comps`);
                              }}
                            >
                              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
                              Comps Grid
                            </Button>
                          </div>
                          
                          <Button 
                            size="sm" 
                            className="h-8 text-xs bg-black text-white hover:bg-black/90"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/report/${report.id}/continue`);
                            }}
                          >
                            Continue <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {activeReports.length > 2 && (
                    <div className="p-3 border-t border-neutral-100 bg-neutral-50 text-center">
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => setLocation('/dashboard/assignments')}
                      >
                        View All Assignments
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-neutral-200 p-8 text-center rounded-md">
                  <div className="bg-neutral-50 inline-flex items-center justify-center p-4 rounded-full mb-4">
                    <FileText className="h-8 w-8 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No active assignments</h3>
                  <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                    Get started by importing an order or creating a new appraisal report
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={() => setLocation('/email-order')} 
                      className="bg-black text-white hover:bg-black/90"
                    >
                      <MailPlus className="h-4 w-4 mr-2" />
                      Import Order
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setLocation('/appraisal/new')} 
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Productivity Stats & Notifications */}
            <div className="md:col-span-4 space-y-6">
              {/* Productivity Stats Card */}
              <div className="border border-neutral-200 rounded-md overflow-hidden">
                <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
                  <h3 className="font-medium">Productivity Stats</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="text-neutral-600">Weekly Capacity</span>
                        <span className="font-medium">8/10 Reports</span>
                      </div>
                      <Progress value={80} className="h-1.5" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="text-neutral-600">Due This Week</span>
                        <span className="font-medium text-amber-600">3 Reports</span>
                      </div>
                      <Progress value={30} className="h-1.5 bg-amber-100" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="text-neutral-600">Avg. Completion Time</span>
                        <span className="font-medium">3.2 Days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Notifications Panel */}
              <div className="border border-neutral-200 rounded-md overflow-hidden">
                <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
                  <h3 className="font-medium">Notifications</h3>
                </div>
                <div className="p-0">
                  <NotificationPanel 
                    notifications={notifications}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onDismiss={handleDismissNotification}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Appraisal Tools - AI and Productivity Features */}
        <div className="py-12 border-t border-neutral-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-medium mb-1">Appraisal Assistants</h2>
              <p className="text-neutral-500">AI tools to help you complete appraisals faster and with greater accuracy</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div 
              onClick={() => setLocation('/urar-assistant')} 
              className="bg-neutral-50 border border-neutral-200 p-5 rounded-md hover:border-neutral-400 cursor-pointer group"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 bg-black rounded-md mr-3">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">URAR Assistant</h3>
                  <p className="text-xs text-neutral-500">Form completion help</p>
                </div>
              </div>
              <p className="text-sm text-neutral-600 mb-3">
                AI-powered assistance for completing URAR and other standard appraisal forms with relevant suggestions
              </p>
              <div className="flex items-center text-sm text-neutral-500">
                <Badge variant="outline" className="mr-2 text-xs bg-neutral-100">USPAP Compliant</Badge>
                <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            
            <div 
              onClick={() => setLocation('/comps-assistant')} 
              className="bg-neutral-50 border border-neutral-200 p-5 rounded-md hover:border-neutral-400 cursor-pointer group"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 bg-black rounded-md mr-3">
                  <ArrowUpDown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">Comps Finder</h3>
                  <p className="text-xs text-neutral-500">Automated comps search</p>
                </div>
              </div>
              <p className="text-sm text-neutral-600 mb-3">
                Discover the most relevant comparable properties with automated adjustment recommendations
              </p>
              <div className="flex items-center text-sm text-neutral-500">
                <Badge variant="outline" className="mr-2 text-xs bg-neutral-100">MLS Integration</Badge>
                <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            
            <div 
              onClick={() => setLocation('/condition-assistant')} 
              className="bg-neutral-50 border border-neutral-200 p-5 rounded-md hover:border-neutral-400 cursor-pointer group"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 bg-black rounded-md mr-3">
                  <Image className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">Condition Analyzer</h3>
                  <p className="text-xs text-neutral-500">Photo-based condition scoring</p>
                </div>
              </div>
              <p className="text-sm text-neutral-600 mb-3">
                AI analysis of property photos to automatically detect condition issues and suggest condition scores
              </p>
              <div className="flex items-center text-sm text-neutral-500">
                <Badge variant="secondary" className="mr-2 text-xs">New</Badge>
                <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            
            <div 
              onClick={() => setLocation('/compliance-checker')} 
              className="bg-neutral-50 border border-neutral-200 p-5 rounded-md hover:border-neutral-400 cursor-pointer group"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 bg-black rounded-md mr-3">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">Compliance Checker</h3>
                  <p className="text-xs text-neutral-500">Pre-submission validation</p>
                </div>
              </div>
              <p className="text-sm text-neutral-600 mb-3">
                Automatically check your appraisal reports for potential compliance issues and hard stops
              </p>
              <div className="flex items-center text-sm text-neutral-500">
                <Badge variant="outline" className="mr-2 text-xs bg-neutral-100">FNMA/FHA Rules</Badge>
                <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            
            <div 
              onClick={() => setLocation('/mobile-sync')} 
              className="bg-neutral-50 border border-neutral-200 p-5 rounded-md hover:border-neutral-400 cursor-pointer group"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 bg-black rounded-md mr-3">
                  <LayoutDashboard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">TerraField Mobile</h3>
                  <p className="text-xs text-neutral-500">Mobile app integration</p>
                </div>
              </div>
              <p className="text-sm text-neutral-600 mb-3">
                Sync field data and photos captured with your mobile device directly to your appraisal reports
              </p>
              <div className="flex items-center text-sm text-neutral-500">
                <Badge variant="outline" className="mr-2 text-xs bg-neutral-100">iOS & Android</Badge>
                <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            
            <div 
              onClick={() => setLocation('/batch-tools')} 
              className="bg-neutral-50 border border-neutral-200 p-5 rounded-md hover:border-neutral-400 cursor-pointer group"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 bg-black rounded-md mr-3">
                  <BarChart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">Productivity Tools</h3>
                  <p className="text-xs text-neutral-500">Batch processing features</p>
                </div>
              </div>
              <p className="text-sm text-neutral-600 mb-3">
                Import and process multiple reports at once, schedule tasks, and manage your team's workload
              </p>
              <div className="flex items-center text-sm text-neutral-500">
                <Badge variant="outline" className="mr-2 text-xs bg-neutral-100">Pro Feature</Badge>
                <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}