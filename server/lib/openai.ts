import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Property analysis function
export async function analyzeProperty(propertyData: any): Promise<{
  marketTrends: string;
  valuationInsights: string;
  recommendedAdjustments: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert real estate appraiser with deep knowledge of valuation principles, market analysis, and property characteristics. Analyze the provided property data and provide useful insights for an appraisal report."
        },
        {
          role: "user",
          content: `Analyze this property for an appraisal report. Provide market trends, valuation insights, and recommended adjustments in JSON format: 
          ${JSON.stringify(propertyData, null, 2)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    // Handle null content
    const content = response.choices[0].message.content ?? '{"marketTrends":"", "valuationInsights":"", "recommendedAdjustments":""}';
    const result = JSON.parse(content);
    
    return {
      marketTrends: result.marketTrends || "No market trend analysis available",
      valuationInsights: result.valuationInsights || "No valuation insights available",
      recommendedAdjustments: result.recommendedAdjustments || "No adjustment recommendations available"
    };
  } catch (error) {
    console.error("Error analyzing property:", error);
    throw new Error("Failed to analyze property with AI");
  }
}

// Comparable property analysis
export async function analyzeComparables(subjectProperty: any, comparables: any[]): Promise<{
  bestComparables: number[];
  adjustmentSuggestions: Record<string, any>;
  reconciliationNotes: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert real estate appraiser specializing in comparable analysis. Your task is to analyze comparables against a subject property and provide meaningful adjustment recommendations and reconciliation."
        },
        {
          role: "user",
          content: `Compare these properties against the subject property and recommend adjustments. Return results in JSON format.
          Subject Property: ${JSON.stringify(subjectProperty, null, 2)}
          Comparable Properties: ${JSON.stringify(comparables, null, 2)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content ?? '{"bestComparables":[], "adjustmentSuggestions":{}, "reconciliationNotes":""}';
    const result = JSON.parse(content);
    
    return {
      bestComparables: result.bestComparables || [],
      adjustmentSuggestions: result.adjustmentSuggestions || {},
      reconciliationNotes: result.reconciliationNotes || "No reconciliation notes available"
    };
  } catch (error) {
    console.error("Error analyzing comparables:", error);
    throw new Error("Failed to analyze comparables with AI");
  }
}

// Generate appraisal narrative
export async function generateAppraisalNarrative(reportData: any): Promise<{
  neighborhoodDescription: string;
  propertyDescription: string;
  marketAnalysis: string;
  valueReconciliation: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert real estate appraiser who writes clear, professional narratives for appraisal reports. Generate concise, factual descriptions based on the data provided."
        },
        {
          role: "user",
          content: `Generate professional narrative sections for this appraisal report. Return results in JSON format.
          Report Data: ${JSON.stringify(reportData, null, 2)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content ?? '{"neighborhoodDescription":"", "propertyDescription":"", "marketAnalysis":"", "valueReconciliation":""}';
    const result = JSON.parse(content);
    
    return {
      neighborhoodDescription: result.neighborhoodDescription || "No neighborhood description available",
      propertyDescription: result.propertyDescription || "No property description available",
      marketAnalysis: result.marketAnalysis || "No market analysis available",
      valueReconciliation: result.valueReconciliation || "No value reconciliation available"
    };
  } catch (error) {
    console.error("Error generating narrative:", error);
    throw new Error("Failed to generate appraisal narrative with AI");
  }
}

// Validate compliance with UAD rules
export async function validateUADCompliance(reportData: any): Promise<{
  compliant: boolean;
  issues: Array<{field: string, issue: string, severity: string}>;
  suggestions: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a compliance officer specializing in Uniform Appraisal Dataset (UAD) standards. Review the appraisal report data for compliance issues and provide detailed feedback."
        },
        {
          role: "user",
          content: `Review this appraisal report for UAD compliance issues. Return results in JSON format.
          Report Data: ${JSON.stringify(reportData, null, 2)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content ?? '{"compliant":false, "issues":[], "suggestions":""}';
    const result = JSON.parse(content);
    
    return {
      compliant: result.compliant || false,
      issues: result.issues || [],
      suggestions: result.suggestions || "No suggestions available"
    };
  } catch (error) {
    console.error("Error validating compliance:", error);
    throw new Error("Failed to validate UAD compliance with AI");
  }
}

// Smart search for comparable properties
export async function smartSearch(searchQuery: string, propertyData: any): Promise<{
  queryInterpretation: string;
  suggestedFilters: Record<string, any>;
  searchResults: any[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant helping appraisers find comparable properties. Interpret natural language search queries and suggest appropriate search filters."
        },
        {
          role: "user",
          content: `Interpret this search query and suggest filters for finding comparables:
          Search Query: "${searchQuery}"
          Subject Property: ${JSON.stringify(propertyData, null, 2)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content ?? '{"queryInterpretation":"", "suggestedFilters":{}, "searchResults":[]}';
    const result = JSON.parse(content);
    
    return {
      queryInterpretation: result.queryInterpretation || "No interpretation available",
      suggestedFilters: result.suggestedFilters || {},
      searchResults: result.searchResults || []
    };
  } catch (error) {
    console.error("Error performing smart search:", error);
    throw new Error("Failed to perform smart search with AI");
  }
}

// Market-based adjustment analysis
export async function analyzeMarketAdjustments(marketArea: string, salesData: any[]): Promise<{
  locationValueTrends: string;
  timeAdjustments: Record<string, number>;
  featureAdjustments: Record<string, number>;
  confidenceLevel: number;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert real estate appraiser specializing in market analysis and extracting adjustment values from paired sales data. Provide professional analysis of market-derived adjustments."
        },
        {
          role: "user",
          content: `Analyze these sales in ${marketArea} to extract market-derived adjustments. Consider time trends, location factors, and property features. Return results in JSON format.
          Sales Data: ${JSON.stringify(salesData, null, 2)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content ?? '{"locationValueTrends":"", "timeAdjustments":{}, "featureAdjustments":{}, "confidenceLevel":0}';
    const result = JSON.parse(content);
    
    return {
      locationValueTrends: result.locationValueTrends || "No location value trends available",
      timeAdjustments: result.timeAdjustments || {},
      featureAdjustments: result.featureAdjustments || {},
      confidenceLevel: result.confidenceLevel !== undefined ? result.confidenceLevel : 0
    };
  } catch (error) {
    console.error("Error analyzing market adjustments:", error);
    throw new Error("Failed to analyze market adjustments with AI");
  }
}

// Chat query for specific appraisal questions
export async function chatQuery(question: string, contextData: any): Promise<{
  answer: string;
  sources?: string[];
  relatedTopics?: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert AI assistant for real estate appraisers. Answer questions accurately and professionally, citing relevant appraisal principles, data sources, or methodologies where appropriate."
        },
        {
          role: "user",
          content: `Answer this appraisal question based on the provided context. Return results in JSON format.
          Question: "${question}"
          Context Data: ${JSON.stringify(contextData, null, 2)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content ?? '{"answer":"I don\'t have enough information to answer that question."}';
    const result = JSON.parse(content);
    
    return {
      answer: result.answer || "I don't have enough information to answer that question.",
      sources: result.sources,
      relatedTopics: result.relatedTopics
    };
  } catch (error) {
    console.error("Error processing chat query:", error);
    throw new Error("Failed to process chat query with AI");
  }
}