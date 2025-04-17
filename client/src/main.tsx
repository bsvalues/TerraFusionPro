import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";

// Create a simple app component
function BasicApp() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Basic App</h1>
      <p className="mb-4">This is a basic app with no context dependencies.</p>
      <p>
        <button className="px-4 py-2 bg-blue-500 text-white rounded">
          Click Me
        </button>
      </p>
    </div>
  );
}

// Create the root element first
const root = createRoot(document.getElementById("root")!);

// Then render the app
root.render(
  <React.StrictMode>
    <BasicApp />
  </React.StrictMode>
);
