import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";
import App from "./App";
import EnhancedApp2 from "./EnhancedApp2";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './components/ui/theme-provider';

// Create the root element first
const root = createRoot(document.getElementById("root")!);

console.log("main.tsx executing, rendering App component");

// Use the enhanced app with the new UI components
// Change this to <App /> to use the original app
const UseEnhancedUI = true;

// Then render the actual app with all necessary providers
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {UseEnhancedUI ? <EnhancedApp2 /> : <App />}
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
