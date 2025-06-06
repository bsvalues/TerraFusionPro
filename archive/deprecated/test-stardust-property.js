/**
 * TerraFusion Property Analysis Test for 406 Stardust Ct
 * This script directly tests the property analysis API endpoint
 */

import axios from 'axios';

async function testStardustProperty() {
  try {
    console.log('Testing property analysis for 406 Stardust Ct...');
    
    // Sample property data matching the structure expected by the API
    const propertyData = {
      address: {
        street: '406 Stardust Ct',
        city: 'Grandview',
        state: 'WA',
        zipCode: '98930'
      },
      propertyType: 'Single Family',
      bedrooms: 4,
      bathrooms: 2.5,
      squareFeet: 1850,
      yearBuilt: 1995,
      lotSize: 0.17,
      features: [
        { name: 'Garage' },
        { name: 'Fireplace' },
        { name: 'Patio' }
      ],
      condition: 'Good'
    };

    // Make a POST request to the property analysis endpoint
    console.log('Sending request to property analysis API...');
    const response = await axios.post('http://localhost:5000/api/property-analysis', propertyData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout
    });

    // Display the response
    console.log('Property Analysis Result:');
    console.log('Estimated Value:', response.data.estimatedValue);
    console.log('Confidence Level:', response.data.confidenceLevel);
    console.log('Value Range:', `$${response.data.valueRange.min.toLocaleString()} - $${response.data.valueRange.max.toLocaleString()}`);
    console.log('Adjustments:', response.data.adjustments.length);
    console.log('Market Analysis Length:', response.data.marketAnalysis.length);
    
    // Return full response for inspection
    return response.data;
  } catch (error) {
    console.error('Error testing property analysis:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
testStardustProperty()
  .then(result => {
    if (result) {
      console.log('✅ Property analysis test completed successfully!');
    }
  })
  .catch(err => {
    console.error('❌ Property analysis test failed:', err.message);
  });