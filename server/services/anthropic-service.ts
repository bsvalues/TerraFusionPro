import Anthropic from '@anthropic-ai/sdk';
import { MarketAnalysisRequest, MarketAnalysisResult } from './openai-service';

// Create Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Generate a market analysis using Anthropic Claude
 * 
 * @param params Analysis parameters
 * @returns Structured market analysis data
 */
export async function generateMarketAnalysisWithClaude(params: MarketAnalysisRequest): Promise<MarketAnalysisResult> {
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
    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025. Do not change this unless explicitly requested by the user.
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2000,
      system: 'You are a real estate market analyst with expertise in property valuation, market trends, and economic analysis. Provide accurate and insightful market analysis in JSON format.',
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    // Parse the response content
    const content = response.content[0].text;
    let result;
    
    try {
      // Try to extract JSON from the response if it's not already in JSON format
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/{[\s\S]*}/);
      const jsonContent = jsonMatch ? jsonMatch[0].replace(/```json|```/g, '') : content;
      result = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("Error parsing JSON from Claude response:", parseError);
      throw new Error("Failed to parse JSON from Claude response");
    }
    
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
    console.error("Error generating market analysis with Claude:", error);
    throw new Error(`Failed to generate market analysis with Claude: ${error.message}`);
  }
}

/**
 * Generate compliance assessment report using Anthropic Claude
 * 
 * @param reportData Report to evaluate
 * @param complianceStandards Standards to check against
 * @returns Compliance assessment
 */
export async function generateComplianceAssessment(
  reportData: any,
  complianceStandards: string[]
): Promise<any> {
  const reportJson = JSON.stringify(reportData);
  const standardsJson = JSON.stringify(complianceStandards);
  
  const prompt = `
Evaluate this appraisal report for compliance with the following standards:
${standardsJson}

Report data:
${reportJson}

Generate a detailed compliance assessment, including:
1. Overall compliance status
2. List of potential compliance issues
3. Suggested corrections
4. Risk level of each issue

Format the response as JSON with these keys:
{
  "complianceStatus": "compliant|minor_issues|major_issues|non_compliant",
  "issues": [
    {
      "standard": "string",
      "description": "string",
      "riskLevel": "low|medium|high",
      "correction": "string"
    }
  ],
  "summary": "string",
  "overallRisk": "low|medium|high"
}
`;

  try {
    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025. Do not change this unless explicitly requested by the user.
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2000,
      system: 'You are a real estate compliance expert with deep knowledge of appraisal standards and regulations. Provide detailed compliance analysis in JSON format.',
      messages: [
        { role: 'user', content: prompt }
      ]
    });
    
    // Extract and parse the response
    const content = response.content[0].text;
    let result;
    
    try {
      // Try to extract JSON from the response if it's not already in JSON format
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/{[\s\S]*}/);
      const jsonContent = jsonMatch ? jsonMatch[0].replace(/```json|```/g, '') : content;
      result = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("Error parsing JSON from Claude response:", parseError);
      throw new Error("Failed to parse JSON from Claude response");
    }
    
    return result;
  } catch (error) {
    console.error("Error generating compliance assessment:", error);
    throw new Error(`Failed to generate compliance assessment: ${error.message}`);
  }
}