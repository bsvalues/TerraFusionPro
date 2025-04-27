import { Route } from 'wouter';
import { AppProvider } from './contexts/AppContext';
import { TooltipProvider } from "./contexts/TooltipContext";
import { Toaster } from './components/ui/toaster';
import { AppShell } from './components/layout/app-shell';

// Import pages
import Home from './pages/Home';
import FormPage from './pages/FormPage';
import CompsPage from './pages/CompsPage';
import PhotosPage from './pages/PhotosPage';
import SketchesPage from './pages/SketchesPage';
import ReportsPage from './pages/ReportsPage';
import CompliancePage from './pages/CompliancePage';
import AIValuationPage from './pages/AIValuationPage';
import EmailOrderPage from './pages/EmailOrderPage';
import PropertyDataPage from './pages/PropertyDataPage';
import UADFormPage from './pages/UADFormPage';
import { ComparablePropertiesPage } from './pages/ComparablePropertiesPage';
import ImportPage from './pages/ImportPage';
import NotFound from './pages/not-found';
import SharedPropertyPage from './pages/SharedPropertyPage';
import TermsPage from './pages/TermsPage';
import CRDTTestPage from './pages/CRDTTestPage';
import PhotoEnhancementPage from './pages/PhotoEnhancementPage';
import PhotoSyncTestPage from './pages/PhotoSyncTestPage';
import NotificationTestPage from './pages/NotificationTestPage';

// Import the enhanced versions of pages
import EnhancedHome from './pages/Home.enhanced';
import EnhancedAIValuationPage from './pages/AIValuationPage.enhanced';
import EnhancedCompliancePage from './pages/CompliancePage.enhanced';
import EnhancedPhotosPage from './pages/PhotosPage.enhanced';
import EnhancedSketchesPage from './pages/SketchesPage.enhanced';
import EnhancedPhotoSyncTestPage from './pages/PhotoSyncTestPage.enhanced';
import EnhancedUADFormPage from './pages/UADFormPage.enhanced';

// Use the enhanced versions
const HomeComponent = EnhancedHome;
const AIValuationPageComponent = EnhancedAIValuationPage;
const CompliancePageComponent = EnhancedCompliancePage;
const PhotosPageComponent = EnhancedPhotosPage;
const SketchesPageComponent = EnhancedSketchesPage;
const PhotoSyncTestPageComponent = EnhancedPhotoSyncTestPage;
const UADFormPageComponent = EnhancedUADFormPage;

export default function EnhancedApp2() {
  return (
    <AppProvider>
      <TooltipProvider>
        <AppShell>
          <Route path="/" component={HomeComponent} />
          <Route path="/form" component={FormPage} />
          <Route path="/form/:id" component={FormPage} />
          <Route path="/comps" component={CompsPage} />
          <Route path="/photos" component={PhotosPageComponent} />
          <Route path="/photos/:reportId" component={PhotosPageComponent} />
          <Route path="/sketches" component={SketchesPageComponent} />
          <Route path="/sketches/:reportId" component={SketchesPageComponent} />
          <Route path="/reports" component={ReportsPage} />
          <Route path="/reports/:id" component={ReportsPage} />
          <Route path="/compliance" component={CompliancePageComponent} />
          <Route path="/compliance/:reportId" component={CompliancePageComponent} />
          <Route path="/ai-valuation" component={AIValuationPageComponent} />
          <Route path="/email-order" component={EmailOrderPage} />
          <Route path="/property-data" component={PropertyDataPage} />
          <Route path="/property/:id" component={PropertyDataPage} />
          <Route path="/uad-form" component={UADFormPageComponent} />
          <Route path="/uad-form/:id" component={UADFormPageComponent} />
          <Route path="/comparables/:reportId" component={ComparablePropertiesPage} />
          <Route path="/terms" component={TermsPage} />
          <Route path="/import" component={ImportPage} />
          <Route path="/crdt-test" component={CRDTTestPage} />
          <Route path="/photo-enhancement" component={PhotoEnhancementPage} />
          <Route path="/photo-sync-test" component={PhotoSyncTestPageComponent} />
          <Route path="/notification-test" component={NotificationTestPage} />
          <Route path="/shared/:token" component={SharedPropertyPage} />
          <Route path="/:rest*" component={NotFound} />
          <Toaster />
        </AppShell>
      </TooltipProvider>
    </AppProvider>
  );
}