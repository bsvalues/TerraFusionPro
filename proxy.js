/**
 * TerraFusion Core AI Valuator - API Proxy
 * This script provides a proxy to forward requests from the frontend to the Python API
 */

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");

// Create Express server
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, "frontend")));

// Proxy API requests to the Python backend
app.use(
  "/appraise",
  createProxyMiddleware({
    target: "http://localhost:8000",
    changeOrigin: true,
  })
);

app.use(
  "/market-analysis",
  createProxyMiddleware({
    target: "http://localhost:8000",
    changeOrigin: true,
  })
);

app.use(
  "/valuation-narrative",
  createProxyMiddleware({
    target: "http://localhost:8000",
    changeOrigin: true,
  })
);

// Add our new AI valuation endpoint proxy
app.use(
  "/ai",
  createProxyMiddleware({
    target: "http://localhost:8000",
    changeOrigin: true,
    pathRewrite: {
      "^/ai": "/ai", // keep the /ai prefix when forwarding
    },
    logLevel: "debug", // This will help with debugging
  })
);

// All other requests go to the frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`TerraFusion Frontend Server running on port ${PORT}`);
  console.log(`Proxying API requests to Python backend at http://localhost:8000`);
});
