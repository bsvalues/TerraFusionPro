import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";
import App from "./App";
import EnhancedApp2 from "./EnhancedApp2";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './components/ui/theme-provider';
import { AppProvider } from './contexts/AppContext';

// Create the root element first
const root = createRoot(document.getElementById("root")!);

console.log("main.tsx executing, rendering App component");

// FORCE NEW UI TO DISPLAY - Direct import
import ForcedNewDashboard from './pages/ForcedNewDashboard';

// Then render the actual app with all necessary providers - FORCE SIMPLE DIRECT RENDER
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppProvider>
          <div className="min-h-screen">
            <ForcedNewDashboard />
          </div>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
