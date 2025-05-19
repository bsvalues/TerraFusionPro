/**
 * Test script for the TerraFusion Property Analysis API
 * This script tests the HTTP endpoint directly
 */

const axios = require('axios');

async function testPropertyAnalysisAPI() {
  console.log('Testing TerraFusion Property Analysis API');
  
  // Sample property data for 406 Stardust Ct, Grandview, WA
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
    squareFeet: 2800,
    yearBuilt: 2005,
    lotSize: 0.35,
    features: [
      { name: "Granite Countertops" },
      { name: "Hardwood Floors" },
      { name: "Finished Basement" },
      { name: "Deck" }
    ],
    condition: "Good"
  };
  
  try {
    console.log('Sending API request...');
    
    const response = await axios.post('http://localhost:5000/api/property-analysis', propertyData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response received!');
    console.log('Status:', response.status);
    
    if (response.status === 200) {
      const valuation = response.data;
      
      console.log('\n=== PROPERTY VALUATION RESULTS ===');
      console.log(`Estimated Value: $${valuation.estimatedValue.toLocaleString()}`);
      console.log(`Confidence Level: ${valuation.confidenceLevel}`);
      console.log(`Value Range: $${valuation.valueRange.min.toLocaleString()} - $${valuation.valueRange.max.toLocaleString()}`);
      
      console.log('\nADJUSTMENTS:');
      valuation.adjustments.forEach(adj => {
        console.log(`- ${adj.factor}: ${adj.amount >= 0 ? '+' : ''}$${adj.amount.toLocaleString()} (${adj.description})`);
      });
      
      console.log('\nMARKET ANALYSIS:');
      console.log(valuation.marketAnalysis);
      
      console.log('\nCOMPARABLE ANALYSIS:');
      console.log(valuation.comparableAnalysis);
      
      console.log('\nVALUATION METHODOLOGY:');
      console.log(valuation.valuationMethodology);
    } else {
      console.error('Unexpected status code:', response.status);
    }
  } catch (error) {
    console.error('Error testing property analysis API:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Server responded with error status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
  }
}

// Run the test
testPropertyAnalysisAPI();