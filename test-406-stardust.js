/**
 * Test script specifically for analyzing 406 Stardust Ct, Grandview, WA
 * This script uses the Anthropic API to generate a real property analysis
 */

// Import the Anthropic client using ES modules
import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';

// Load environment variables
config();

// Create Anthropic client with API key from environment variables
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeProperty() {
  console.log("Starting AI-powered property analysis for 406 Stardust Ct, Grandview, WA");
  
  try {
    // Define the property data
    const propertyData = {
      address: "406 Stardust Ct",
      city: "Grandview",
      state: "WA",
      zipCode: "98930",
      propertyType: "Single Family",
      yearBuilt: 1995,
      grossLivingArea: 1850,
      lotSize: 0.17, // acres
      bedrooms: 4,
      bathrooms: 2.5,
      features: "Garage, Fireplace, Patio",
      condition: "Good",
      quality: "Above Average"
    };
    
    // Format property address for the prompt
    const propertyAddress = `${propertyData.address}, ${propertyData.city}, ${propertyData.state} ${propertyData.zipCode}`;
    
    console.log(`Analyzing property at ${propertyAddress}`);
    
    // Create a detailed prompt for the property valuation
    const prompt = `You are a professional real estate appraiser tasked with analyzing the following property:

Address: ${propertyAddress}
Property Type: ${propertyData.propertyType}
Bedrooms: ${propertyData.bedrooms}
Bathrooms: ${propertyData.bathrooms}
Square Feet: ${propertyData.grossLivingArea}
Year Built: ${propertyData.yearBuilt}
Lot Size: ${propertyData.lotSize} acres
Features: ${propertyData.features}
Condition: ${propertyData.condition}

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
    
    // Call Anthropic API with the prompt
    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
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
      
      // Format and print the results
      console.log("\n===== PROPERTY VALUATION REPORT =====");
      console.log(`Property: ${propertyAddress}`);
      console.log(`Estimated Value: $${jsonResponse.estimatedValue.toLocaleString()}`);
      console.log(`Confidence Level: ${jsonResponse.confidenceLevel}`);
      console.log(`Value Range: $${jsonResponse.valueRange.min.toLocaleString()} - $${jsonResponse.valueRange.max.toLocaleString()}`);
      
      console.log("\n----- ADJUSTMENTS -----");
      jsonResponse.adjustments.forEach(adj => {
        console.log(`${adj.factor}: ${adj.description} - $${adj.amount.toLocaleString()}`);
        console.log(`  Reasoning: ${adj.reasoning}`);
      });
      
      console.log("\n----- MARKET ANALYSIS -----");
      console.log(jsonResponse.marketAnalysis);
      
      console.log("\n----- COMPARABLE ANALYSIS -----");
      console.log(jsonResponse.comparableAnalysis);
      
      console.log("\n----- VALUATION METHODOLOGY -----");
      console.log(jsonResponse.valuationMethodology);
      
      console.log("\nAnalysis complete!");
      
      return jsonResponse;
      
    } catch (jsonError) {
      console.error("Error parsing JSON response:", jsonError);
      console.log("Raw response:", content);
      throw new Error("Could not parse AI response");
    }
    
  } catch (error) {
    console.error("Error in property analysis:", error);
    
    if (error.response) {
      console.error("API Error:", error.response.status, error.response.data);
    }
  }
}

// Run the analysis
analyzeProperty().catch(error => {
  console.error("Execution error:", error);
  process.exit(1);
});