const express = require('express');
const path = require('path');
const app = express();
const port = 5000;

// Serve static files from the root directory
app.use(express.static('./'));

// Add property analysis API endpoint
app.post('/api/property-analysis', express.json(), (req, res) => {
  const { property } = req.body;
  
  console.log(`Received property analysis request for: ${property.address.street}`);
  
  // Process the property data (this would call the real analysis in production)
  const result = {
    estimatedValue: 345000,
    confidenceLevel: 'Medium',
    valueRange: {
      min: 330000,
      max: 360000
    },
    adjustments: [
      { description: 'Grandview, WA location', amount: 15000 },
      { description: `${property.squareFeet} square feet`, amount: 10000 },
      { description: `Built in ${property.yearBuilt}`, amount: -5000 }
    ],
    marketAnalysis: 'The Grandview, WA market has shown steady growth with average prices increasing 4.7% year-over-year. This property benefits from good schools nearby and a stable community atmosphere.'
  };
  
  res.json(result);
});

// Route to serve the HTML page
app.get('/property', (req, res) => {
  res.sendFile(path.join(__dirname, 'simple-property.html'));
});

// Root route redirects to property analysis page
app.get('/', (req, res) => {
  res.redirect('/property');
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Property analysis server running on port ${port}`);
  console.log(`Open http://localhost:${port}/ to view the property report`);
});