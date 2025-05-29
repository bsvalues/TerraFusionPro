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
            <Route path="/reports" component={() => <div className="text-center py-16 text-slate-600">Reports page - Coming Soon</div>} />
            <Route path="/orders" component={() => <div className="text-center py-16 text-slate-600">Orders page - Coming Soon</div>} />
            <Route path="/properties" component={() => <div className="text-center py-16 text-slate-600">Properties page - Coming Soon</div>} />
            <Route path="/comps" component={() => <div className="text-center py-16 text-slate-600">Comparables page - Coming Soon</div>} />
            <Route path="/photos" component={() => <div className="text-center py-16 text-slate-600">Photos page - Coming Soon</div>} />
            <Route path="/sketches" component={() => <div className="text-center py-16 text-slate-600">Sketches page - Coming Soon</div>} />
            <Route path="/analytics" component={() => <div className="text-center py-16 text-slate-600">Analytics page - Coming Soon</div>} />
            <Route path="/ai" component={() => <div className="text-center py-16 text-slate-600">AI Assistant page - Coming Soon</div>} />
            <Route path="/conversion" component={() => <div className="text-center py-16 text-slate-600">Conversion page - Coming Soon</div>} />
            <Route path="/compliance" component={() => <div className="text-center py-16 text-slate-600">Compliance page - Coming Soon</div>} />
            <Route path="/settings" component={() => <div className="text-center py-16 text-slate-600">Settings page - Coming Soon</div>} />
          </AppShell>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
