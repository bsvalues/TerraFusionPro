/**
 * Simplified test script for 406 Stardust Ct, Grandview, WA
 * This uses the API endpoint we created directly
 */

import fetch from 'node-fetch';

async function testPropertyAnalysis() {
  const propertyData = {
    address: {
      street: "406 Stardust Ct",
      city: "Grandview",
      state: "WA",
      zipCode: "98930"
    },
    propertyType: "Single Family",
    bedrooms: 4,
    bathrooms: 2.5,
    squareFeet: 1850,
    yearBuilt: 1995,
    lotSize: 0.17, // acres
    features: [
      {name: "Garage"},
      {name: "Fireplace"},
      {name: "Patio"}
    ],
    condition: "Good"
  };

  console.log('Testing property analysis for:', `${propertyData.address.street}, ${propertyData.address.city}, ${propertyData.address.state}`);
  
  try {
    console.log('Calling API endpoint...');
    // Get the Replit URL dynamically
    const REPLIT_URL = process.env.REPLIT_URL || 'https://' + process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co';
    const API_URL = `${REPLIT_URL}/api/property-analysis`;
    
    console.log(`Using API URL: ${API_URL}`);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(propertyData)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Property Analysis Result:');
    console.log('-------------------------');
    console.log(`Estimated Value: $${result.estimatedValue.toLocaleString()}`);
    console.log(`Confidence Level: ${result.confidenceLevel}`);
    console.log(`Value Range: $${result.valueRange.min.toLocaleString()} - $${result.valueRange.max.toLocaleString()}`);
    
    console.log('\nMarket Analysis:');
    console.log(result.marketAnalysis);
    
    console.log('\nAdjustments:');
    result.adjustments.forEach(adj => {
      console.log(`- ${adj.factor}: $${adj.amount.toLocaleString()} (${adj.description})`);
    });
    
    return result;
  } catch (error) {
    console.error('Error running property analysis:', error);
  }
}

// Run the test
testPropertyAnalysis().catch(err => console.error('Execution error:', err));