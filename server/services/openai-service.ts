import OpenAI from "openai";

// Create OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Market analysis data types
export interface MarketAnalysisRequest {
  location: string;
  propertyType: string;
  timeframe: string;
  additionalContext?: string;
}

export interface MarketTrendPoint {
  date: string;
  value: number;
}

export interface MarketAnalysisResult {
  summary: string;
  keyInsights: string[];
  priceTrends: MarketTrendPoint[];
  inventoryTrends: MarketTrendPoint[];
  riskAssessment: {
    level: 'low' | 'moderate' | 'high';
    factors: string[];
  };
  recommendations: string[];
}

/**
 * Generate a market analysis using OpenAI
 * 
 * @param params Analysis parameters
 * @returns Structured market analysis data
 */
export async function generateMarketAnalysis(params: MarketAnalysisRequest): Promise<MarketAnalysisResult> {
  const { location, propertyType, timeframe, additionalContext } = params;
  
  const prompt = `
Generate a comprehensive real estate market analysis for ${location}, focusing on ${propertyType} properties over the ${timeframe} timeframe.
${additionalContext ? `Additional context: ${additionalContext}` : ''}

Provide the analysis in a structured JSON format with the following sections:
1. A concise summary of market conditions
2. 3-5 key insights about the market
3. Price trends data points (month and average price)
4. Inventory trends data points (month and inventory count)
5. Risk assessment (level: low, moderate, or high, and factors)
6. 2-3 recommendations for stakeholders

Format the response as valid JSON with these exact keys:
{
  "summary": "string",
  "keyInsights": ["string"],
  "priceTrends": [{"date": "YYYY-MM", "value": number}],
  "inventoryTrends": [{"date": "YYYY-MM", "value": number}],
  "riskAssessment": {
    "level": "low|moderate|high",
    "factors": ["string"]
  },
  "recommendations": ["string"]
}
`;

  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    // Parse the response content
    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      summary: result.summary || "Market analysis unavailable",
      keyInsights: result.keyInsights || [],
      priceTrends: result.priceTrends || [],
      inventoryTrends: result.inventoryTrends || [],
      riskAssessment: {
        level: result.riskAssessment?.level || "moderate",
        factors: result.riskAssessment?.factors || []
      },
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.error("Error generating market analysis:", error);
    throw new Error(`Failed to generate market analysis: ${error.message}`);
  }
}

/**
 * Generate property valuation insights using OpenAI
 * 
 * @param propertyData Property details
 * @param comps Comparable properties
 * @returns Valuation insights and recommendations
 */
export async function generatePropertyValuationInsights(
  propertyData: any, 
  comps: any[]
): Promise<any> {
  const propertyJson = JSON.stringify(propertyData);
  const compsJson = JSON.stringify(comps);
  
  const prompt = `
Analyze this subject property and its comparable properties to provide valuation insights.

Subject property: ${propertyJson}

Comparable properties: ${compsJson}

Generate valuation insights, including:
1. Key value factors
2. Notable adjustments
3. Reconciliation approach
4. Final value estimate
5. Confidence level

Format the response as JSON with these keys:
{
  "valueFactors": ["string"],
  "adjustments": [{"factor": "string", "impact": "string", "description": "string"}],
  "reconciliation": "string",
  "estimatedValue": {"low": number, "value": number, "high": number},
  "confidence": "low|moderate|high"
}
`;

  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error("Error generating valuation insights:", error);
    throw new Error(`Failed to generate valuation insights: ${error.message}`);
  }
}