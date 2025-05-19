const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

// Serve the standalone HTML file directly
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'property-dashboard.html');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading HTML file:', err);
      return res.status(500).send('Error loading dashboard');
    }
    res.send(data);
  });
});

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Property dashboard server running at http://0.0.0.0:${PORT}`);
  console.log(`Open this URL in your browser to see the new dashboard.`);
});