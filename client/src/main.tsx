import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";
import EnhancedApp from "./EnhancedApp";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './components/ui/theme-provider';

// Create the root element first
const root = createRoot(document.getElementById("root")!);

// Then render the actual app with all necessary providers
// Note: AppraisalProvider temporarily removed until we resolve the context issues
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <EnhancedApp />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
