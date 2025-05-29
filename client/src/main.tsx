import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";
import { Route } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './components/ui/theme-provider';
import { AppProvider } from './contexts/AppContext';
import { AppShell } from './components/layout/AppShell';
import ModernDashboard from './pages/ModernDashboard';
import Reports from './pages/Reports';
import Orders from './pages/Orders';
import Properties from './pages/Properties';
import Comparables from './pages/Comparables';
import Photos from './pages/Photos';
import Sketches from './pages/Sketches';
import Analytics from './pages/Analytics';
import AIAssistant from './pages/AIAssistant';
import Conversion from './pages/Conversion';
import Compliance from './pages/Compliance';
import Settings from './pages/Settings';

// Create the root element first
const root = createRoot(document.getElementById("root")!);

console.log("TerraFusion: Loading unified modern application");

// UNIFIED APPLICATION - Modern architecture with AppShell
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppProvider>
          <AppShell>
            <Route path="/" component={ModernDashboard} />
            <Route path="/dashboard" component={ModernDashboard} />
            <Route path="/reports" component={Reports} />
            <Route path="/orders" component={Orders} />
            <Route path="/properties" component={Properties} />
            <Route path="/comps" component={Comparables} />
            <Route path="/photos" component={Photos} />
            <Route path="/sketches" component={Sketches} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/ai" component={AIAssistant} />
            <Route path="/conversion" component={Conversion} />
            <Route path="/compliance" component={Compliance} />
            <Route path="/settings" component={Settings} />
          </AppShell>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
