/**
 * Simple test script for TerraFusion Property Analysis
 * This script directly tests the property analysis functionality for 406 Stardust Ct, Grandview, WA
 */

import axios from 'axios';

async function testPropertyAnalysis() {
  const propertyData = {
    address: "406 Stardust Ct",
    city: "Grandview",
    state: "WA",
    zipCode: "98930",
    propertyType: "residential"
  };

  try {
    console.log('Testing property analysis for:', `${propertyData.address}, ${propertyData.city}, ${propertyData.state} ${propertyData.zipCode}`);
    
    // First attempt - try standard REST API endpoint if available
    try {
      console.log('Attempting API endpoint...');
      const apiResponse = await axios.post('http://localhost:5000/api/property-analysis', propertyData);
      console.log('API Response:', apiResponse.data);
      return apiResponse.data;
    } catch (apiError) {
      console.log('API endpoint failed or not available, trying WebSocket fallback...');
    }

    // Second attempt - Generate a fake client ID and request ID for WebSocket simulation
    const clientId = `test_client_${Date.now()}`;
    const requestId = `test_request_${Date.now()}`;

    // Try polling endpoint (WebSocket fallback)
    console.log('Testing using polling endpoint...');
    const pollResponse = await axios.post('http://localhost:5000/api/property-analysis/ws-fallback', {
      clientId,
      requestId,
      type: 'property_analysis_request',
      data: propertyData
    });
    
    console.log('Poll Response:', pollResponse.data);
    return pollResponse.data;
    
  } catch (error) {
    console.error('Error testing property analysis:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
testPropertyAnalysis().catch(err => console.error('Execution error:', err));