import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

export interface PropertyData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  yearBuilt: number;
  grossLivingArea: number;
  lotSize: number;
  bedrooms: number;
  bathrooms: number;
  features?: string[];
  condition?: string;
  quality?: string;
}

export interface ComparableProperty extends PropertyData {
  salePrice: number;
  saleDate: string;
  distanceFromSubject: number;
}

export interface MarketAdjustment {
  factor: string;
  description: string;
  amount: number;
  reasoning: string;
}

export interface AIValuationResponse {
  estimatedValue: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  valueRange: {
    min: number;
    max: number;
  };
  adjustments: MarketAdjustment[];
  marketAnalysis: string;
  comparableAnalysis: string;
  valuationMethodology: string;
}

/**
 * Performs an AI-assisted automated valuation of a property based on property data 
 * and comparable properties
 */
export async function performAutomatedValuation(
  subjectProperty: PropertyData,
  comparableProperties: ComparableProperty[]
): Promise<AIValuationResponse> {
  try {
    // Create prompt for GPT-4o
    const prompt = generateValuationPrompt(subjectProperty, comparableProperties);
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert real estate appraiser AI assistant that specializes in residential property valuation. You analyze property data and comparable sales to provide accurate valuation estimates with detailed adjustments and reasoning."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2, // Lower temperature for more deterministic responses
      response_format: { type: "json_object" }
    });
    
    // Parse and return the response
    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content);
    
    return {
      estimatedValue: result.estimatedValue,
      confidenceLevel: result.confidenceLevel,
      valueRange: {
        min: result.valueRange.min,
        max: result.valueRange.max
      },
      adjustments: result.adjustments,
      marketAnalysis: result.marketAnalysis,
      comparableAnalysis: result.comparableAnalysis,
      valuationMethodology: result.valuationMethodology
    };
  } catch (error) {
    console.error("Error performing automated valuation:", error);
    throw new Error("Failed to perform automated valuation");
  }
}

/**
 * Analyzes market trends using AI to provide insights about the local real estate market
 */
export async function analyzeMarketTrends(
  location: { city: string; state: string; zipCode: string },
  propertyType: string
): Promise<string> {
  try {
    const prompt = `Analyze current real estate market trends for ${propertyType} properties in ${location.city}, ${location.state} ${location.zipCode}.
    
Include information about:
1. Recent market activity (past 6 months)
2. Price trends
3. Days on market
4. Supply and demand factors
5. Forecasted market direction

Provide data-driven insights that would be valuable to a real estate appraiser.`;
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert real estate market analyst with access to comprehensive market data. Provide concise, data-driven market analysis for specific locations and property types."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error analyzing market trends:", error);
    throw new Error("Failed to analyze market trends");
  }
}

/**
 * Recommends adjustments for comparable properties to better match the subject property
 */
export async function recommendAdjustments(
  subjectProperty: PropertyData,
  comparableProperty: ComparableProperty
): Promise<MarketAdjustment[]> {
  try {
    const prompt = `I need to make adjustments to a comparable property to better match my subject property for an appraisal.

Subject Property:
- Address: ${subjectProperty.address}, ${subjectProperty.city}, ${subjectProperty.state} ${subjectProperty.zipCode}
- Type: ${subjectProperty.propertyType}
- Year Built: ${subjectProperty.yearBuilt}
- GLA: ${subjectProperty.grossLivingArea} sq ft
- Lot Size: ${subjectProperty.lotSize} sq ft
- Bedrooms: ${subjectProperty.bedrooms}
- Bathrooms: ${subjectProperty.bathrooms}
${subjectProperty.features ? `- Features: ${subjectProperty.features.join(', ')}` : ''}
${subjectProperty.condition ? `- Condition: ${subjectProperty.condition}` : ''}
${subjectProperty.quality ? `- Quality: ${subjectProperty.quality}` : ''}

Comparable Property:
- Address: ${comparableProperty.address}, ${comparableProperty.city}, ${comparableProperty.state} ${comparableProperty.zipCode}
- Type: ${comparableProperty.propertyType}
- Year Built: ${comparableProperty.yearBuilt}
- GLA: ${comparableProperty.grossLivingArea} sq ft
- Lot Size: ${comparableProperty.lotSize} sq ft
- Bedrooms: ${comparableProperty.bedrooms}
- Bathrooms: ${comparableProperty.bathrooms}
- Sale Price: $${comparableProperty.salePrice}
- Sale Date: ${comparableProperty.saleDate}
- Distance from Subject: ${comparableProperty.distanceFromSubject} miles
${comparableProperty.features ? `- Features: ${comparableProperty.features.join(', ')}` : ''}
${comparableProperty.condition ? `- Condition: ${comparableProperty.condition}` : ''}
${comparableProperty.quality ? `- Quality: ${comparableProperty.quality}` : ''}

Please recommend specific adjustments to the comparable property to make it equivalent to the subject property. For each adjustment, provide the factor being adjusted, a description, the adjustment amount (positive if the comparable is inferior, negative if superior), and reasoning.

Provide the response in this format:
[
  {
    "factor": "GLA",
    "description": "Gross Living Area",
    "amount": 5000,
    "reasoning": "The comparable is 100 sq ft smaller at $50/sq ft"
  }
]`;
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert real estate appraiser that specializes in making precise adjustments to comparable properties. You understand local market values and how different property features impact value."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error recommending adjustments:", error);
    throw new Error("Failed to recommend adjustments");
  }
}

/**
 * Generates a detailed narrative about property value, features, and market position
 */
export async function generateValuationNarrative(
  property: PropertyData,
  valuation: AIValuationResponse
): Promise<string> {
  try {
    const prompt = `Generate a professional appraisal narrative for the following property:

Property Details:
- Address: ${property.address}, ${property.city}, ${property.state} ${property.zipCode}
- Type: ${property.propertyType}
- Year Built: ${property.yearBuilt}
- GLA: ${property.grossLivingArea} sq ft
- Lot Size: ${property.lotSize} sq ft
- Bedrooms: ${property.bedrooms}
- Bathrooms: ${property.bathrooms}
${property.features ? `- Features: ${property.features.join(', ')}` : ''}
${property.condition ? `- Condition: ${property.condition}` : ''}
${property.quality ? `- Quality: ${property.quality}` : ''}

Valuation Results:
- Estimated Value: $${valuation.estimatedValue}
- Value Range: $${valuation.valueRange.min} to $${valuation.valueRange.max}
- Confidence Level: ${valuation.confidenceLevel}

Market Analysis:
${valuation.marketAnalysis}

Comparable Analysis:
${valuation.comparableAnalysis}

Valuation Methodology:
${valuation.valuationMethodology}

Adjustments:
${valuation.adjustments.map(adj => `- ${adj.factor}: ${adj.amount > 0 ? '+' : ''}$${adj.amount} - ${adj.description} - ${adj.reasoning}`).join('\n')}

Please write a professional, detailed narrative that would be suitable for inclusion in a formal appraisal report. The narrative should explain the valuation methodology, justify the estimated value, explain significant adjustments, and provide context about the local market.`;
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert real estate appraiser with excellent writing skills. You write clear, professional appraisal narratives that meet industry standards and USPAP guidelines."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating valuation narrative:", error);
    throw new Error("Failed to generate valuation narrative");
  }
}

/**
 * Helper function to generate a detailed prompt for the valuation AI
 */
function generateValuationPrompt(
  subjectProperty: PropertyData,
  comparableProperties: ComparableProperty[]
): string {
  return `I need an automated valuation for a residential property with the following details:

Subject Property:
- Address: ${subjectProperty.address}, ${subjectProperty.city}, ${subjectProperty.state} ${subjectProperty.zipCode}
- Type: ${subjectProperty.propertyType}
- Year Built: ${subjectProperty.yearBuilt}
- GLA: ${subjectProperty.grossLivingArea} sq ft
- Lot Size: ${subjectProperty.lotSize} sq ft
- Bedrooms: ${subjectProperty.bedrooms}
- Bathrooms: ${subjectProperty.bathrooms}
${subjectProperty.features ? `- Features: ${subjectProperty.features.join(', ')}` : ''}
${subjectProperty.condition ? `- Condition: ${subjectProperty.condition}` : ''}
${subjectProperty.quality ? `- Quality: ${subjectProperty.quality}` : ''}

Comparable Properties:
${comparableProperties.map((comp, index) => `
Comparable #${index + 1}:
- Address: ${comp.address}, ${comp.city}, ${comp.state} ${comp.zipCode}
- Type: ${comp.propertyType}
- Year Built: ${comp.yearBuilt}
- GLA: ${comp.grossLivingArea} sq ft
- Lot Size: ${comp.lotSize} sq ft
- Bedrooms: ${comp.bedrooms}
- Bathrooms: ${comp.bathrooms}
- Sale Price: $${comp.salePrice}
- Sale Date: ${comp.saleDate}
- Distance from Subject: ${comp.distanceFromSubject} miles
${comp.features ? `- Features: ${comp.features.join(', ')}` : ''}
${comp.condition ? `- Condition: ${comp.condition}` : ''}
${comp.quality ? `- Quality: ${comp.quality}` : ''}
`).join('')}

Based on the subject property details and the comparable properties, please provide:
1. An estimated market value for the subject property
2. A confidence level (high, medium, or low) for this estimate
3. A value range (minimum and maximum)
4. Detailed adjustments for each factor that affects the property value
5. A brief market analysis
6. An analysis of how the comparable properties relate to the subject
7. A description of the valuation methodology used

Format your response as a JSON object with the following structure:
{
  "estimatedValue": 350000,
  "confidenceLevel": "high",
  "valueRange": {
    "min": 340000,
    "max": 360000
  },
  "adjustments": [
    {
      "factor": "GLA",
      "description": "Gross Living Area",
      "amount": 5000,
      "reasoning": "The comparable is 100 sq ft smaller at $50/sq ft"
    },
    // Additional adjustments...
  ],
  "marketAnalysis": "Brief analysis of the current market conditions...",
  "comparableAnalysis": "Analysis of how the comparable properties compare to the subject...",
  "valuationMethodology": "Explanation of the methodology used to determine the value..."
}`;
}