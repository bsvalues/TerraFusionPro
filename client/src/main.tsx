import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";
import App from "./App";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AppraisalProvider } from '@/contexts/AppraisalContext';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from '@/components/ui/toaster';

// Create the root element first
const root = createRoot(document.getElementById("root")!);

// Then render the actual app with all necessary providers
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppraisalProvider>
          <App />
          <Toaster />
        </AppraisalProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
