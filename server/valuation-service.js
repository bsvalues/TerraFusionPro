/**
 * TerraFusion AI Valuation Service - Node.js Implementation
 * This implements a Node.js version of the valuation endpoint that was 
 * previously implemented in Python. This allows us to avoid cross-server
 * communication issues.
 */

// Mock database for properties (equivalent to the Python implementation)
const PROPERTY_DB = {
  1: {
    address: {
      street: "123 Main St",
      city: "Anytown",
      state: "CA",
      zipCode: "90210"
    },
    propertyType: "single-family",
    bedrooms: 3,
    bathrooms: 2.5,
    squareFeet: 2100,
    yearBuilt: 1985,
    lotSize: 0.25,
    features: [
      {name: "Hardwood Floors"},
      {name: "Fireplace"}
    ],
    condition: "Good"
  },
  2: {
    address: {
      street: "456 Oak Ave",
      city: "Somewhere",
      state: "TX",
      zipCode: "75001"
    },
    propertyType: "townhouse",
    bedrooms: 2,
    bathrooms: 1.5,
    squareFeet: 1500,
    yearBuilt: 2005,
    lotSize: 0.1,
    features: [
      {name: "Updated Kitchen"}
    ],
    condition: "Excellent"
  }
};

// Property type adjustment factors
const propertyTypeFactors = {
  "single-family": 1.0,
  "condo": 0.85,
  "townhouse": 0.9,
  "multi-family": 1.2,
  "land": 0.7
};

// Condition factors
const conditionFactors = {
  "Excellent": 1.15,
  "Good": 1.0,
  "Average": 0.9,
  "Fair": 0.75,
  "Poor": 0.6
};

// Feature values
const featureValues = {
  "Hardwood Floors": 5000,
  "Updated Kitchen": 15000,
  "Fireplace": 3000,
  "Deck": 5000,
  "Swimming Pool": 20000,
  "Garage": 10000,
  "Central AC": 7000,
  "New Roof": 8000
};

/**
 * Predict the value of a property based on its characteristics
 */
function predictValue(propertyData) {
  console.log(`Predicting value for property: ${propertyData.address?.street || 'Unknown'}`);
  
  // Base valuation using heuristics
  let base = 100000;  // base heuristic
  
  // Get property type factor
  const typeFactor = propertyTypeFactors[propertyData.propertyType] || 1.0;
      
  // Get condition factor
  const conditionFactor = conditionFactors[propertyData.condition] || 1.0;
      
  // Get square feet factor
  const sizeFactor = propertyData.squareFeet ? propertyData.squareFeet / 1000 : 1.0;
  
  // Calculate special feature adjustments
  let featureBonus = 0;
  if (Array.isArray(propertyData.features)) {
    featureBonus = propertyData.features.reduce((sum, feature) => {
      const featureName = typeof feature === 'string' ? feature : feature.name;
      return sum + (featureValues[featureName] || 0);
    }, 0);
  }

  // Calculate final estimated value
  const estimated = base * typeFactor * conditionFactor * sizeFactor + featureBonus;
  
  return Math.round(estimated * 100) / 100;
}

/**
 * Generate a basic market analysis narrative
 */
function generateMarketAnalysis(propertyData) {
  const city = propertyData.address?.city || 'the area';
  const state = propertyData.address?.state || '';
  
  return `The real estate market in ${city}, ${state} has been showing moderate growth. ` +
         `Properties similar to this one have been in demand, with average days on market ` +
         `of 35 days. Current interest rates and inventory levels suggest a balanced market ` +
         `for this property type.`;
}

/**
 * Generate adjustment details for the valuation
 */
function generateAdjustments(propertyData) {
  const adjustments = [];
  
  // Property type adjustment
  const propType = propertyData.propertyType;
  if (propType && propertyTypeFactors[propType]) {
    const factor = propertyTypeFactors[propType];
    if (factor !== 1.0) {
      adjustments.push({
        factor: "Property Type",
        description: `Property type: ${propType}`,
        amount: Math.round((factor - 1.0) * 100000 * 100) / 100,
        reasoning: `${propType.charAt(0).toUpperCase() + propType.slice(1)} properties have different base values`
      });
    }
  }
  
  // Condition adjustment
  const condition = propertyData.condition;
  if (condition && conditionFactors[condition]) {
    const factor = conditionFactors[condition];
    if (factor !== 1.0) {
      adjustments.push({
        factor: "Condition",
        description: `Property condition: ${condition}`,
        amount: Math.round((factor - 1.0) * 100000 * 100) / 100,
        reasoning: `Property in ${condition} condition affects base value`
      });
    }
  }
  
  // Feature adjustments
  const features = propertyData.features || [];
  if (Array.isArray(features)) {
    features.forEach(feature => {
      // Handle both string features and object features with a name field
      const featureName = typeof feature === 'string' ? feature : feature.name;
      const value = featureValues[featureName] || 0;
      
      if (value > 0) {
        adjustments.push({
          factor: "Special Feature",
          description: featureName,
          amount: value,
          reasoning: `${featureName} adds value to the property`
        });
      }
    });
  }
  
  return adjustments;
}

/**
 * Generate a comprehensive valuation report for a property using Anthropic API
 */
async function generateValuationReport(propertyData) {
  console.log("Generating AI-powered valuation report for property:", propertyData.address?.street);
  
  try {
    // Import Anthropic - only import if needed
    const Anthropic = require('@anthropic-ai/sdk').default;
    
    // Initialize Anthropic client with API key from environment
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    // Format the property data for the prompt
    const propertyAddress = `${propertyData.address?.street}, ${propertyData.address?.city}, ${propertyData.address?.state} ${propertyData.address?.zipCode}`;
    
    // Create a detailed prompt for the property valuation
    const prompt = `You are a professional real estate appraiser tasked with analyzing the following property:

Address: ${propertyAddress}
Property Type: ${propertyData.propertyType || 'Unknown'}
Bedrooms: ${propertyData.bedrooms || 'Unknown'}
Bathrooms: ${propertyData.bathrooms || 'Unknown'}
Square Feet: ${propertyData.squareFeet || 'Unknown'}
Year Built: ${propertyData.yearBuilt || 'Unknown'}
Lot Size: ${propertyData.lotSize ? propertyData.lotSize + ' acres' : 'Unknown'}
Features: ${Array.isArray(propertyData.features) ? propertyData.features.map(f => typeof f === 'string' ? f : f.name).join(', ') : 'None specified'}
Condition: ${propertyData.condition || 'Unknown'}

Please provide a comprehensive property valuation report including:
1. Estimated value in USD (provide a specific number, not a range)
2. Confidence level (high, medium, or low)
3. Value range (minimum and maximum estimated values)
4. List of specific adjustments that impact the valuation (feature, description, dollar amount, and reasoning)
5. Brief market analysis for the area
6. Comparable property analysis
7. Valuation methodology explanation

Return your analysis as a valid JSON object with the following structure:
{
  "estimatedValue": number,
  "confidenceLevel": "high"|"medium"|"low",
  "valueRange": {
    "min": number,
    "max": number
  },
  "adjustments": [
    {
      "factor": string,
      "description": string,
      "amount": number,
      "reasoning": string
    }
  ],
  "marketAnalysis": string,
  "comparableAnalysis": string,
  "valuationMethodology": string
}`;

    console.log("Sending request to Anthropic API...");
    
    // Use fallback to default method if API call fails
    try {
      // Call Anthropic API with the prompt
      // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
      const response = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 2000,
        messages: [
          { 
            role: "user", 
            content: prompt 
          }
        ],
        system: "You are a real estate valuation expert with access to current market data. When providing property valuations, use real market data and trends. Format your response as a valid JSON object only, with no additional text."
      });
      
      console.log("Received response from Anthropic API");
      
      // Parse the response content
      const content = response.content[0].text;
      let jsonResponse;
      
      try {
        // Extract JSON if it's wrapped in code blocks
        if (content.includes('```json')) {
          const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch && jsonMatch[1]) {
            jsonResponse = JSON.parse(jsonMatch[1]);
          } else {
            throw new Error("Could not extract JSON from response");
          }
        } else {
          // Otherwise parse the whole response
          jsonResponse = JSON.parse(content);
        }
        
        // Add timestamp and return the valuation
        return {
          ...jsonResponse,
          timestamp: new Date().toISOString()
        };
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        console.log("Raw response:", content);
        throw new Error("Could not parse AI response");
      }
    } catch (apiError) {
      console.error("Anthropic API error:", apiError);
      console.log("Falling back to local valuation method...");
      return generateFallbackValuation(propertyData);
    }
  } catch (error) {
    console.error("Error in AI valuation:", error);
    return generateFallbackValuation(propertyData);
  }
}

/**
 * Fallback valuation method when AI API is unavailable
 */
function generateFallbackValuation(propertyData) {
  console.log("Using fallback valuation method");
  
  // Get the estimated value
  const estimatedValue = predictValue(propertyData);
  
  // Generate confidence level (simple implementation)
  let confidenceLevel = "medium";
  if (propertyData.condition && propertyData.squareFeet) {
    confidenceLevel = "high";
  } else if (!propertyData.condition || !propertyData.squareFeet) {
    confidenceLevel = "low";
  }
  
  // Calculate value range based on confidence
  let rangePercent = 0.10;  // default: medium confidence = ±10%
  if (confidenceLevel === "high") {
    rangePercent = 0.05;  // ±5%
  } else if (confidenceLevel === "low") {
    rangePercent = 0.15;  // ±15%
  }
      
  const minValue = estimatedValue * (1 - rangePercent);
  const maxValue = estimatedValue * (1 + rangePercent);
  
  // Generate adjustments
  const adjustments = generateAdjustments(propertyData);
  
  // Generate market analysis
  const marketAnalysis = generateMarketAnalysis(propertyData);
  
  // Generate the report
  return {
    estimatedValue,
    confidenceLevel,
    valueRange: {
      min: Math.round(minValue * 100) / 100,
      max: Math.round(maxValue * 100) / 100
    },
    adjustments,
    marketAnalysis,
    comparableAnalysis: "No comparable analysis available in fallback mode.",
    valuationMethodology: "ML-Enhanced Heuristic Model (Fallback)",
    modelVersion: "1.0.0",
    timestamp: new Date().toISOString()
  };
}

// Export as ES modules
export const getPropertyById = (id) => PROPERTY_DB[id];
export { generateValuationReport, predictValue };