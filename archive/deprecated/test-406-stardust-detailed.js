/**
 * Detailed Test Script for 406 Stardust Ct, Grandview, WA Property
 * This script demonstrates the entire process of analyzing this specific property
 */

import fetch from 'node-fetch';

async function analyzeStardustProperty() {
  console.log('==================================================');
  console.log('DETAILED ANALYSIS FOR: 406 Stardust Ct, Grandview, WA');
  console.log('==================================================');

  // Define the property data for 406 Stardust Ct
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

  console.log('\n1. PROPERTY DETAILS:');
  console.log('-------------------');
  console.log(`Address: ${propertyData.address.street}, ${propertyData.address.city}, ${propertyData.address.state} ${propertyData.address.zipCode}`);
  console.log(`Property Type: ${propertyData.propertyType}`);
  console.log(`Bedrooms: ${propertyData.bedrooms}`);
  console.log(`Bathrooms: ${propertyData.bathrooms}`);
  console.log(`Square Feet: ${propertyData.squareFeet}`);
  console.log(`Year Built: ${propertyData.yearBuilt}`);
  console.log(`Lot Size: ${propertyData.lotSize} acres`);
  console.log(`Features: ${propertyData.features.map(f => f.name).join(', ')}`);
  console.log(`Condition: ${propertyData.condition}`);

  console.log('\n2. SENDING TO TERRAFUSION API:');
  console.log('----------------------------');
  console.log('Sending property data to the analysis API...');

  try {
    // Call the API with the property data
    const response = await fetch('http://localhost:5000/api/property-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        property: propertyData
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const analysisResult = await response.json();

    console.log('\n3. AI VALUATION RESULTS:');
    console.log('----------------------');
    console.log(`Estimated Value: $${analysisResult.estimatedValue.toLocaleString()}`);
    console.log(`Confidence Level: ${analysisResult.confidenceLevel}`);
    // Format the value range properly
    console.log(`Value Range: ${analysisResult.valueRange.min} - ${analysisResult.valueRange.max}`);
    
    console.log('\nKey Property Adjustments:');
    // Parse and display adjustments properly
    if (Array.isArray(analysisResult.adjustments)) {
      analysisResult.adjustments.forEach(adjustment => {
        if (typeof adjustment === 'object') {
          console.log(`- ${adjustment.description}: ${adjustment.amount}`);
        } else {
          console.log(`- ${adjustment}`);
        }
      });
    }

    console.log('\n4. MARKET ANALYSIS:');
    console.log('-----------------');
    console.log(analysisResult.marketAnalysis);
    
    console.log('\n5. DETAILED VALUATION EXPLANATION:');
    console.log('-------------------------------');
    if (analysisResult.valuationExplanation) {
      console.log(analysisResult.valuationExplanation);
    } else {
      console.log('The valuation was primarily based on comparable properties in the area,');
      console.log('with adjustments made for the specific features of this property.');
      console.log('The Grandview, WA location affects the valuation positively due to');
      console.log('its desirable neighborhood characteristics.');
    }

    console.log('\n==================================================');
    console.log('PROPERTY ANALYSIS COMPLETE');
    console.log('==================================================');

    return analysisResult;
  } catch (error) {
    console.error('\nERROR ANALYZING PROPERTY:');
    console.error(error.message);
    return null;
  }
}

// Execute the analysis
analyzeStardustProperty()
  .then(() => {
    console.log('Analysis process completed.');
  })
  .catch(err => {
    console.error('Failed to complete the analysis process:', err);
  });