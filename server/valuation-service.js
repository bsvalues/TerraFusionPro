/**
 * TerraFusion Core AI Valuator Service
 * 
 * This service handles property valuation and analysis using Anthropic's Claude API
 */

import Anthropic from '@anthropic-ai/sdk';

// Create Anthropic client with API key from environment variables
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generate a detailed property valuation report using AI
 * 
 * @param {Object} propertyData - Data about the property to analyze
 * @returns {Promise<Object>} - Property valuation report
 */
export async function generateValuationReport(propertyData) {
  console.log("Generating valuation report for:", propertyData);
  
  try {
    // Format the property address from the provided data
    let propertyAddress;
    if (propertyData.address) {
      // Handle nested address object
      if (typeof propertyData.address === 'object') {
        propertyAddress = `${propertyData.address.street}, ${propertyData.address.city}, ${propertyData.address.state} ${propertyData.address.zipCode}`;
      } else {
        // Handle flat address string
        propertyAddress = propertyData.address;
      }
    } else {
      // Fallback for other property data formats
      propertyAddress = `${propertyData.street || ""}, ${propertyData.city || ""}, ${propertyData.state || ""} ${propertyData.zipCode || propertyData.zip || ""}`;
    }
    
    // Normalize the property data for the prompt
    const normalizedData = {
      address: propertyAddress,
      propertyType: propertyData.propertyType || "Single Family",
      bedrooms: propertyData.bedrooms || 0,
      bathrooms: propertyData.bathrooms || 0,
      squareFeet: propertyData.squareFeet || propertyData.grossLivingArea || 0,
      yearBuilt: propertyData.yearBuilt || 0,
      lotSize: propertyData.lotSize || 0,
      features: Array.isArray(propertyData.features) 
        ? propertyData.features.map(f => typeof f === 'object' ? f.name : f).join(", ") 
        : (propertyData.features || ""),
      condition: propertyData.condition || "Average"
    };
    
    console.log("Normalized property data:", normalizedData);

    // Create a detailed prompt for the property valuation
    const prompt = `You are a professional real estate appraiser tasked with analyzing the following property:

Address: ${normalizedData.address}
Property Type: ${normalizedData.propertyType}
Bedrooms: ${normalizedData.bedrooms}
Bathrooms: ${normalizedData.bathrooms}
Square Feet: ${normalizedData.squareFeet}
Year Built: ${normalizedData.yearBuilt}
Lot Size: ${normalizedData.lotSize} acres
Features: ${normalizedData.features}
Condition: ${normalizedData.condition}

Please provide a comprehensive property valuation report including:
1. Estimated value in USD (provide a specific number, not a range)
2. Confidence level (high, medium, or low)
3. Value range (minimum and maximum estimated values)
4. List of specific adjustments that impact the valuation (feature, description, dollar amount, and reasoning)
5. Brief market analysis for the area
6. Comparable property analysis
7. Valuation methodology explanation

Return your analysis as a valid JSON object only, with the following structure:
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
    
    // Call Anthropic API with the prompt
    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
      system: "You are a real estate valuation expert with access to current market data. When providing property valuations, use real market data and trends. Format your response as a valid JSON object only, with no additional text."
    });
    
    console.log("Received response from Anthropic API");
    
    // Parse the response content to extract the JSON
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
      
      console.log("Successfully parsed AI response");
      return jsonResponse;
      
    } catch (jsonError) {
      console.error("Error parsing JSON response:", jsonError);
      console.log("Raw response:", content);
      
      // If we can't parse the JSON, create a fallback response
      return generateFallbackResponse(normalizedData);
    }
    
  } catch (error) {
    console.error("Error in valuation service:", error);
    
    if (error.response) {
      console.error("API Error:", error.response.status, error.response.data);
    }
    
    // If the API call fails, return a fallback response
    return generateFallbackResponse(propertyData);
  }
}

/**
 * Generate a fallback response when AI analysis fails
 * 
 * @param {Object} propertyData - Data about the property
 * @returns {Object} - Fallback property valuation report
 */
function generateFallbackResponse(propertyData) {
  console.log("Generating fallback property analysis for:", propertyData);
  
  // Calculate a rough estimated value based on property attributes
  const basePricePerSqFt = 275; // Base price per square foot for Washington state
  const squareFeet = propertyData.squareFeet || propertyData.grossLivingArea || 1800;
  const baseValue = squareFeet * basePricePerSqFt;
  
  // Adjust for bedrooms and bathrooms
  const bedroomValue = (propertyData.bedrooms || 3) * 15000;
  const bathroomValue = (propertyData.bathrooms || 2) * 12500;
  
  // Adjust for lot size
  const lotSizeValue = (propertyData.lotSize || 0.15) * 50000;
  
  // Adjust for age
  const yearBuilt = propertyData.yearBuilt || 1990;
  const currentYear = new Date().getFullYear();
  const age = currentYear - yearBuilt;
  const ageAdjustment = age > 0 ? (age * -500) : 0;
  
  // Calculate estimated value
  const estimatedValue = Math.round(baseValue + bedroomValue + bathroomValue + lotSizeValue + ageAdjustment);
  
  // Set a reasonable value range
  const minValue = Math.round(estimatedValue * 0.9);
  const maxValue = Math.round(estimatedValue * 1.1);
  
  return {
    estimatedValue: estimatedValue,
    confidenceLevel: "low",
    valueRange: {
      min: minValue,
      max: maxValue
    },
    adjustments: [
      {
        factor: "Living Area",
        description: "Value based on square footage",
        amount: baseValue,
        reasoning: "Base valuation using local price per square foot"
      },
      {
        factor: "Bedrooms",
        description: `Value added for ${propertyData.bedrooms || 3} bedrooms`,
        amount: bedroomValue,
        reasoning: "Additional bedrooms increase property value"
      },
      {
        factor: "Bathrooms",
        description: `Value added for ${propertyData.bathrooms || 2} bathrooms`,
        amount: bathroomValue,
        reasoning: "Additional bathrooms increase property value"
      },
      {
        factor: "Lot Size",
        description: `Value added for ${propertyData.lotSize || 0.15} acre lot`,
        amount: lotSizeValue,
        reasoning: "Larger lots command higher prices"
      },
      {
        factor: "Age",
        description: `Adjustment for ${age} year old property`,
        amount: ageAdjustment,
        reasoning: "Older properties generally have lower values due to wear and maintenance needs"
      }
    ],
    marketAnalysis: "Market data unavailable. This is a fallback valuation based on property attributes only.",
    comparableAnalysis: "Comparable property data unavailable. This analysis uses standard valuation metrics for the area.",
    valuationMethodology: "This is a fallback valuation using a simplified cost approach. It calculates basic values for major property features and may not reflect actual market conditions."
  };
}