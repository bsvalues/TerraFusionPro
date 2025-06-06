const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve the HTML file directly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'property-dashboard.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Property dashboard server running at http://0.0.0.0:${PORT}`);
  console.log(`OPEN THIS URL IN YOUR BROWSER to see the property dashboard.`);
});