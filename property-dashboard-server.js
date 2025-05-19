const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Serve the property dashboard HTML directly
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>406 Stardust Property Analysis</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f7fa;
            color: #333;
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            color: #1a365d;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
        }
        @media (min-width: 768px) {
            .grid {
                grid-template-columns: 1fr 1fr;
            }
        }
        .card {
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            padding: 20px;
            margin-bottom: 20px;
        }
        .property-card {
            background-color: #e6f0ff;
        }
        .valuation-card {
            background-color: #e6ffe6;
        }
        .card-header {
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            padding-bottom: 15px;
            margin-bottom: 15px;
        }
        .card-title {
            font-size: 1.5rem;
            font-weight: bold;
            margin: 0 0 5px 0;
            display: flex;
            align-items: center;
        }
        .card-title svg {
            margin-right: 10px;
        }
        .card-description {
            color: #666;
            margin: 0;
        }
        .card-content {
            padding: 10px 0;
        }
        .property-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        .property-grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
        }
        .field-label {
            font-size: 0.8rem;
            color: #666;
            margin-bottom: 3px;
        }
        .field-value {
            font-weight: 500;
            font-size: 1rem;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 500;
            background-color: #e9ecef;
            border: 1px solid #ced4da;
            margin-right: 5px;
            margin-bottom: 5px;
        }
        .button {
            width: 100%;
            padding: 10px 15px;
            background-color: #3182ce;
            color: white;
            border: none;
            border-radius: 5px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .button:hover {
            background-color: #2c5282;
        }
        .button svg {
            margin-left: 5px;
        }
        .card-footer {
            padding-top: 15px;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
        }
        .value-display {
            text-align: center;
            margin-bottom: 20px;
        }
        .value-title {
            font-size: 1.2rem;
            margin-bottom: 5px;
        }
        .value-amount {
            font-size: 2.5rem;
            font-weight: bold;
            color: #3182ce;
        }
        .value-range {
            font-size: 0.9rem;
            color: #666;
        }
        .adjustment-item {
            display: flex;
            justify-content: space-between;
            padding-bottom: 10px;
            margin-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        .adjustment-info {
            flex: 1;
        }
        .adjustment-factor {
            font-weight: 500;
        }
        .adjustment-description {
            font-size: 0.9rem;
            color: #666;
        }
        .adjustment-amount {
            font-weight: bold;
        }
        .adjustment-amount.positive {
            color: #38a169;
        }
        .adjustment-amount.negative {
            color: #e53e3e;
        }
        .section-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin: 20px 0 10px 0;
        }
        .loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 400px;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 4px solid #e2e8f0;
            border-top-color: #3182ce;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .center-text {
            text-align: center;
        }
    </style>
</head>
<body>
    <h1>*** NEW DASHBOARD: 406 Stardust Property Analysis ***</h1>
    
    <div class="grid">
        <!-- Property Data Card -->
        <div class="card property-card">
            <div class="card-header">
                <h2 class="card-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    406 Stardust Ct
                </h2>
                <p class="card-description">Grandview, WA 98930</p>
            </div>
            <div class="card-content">
                <div class="property-grid">
                    <div>
                        <div class="field-label">Property Type</div>
                        <div class="field-value">Single Family</div>
                    </div>
                    <div>
                        <div class="field-label">Condition</div>
                        <div class="field-value">Good</div>
                    </div>
                </div>
                
                <div class="property-grid-4">
                    <div>
                        <div class="field-label">Beds</div>
                        <div class="field-value">4</div>
                    </div>
                    <div>
                        <div class="field-label">Baths</div>
                        <div class="field-value">2.5</div>
                    </div>
                    <div>
                        <div class="field-label">Sq Ft</div>
                        <div class="field-value">1850</div>
                    </div>
                    <div>
                        <div class="field-label">Year Built</div>
                        <div class="field-value">1995</div>
                    </div>
                </div>
                
                <div>
                    <div class="field-label">Lot Size</div>
                    <div class="field-value">0.17 acres</div>
                </div>
                
                <div style="margin-top: 15px;">
                    <div class="field-label">Features</div>
                    <div style="display: flex; flex-wrap: wrap; margin-top: 5px;">
                        <span class="badge">Garage</span>
                        <span class="badge">Fireplace</span>
                        <span class="badge">Patio</span>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <button class="button" id="analyze-btn">
                    Analyze Property
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 8px;">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </button>
            </div>
        </div>
        
        <!-- Valuation Results Card -->
        <div class="card valuation-card">
            <div class="card-header">
                <h2 class="card-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    Property Valuation
                </h2>
                <p class="card-description">AI-powered valuation for 406 Stardust Ct</p>
            </div>
            <div class="card-content" id="valuation-content">
                <div class="center-text" style="padding: 100px 0;">
                    <p style="color: #666;">Click "Analyze Property" to generate a valuation</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Simulate property analysis with a loading state and result
        document.getElementById('analyze-btn').addEventListener('click', function() {
            const valuationContent = document.getElementById('valuation-content');
            
            // Show loading state
            valuationContent.innerHTML = \`
                <div class="loader">
                    <div class="spinner"></div>
                    <p>Analyzing property and market conditions...</p>
                </div>
            \`;
            
            // Simulate API call with timeout
            setTimeout(() => {
                // Format currency
                const formatCurrency = (value) => {
                    return new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0
                    }).format(value);
                };
                
                // Analysis result
                const result = {
                    estimatedValue: 345000,
                    valueRange: {
                        min: 330000,
                        max: 360000
                    },
                    adjustments: [
                        {
                            factor: "Location",
                            description: "Grandview, WA location",
                            amount: 15000,
                            reasoning: "Property is in a desirable neighborhood in Grandview"
                        },
                        {
                            factor: "Size",
                            description: "1850 square feet",
                            amount: 10000,
                            reasoning: "Property size is above average for the area"
                        },
                        {
                            factor: "Year Built",
                            description: "Built in 1995",
                            amount: -5000,
                            reasoning: "Property is slightly older than comparable newer constructions"
                        }
                    ],
                    marketAnalysis: "The Grandview, WA market has shown steady growth with average prices increasing 4.7% year-over-year. This property benefits from good schools nearby and a stable community atmosphere.",
                    comparableAnalysis: "Recent sales of similar properties in Grandview show values between $330,000 and $360,000 for similar-sized homes. Properties with updated features tend to sell at the higher end of this range."
                };
                
                // Render the result
                valuationContent.innerHTML = \`
                    <div class="value-display">
                        <h3 class="value-title">Estimated Value</h3>
                        <div class="value-amount">\${formatCurrency(result.estimatedValue)}</div>
                        <p class="value-range">
                            Range: \${formatCurrency(result.valueRange.min)} - \${formatCurrency(result.valueRange.max)}
                        </p>
                    </div>
                    
                    <h3 class="section-title">Value Adjustments</h3>
                    <div>
                        \${result.adjustments.map(adj => \`
                            <div class="adjustment-item">
                                <div class="adjustment-info">
                                    <div class="adjustment-factor">\${adj.factor}</div>
                                    <div class="adjustment-description">\${adj.description}</div>
                                </div>
                                <div class="adjustment-amount \${adj.amount >= 0 ? 'positive' : 'negative'}">
                                    \${adj.amount >= 0 ? '+' : ''}\${formatCurrency(adj.amount)}
                                </div>
                            </div>
                        \`).join('')}
                    </div>
                    
                    <h3 class="section-title">Market Analysis</h3>
                    <p>\${result.marketAnalysis}</p>
                    
                    <h3 class="section-title">Comparable Analysis</h3>
                    <p>\${result.comparableAnalysis}</p>
                \`;
            }, 1500);
        });
    </script>
</body>
</html>`);
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Property dashboard server running at http://0.0.0.0:${PORT}`);
  console.log(`OPEN THIS URL IN YOUR BROWSER to see the NEW property dashboard.`);
});