import { Switch, Route } from "wouter";
import AppShell from "./components/layout/AppShell";
import Home from "./pages/Home";
import FormPage from "./pages/FormPage";
import CompsPage from "./pages/CompsPage";
import PhotosPage from "./pages/PhotosPage";
import SketchesPage from "./pages/SketchesPage";
import ReportsPage from "./pages/ReportsPage";
import CompliancePage from "./pages/CompliancePage";
import NotFound from "@/pages/not-found";
import { useAppraisal } from "./contexts/AppraisalContext";
import { useCallback, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AIAssistantContent from "./components/ai/AIAssistantContent";

function App() {
  const { syncStatus, currentReport, currentUser } = useAppraisal();
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [activeSidebarPath, setActiveSidebarPath] = useState('Subject');

  const handleSidebarClick = useCallback((section: string, item: string) => {
    setActiveSidebarPath(item);
  }, []);

  const handleAIAssistantClick = useCallback(() => {
    setShowAIAssistant(true);
  }, []);

  return (
    <>
      <AppShell
        currentReport={currentReport ? `${currentReport.reportType} (${currentReport.id})` : undefined}
        userName={currentUser?.fullName}
        syncStatus={syncStatus}
        onAIAssistantClick={handleAIAssistantClick}
        activeSidebarPath={activeSidebarPath}
        onSidebarItemClick={handleSidebarClick}
      >
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/form" component={FormPage} />
          <Route path="/comps" component={CompsPage} />
          <Route path="/photos" component={PhotosPage} />
          <Route path="/sketches" component={SketchesPage} />
          <Route path="/reports" component={ReportsPage} />
          <Route path="/compliance" component={CompliancePage} />
          <Route component={NotFound} />
        </Switch>
      </AppShell>

      {/* AI Assistant Dialog */}
      <Dialog open={showAIAssistant} onOpenChange={setShowAIAssistant}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <svg className="h-6 w-6 mr-2 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Assistant
            </h2>
            <AIAssistantContent currentReport={currentReport} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default App;
