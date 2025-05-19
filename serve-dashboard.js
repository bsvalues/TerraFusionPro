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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Property dashboard server running at http://0.0.0.0:${PORT}`);
});