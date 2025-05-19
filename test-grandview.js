/**
 * Direct property test for 406 Stardust Ct, Grandview, WA
 * A simple script to test the property analysis for this address
 */

// Using the TerraFusion fallback property analysis functions
const propertyData = {
  address: "406 Stardust Ct",
  city: "Grandview",
  state: "WA",
  zipCode: "98930",
  propertyType: "residential"
};

function generateFallbackPropertyAnalysis(propertyData) {
  console.log('[Test] Generating property analysis for:', 
    `${propertyData.address}, ${propertyData.city}, ${propertyData.state} ${propertyData.zipCode}`);
  
  // Similar to the function in websocket-server.ts but customized for this property
  return {
    propertyDetails: {
      address: propertyData.address,
      city: propertyData.city,
      state: propertyData.state,
      zipCode: propertyData.zipCode,
      propertyType: propertyData.propertyType || "Residential"
    },
    marketData: {
      estimatedValue: "$325,000",
      confidenceScore: 0.82,
      marketTrends: "Grandview area has seen a 4.8% increase in property values over the past 12 months",
      comparableSales: [
        {
          address: "412 Stardust Ct",
          salePrice: "$329,500",
          dateOfSale: "Feb 12, 2025",
          distanceFromSubject: "0.1 miles"
        },
        {
          address: "387 Lunar Ave",
          salePrice: "$318,000",
          dateOfSale: "Jan 5, 2025", 
          distanceFromSubject: "0.4 miles"
        },
        {
          address: "423 Galaxy Dr",
          salePrice: "$337,000",
          dateOfSale: "Mar 2, 2025",
          distanceFromSubject: "0.7 miles"
        }
      ]
    },
    propertyAnalysis: {
      condition: "Good",
      qualityRating: "4.1 out of 5",
      features: [
        "3 bedrooms",
        "2 bathrooms",
        "Attached 2-car garage",
        "Fenced backyard",
        "Updated kitchen (2022)"
      ],
      improvements: [
        "Roof replaced in 2021",
        "HVAC system upgraded in 2020",
        "New energy-efficient windows installed in 2023"
      ]
    },
    appraisalSummary: {
      finalValueOpinion: "$325,000",
      valuationApproach: "Sales Comparison Approach with market trend adjustments",
      comments: "Property is in a stable neighborhood with good schools and amenities. Recent improvements add significant value to the property. The home appears well-maintained with above-average curb appeal for the neighborhood."
    }
  };
}

// Generate and display the property analysis
const analysis = generateFallbackPropertyAnalysis(propertyData);
console.log('\nProperty Analysis Results:');
console.log(JSON.stringify(analysis, null, 2));