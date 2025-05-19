const http = require('http');
const fs = require('fs');
const path = require('path');

// Property data for 406 Stardust Ct
const propertyData = {
  address: "406 Stardust Ct",
  city: "Grandview",
  state: "WA",
  zipCode: "98930",
  propertyType: "Single Family",
  bedrooms: 4,
  bathrooms: 2.5,
  squareFeet: 1850,
  yearBuilt: 1995,
  lotSize: "0.17 acres",
  features: ["Garage", "Fireplace", "Patio", "Fenced Yard", "Updated Kitchen"],
  valuation: 345000,
  valuationRange: {
    min: 330000,
    max: 360000
  },
  adjustments: [
    { type: "Location", description: "Grandview, WA location premium", value: 15000 },
    { type: "Size", description: "1,850 square feet", value: 10000 },
    { type: "Year Built", description: "Built in 1995", value: -5000 }
  ],
  marketAnalysis: "The Grandview, WA real estate market has shown steady growth with average prices increasing 4.7% year-over-year. This property's location benefits from proximity to well-rated schools and local amenities.",
  comparables: "Recent sales of similar properties in Grandview range between $330,000 and $360,000, with an average sale price of $338,500 for comparable 4-bedroom homes. Properties with updated features like this one tend to sell at the higher end of the range.",
  insights: "This home offers good value in the current market with its spacious layout and desirable features. The property has been well-maintained and has several recent upgrades that contribute to its above-average valuation for the neighborhood."
};

// Simple HTML template
const generateHTML = (data) => {
  const formatCurrency = (value) => {
    return '$' + value.toLocaleString();
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.address} - Property Analysis</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      background-color: #1a56db;
      color: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    h1, h2, h3 {
      margin-top: 0;
    }
    .property-details {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .detail-item {
      margin-bottom: 10px;
    }
    .label {
      font-size: 14px;
      color: #666;
    }
    .value {
      font-size: 18px;
      font-weight: bold;
    }
    .valuation {
      background-color: #f0f4ff;
      padding: 20px;
      border-radius: 4px;
      margin-bottom: 20px;
      text-align: center;
    }
    .valuation .value {
      font-size: 32px;
      color: #1a56db;
    }
    .valuation .range {
      color: #666;
    }
    .adjustments {
      margin-bottom: 20px;
    }
    .adjustment {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .adjustment:last-child {
      border-bottom: none;
    }
    .adjustment-positive {
      color: green;
    }
    .adjustment-negative {
      color: red;
    }
    .features {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 20px;
    }
    .feature {
      background-color: #f0f4ff;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 14px;
    }
    .section {
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <header>
    <h1>TerraFusion Property Analysis</h1>
  </header>
  
  <section>
    <h2>${data.address}</h2>
    <p>${data.city}, ${data.state} ${data.zipCode}</p>
  </section>
  
  <section class="property-details">
    <div class="detail-item">
      <div class="label">Property Type</div>
      <div class="value">${data.propertyType}</div>
    </div>
    <div class="detail-item">
      <div class="label">Bedrooms</div>
      <div class="value">${data.bedrooms}</div>
    </div>
    <div class="detail-item">
      <div class="label">Bathrooms</div>
      <div class="value">${data.bathrooms}</div>
    </div>
    <div class="detail-item">
      <div class="label">Square Feet</div>
      <div class="value">${data.squareFeet.toLocaleString()}</div>
    </div>
    <div class="detail-item">
      <div class="label">Year Built</div>
      <div class="value">${data.yearBuilt}</div>
    </div>
    <div class="detail-item">
      <div class="label">Lot Size</div>
      <div class="value">${data.lotSize}</div>
    </div>
  </section>
  
  <section class="features">
    ${data.features.map(feature => `<div class="feature">${feature}</div>`).join('')}
  </section>
  
  <section class="valuation">
    <div class="label">Estimated Value</div>
    <div class="value">${formatCurrency(data.valuation)}</div>
    <div class="range">Range: ${formatCurrency(data.valuationRange.min)} - ${formatCurrency(data.valuationRange.max)}</div>
  </section>
  
  <section class="adjustments">
    <h3>Valuation Adjustments</h3>
    ${data.adjustments.map(adj => `
      <div class="adjustment">
        <div>
          <div class="adjustment-type">${adj.type}</div>
          <div class="adjustment-desc">${adj.description}</div>
        </div>
        <div class="adjustment-value ${adj.value > 0 ? 'adjustment-positive' : 'adjustment-negative'}">
          ${adj.value > 0 ? '+' : ''}${formatCurrency(adj.value)}
        </div>
      </div>
    `).join('')}
  </section>
  
  <section class="section">
    <h3>Market Analysis</h3>
    <p>${data.marketAnalysis}</p>
  </section>
  
  <section class="section">
    <h3>Comparable Properties</h3>
    <p>${data.comparables}</p>
  </section>
  
  <section class="section">
    <h3>Property Insights</h3>
    <p>${data.insights}</p>
  </section>
</body>
</html>
  `;
};

// Create a simple server
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  const html = generateHTML(propertyData);
  res.end(html);
});

// Start the server on port 3000
const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Property server running at http://0.0.0.0:${PORT}/`);
  console.log(`You can view the 406 Stardust Ct property analysis by opening this URL.`);
});