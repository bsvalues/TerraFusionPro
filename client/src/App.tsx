import { Switch, Route } from "wouter";
import Home from "./pages/Home";
import EnhancedHome from "./pages/Home.enhanced";
import FormPage from "./pages/FormPage";
import CompsPage from "./pages/CompsPage";
import PhotosPage from "./pages/PhotosPage";
import SketchesPage from "./pages/SketchesPage";
import ReportsPage from "./pages/ReportsPage";
import CompliancePage from "./pages/CompliancePage";
import AIValuationPage from "./pages/AIValuationPage";
import EmailOrderPage from "./pages/EmailOrderPage";
import PropertyDataPage from "./pages/PropertyDataPage";
import UADFormPage from "./pages/UADFormPage";
import EnhancedUADFormPage from "./pages/UADFormPage.enhanced";
import { ComparablePropertiesPage } from "./pages/ComparablePropertiesPage";
import ImportPage from "./pages/ImportPage";
import NotFound from "./pages/not-found";
import SharedPropertyPage from "./pages/SharedPropertyPage";
import { TooltipProvider } from "./contexts/TooltipContext";
import TermsPage from "./pages/TermsPage";
import CRDTTestPage from "./pages/CRDTTestPage";
import PhotoEnhancementPage from "./pages/PhotoEnhancementPage";
import PhotoSyncTestPage from "./pages/PhotoSyncTestPage";
import NotificationTestPage from "./pages/NotificationTestPage";
import { WorkflowPage } from "./pages/WorkflowPage";
import { ReportGenerationPage } from "./pages/ReportGenerationPage";
import MarketAnalysisPage from "./pages/MarketAnalysisPage";
import SettingsPage from "./pages/SettingsPage";
import HelpSupportPage from "./pages/HelpSupportPage";
import { AppProvider } from "./contexts/AppContext";
import { AppShell } from "./components/layout/app-shell";
import { useState, useEffect } from "react";

// Main App Component - Now using AppProvider and AppShell for consistent layout
function App() {
  // Track if app is loaded to reduce flash of unstyled content
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate app initialization process
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  // Loading state while app initializes
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-12 w-12 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3" />
          </svg>
          <p className="text-lg font-medium animate-pulse">Loading TerraFusionPlatform...</p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <TooltipProvider>
        <AppShell>
          <Switch>
            <Route path="/" component={EnhancedHome} />
            <Route path="/form" component={FormPage} />
            <Route path="/comps" component={CompsPage} />
            <Route path="/photos" component={PhotosPage} />
            <Route path="/sketches" component={SketchesPage} />
            <Route path="/reports" component={ReportsPage} />
            <Route path="/compliance" component={CompliancePage} />
            <Route path="/ai-valuation" component={AIValuationPage} />
            <Route path="/email-order" component={EmailOrderPage} />
            <Route path="/property-data" component={PropertyDataPage} />
            <Route path="/property/:id" component={PropertyDataPage} />
            <Route path="/uad-form" component={EnhancedUADFormPage} />
            <Route path="/uad-form/:id" component={EnhancedUADFormPage} />
            <Route path="/comparables/:reportId" component={ComparablePropertiesPage} />
            <Route path="/terms" component={TermsPage} />
            <Route path="/import" component={ImportPage} />
            <Route path="/crdt-test" component={CRDTTestPage} />
            <Route path="/photo-enhancement" component={PhotoEnhancementPage} />
            <Route path="/photo-sync-test" component={PhotoSyncTestPage} />
            <Route path="/notification-test" component={NotificationTestPage} />
            <Route path="/shared/:token" component={SharedPropertyPage} />
            <Route path="/workflow" component={WorkflowPage} />
            <Route path="/workflow/:reportId" component={WorkflowPage} />
            <Route path="/reports/:reportId" component={ReportGenerationPage} />
            <Route path="/ai-analysis" component={MarketAnalysisPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/help" component={HelpSupportPage} />
            <Route component={NotFound} />
          </Switch>
        </AppShell>
      </TooltipProvider>
    </AppProvider>
  );
}

export default App;
