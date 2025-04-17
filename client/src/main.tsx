import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";
import DirectApp from "./DirectApp";

// Create the root element first
const root = createRoot(document.getElementById("root")!);

// Then render the app
root.render(
  <React.StrictMode>
    <DirectApp />
  </React.StrictMode>
);
