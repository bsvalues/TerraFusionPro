import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { storage } from "../storage";
import { analyzeProperty } from "./openai";
import { aiOrchestrator } from "./ai-orchestrator";
import { AIProvider } from "./ai-orchestrator";

// Types for email processing
export interface EmailAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

export interface OrderEmail {
  id: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  htmlBody?: string;
  receivedDate: Date;
  attachments: EmailAttachment[];
}

export interface ClientInfo {
  name: string;
  company: string;
  email: string;
  phone: string;
  address?: string;
}

export interface LenderInfo {
  name: string;
  address: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface OrderDetails {
  orderNumber: string;
  orderDate: Date;
  dueDate: Date;
  feeAmount?: number;
  reportType: string;
  propertyType: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  borrowerName?: string;
  occupancyStatus?: string;
  loanType?: string;
  specialInstructions?: string;
}

// Extract property data from email and attachments
async function extractPropertyDataFromEmail(email: OrderEmail): Promise<{
  clientInfo: ClientInfo;
  lenderInfo: LenderInfo;
  orderDetails: OrderDetails;
}> {
  try {
    console.log(`Processing email order with subject: ${email.subject}`);
    
    // Use AI orchestrator to extract data from the email content
    const extractedData = await aiOrchestrator.processEmailOrder(
      email.body,
      email.subject,
      email.from
    );
    
    // Extract address from extracted data or fallback to regex extraction from subject
    let address = extractedData.propertyAddress || "";
    
    if (!address) {
      // Fallback to regex if AI extraction didn't find an address
      const addressMatch = email.subject.match(/(\d+\s+[\w\s]+(?:St|Ave|Rd|Blvd|Dr|Ln|Way|Place|Court|Circle))/i);
      address = addressMatch ? addressMatch[1] : "123 Main St";
    }
    
    // Map the extracted data to our interfaces
    return {
      clientInfo: {
        name: extractedData.clientName || "Unknown Client",
        company: extractedData.clientCompany || "Unknown Company",
        email: extractedData.clientEmail || "unknown@example.com",
        phone: extractedData.clientPhone || "Unknown",
        address: extractedData.clientAddress
      },
      lenderInfo: {
        name: extractedData.lenderName || "Unknown Lender",
        address: extractedData.lenderAddress || "Unknown Address",
        contactPerson: extractedData.lenderContactPerson,
        contactEmail: extractedData.lenderContactEmail,
        contactPhone: extractedData.lenderContactPhone
      },
      orderDetails: {
        orderNumber: extractedData.orderNumber || `ORD-${Date.now()}`,
        orderDate: extractedData.orderDate ? new Date(extractedData.orderDate) : new Date(),
        dueDate: extractedData.dueDate ? new Date(extractedData.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        feeAmount: extractedData.feeAmount,
        reportType: extractedData.reportType || "URAR",
        propertyType: extractedData.propertyType || "Single Family",
        propertyAddress: address,
        propertyCity: extractedData.city || "Unknown City",
        propertyState: extractedData.state || "CA",
        propertyZip: extractedData.zipCode || "00000",
        borrowerName: extractedData.borrowerName,
        occupancyStatus: extractedData.occupancyStatus,
        loanType: extractedData.loanType,
        specialInstructions: extractedData.specialInstructions
      }
    };
  } catch (error) {
    console.error("Error extracting data from email:", error);
    
    // Return default values if extraction fails
    return {
      clientInfo: {
        name: "Unknown Client",
        company: "Unknown Company",
        email: "unknown@example.com",
        phone: "Unknown"
      },
      lenderInfo: {
        name: "Unknown Lender",
        address: "Unknown Address"
      },
      orderDetails: {
        orderNumber: `ORD-${Date.now()}`,
        orderDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        reportType: "URAR",
        propertyType: "Single Family",
        propertyAddress: "123 Unknown St",
        propertyCity: "Unknown City",
        propertyState: "CA",
        propertyZip: "00000"
      }
    };
  }
}

// Process an incoming order email
export async function processOrderEmail(email: OrderEmail, userId: number): Promise<number | null> {
  try {
    // Extract data from email and attachments
    const { clientInfo, lenderInfo, orderDetails } = await extractPropertyDataFromEmail(email);
    
    // Create property record
    const propertyData = {
      address: orderDetails.propertyAddress,
      city: orderDetails.propertyCity,
      state: orderDetails.propertyState,
      zipCode: orderDetails.propertyZip,
      propertyType: orderDetails.propertyType,
      // Default values for required fields that might not be in the email
      yearBuilt: 0, // Will be updated by public data
      grossLivingArea: '0', // Will be updated by public data (stored as string in DB)
      bedrooms: '0', // Will be updated by public data (stored as string in DB)
      bathrooms: '0', // Will be updated by public data (stored as string in DB)
    };
    
    const property = await storage.createProperty({
      ...propertyData,
      userId
    });
    
    // Create appraisal report
    const report = await storage.createAppraisalReport({
      propertyId: property.id,
      userId,
      reportType: orderDetails.reportType,
      formType: "URAR", // Default to URAR
      status: "in_progress",
      purpose: "Purchase", // Default, can be updated
      effectiveDate: new Date(),
      reportDate: new Date(),
      clientName: clientInfo.name,
      clientAddress: clientInfo.address || "",
      lenderName: lenderInfo.name,
      lenderAddress: lenderInfo.address,
      borrowerName: orderDetails.borrowerName || "",
      occupancy: orderDetails.occupancyStatus || "Unknown",
      salesPrice: null,
      marketValue: null
    });
    
    // Trigger public data retrieval
    initiateDataRetrieval(propertyData, report.id);
    
    return report.id;
  } catch (error) {
    console.error("Error processing order email:", error);
    return null;
  }
}

// Start the public data retrieval process
export async function initiateDataRetrieval(propertyData: any, reportId: number): Promise<void> {
  try {
    // Log the start of the process
    console.log(`Starting public data retrieval for property at ${propertyData.address}, ${propertyData.city}, ${propertyData.state}`);
    
    // This will be an asynchronous process, potentially using a job queue in production
    setTimeout(async () => {
      await retrievePublicData(propertyData, reportId);
    }, 100);
  } catch (error) {
    console.error("Error initiating data retrieval:", error);
  }
}

// Retrieve public data from various sources
export async function retrievePublicData(propertyData: any, reportId: number): Promise<void> {
  try {
    // In a production environment, this would connect to real public data APIs
    // For now, we'll log the intent and use AI to generate realistic data
    
    console.log(`Retrieving public data for ${propertyData.address}, ${propertyData.city}, ${propertyData.state} ${propertyData.zipCode}`);
    
    // Get the current report and property data
    const report = await storage.getAppraisalReport(reportId);
    const property = report ? await storage.getProperty(report.propertyId) : null;
    
    if (!report || !property) {
      console.error("Could not find report or property for data retrieval");
      return;
    }
    
    // Use the AI to generate property data based on the address
    const enhancedData = await retrievePropertyPublicData(propertyData);
    
    // Update the property with the enhanced data
    await storage.updateProperty(property.id, {
      yearBuilt: enhancedData.yearBuilt,
      grossLivingArea: String(enhancedData.grossLivingArea),
      bedrooms: String(enhancedData.bedrooms),
      bathrooms: String(enhancedData.bathrooms)
    });
    
    // For a complete implementation, we would also retrieve:
    // - Ownership history
    // - Tax assessment data
    // - Prior sale history
    // - Zoning information
    // - Flood zone status
    // - Comparable properties nearby
    
    console.log(`Completed public data retrieval for report #${reportId}`);
  } catch (error) {
    console.error("Error retrieving public data:", error);
  }
}

// Generate property data based on address using AI
// In production, this would connect to real property data APIs
async function retrievePropertyPublicData(propertyData: any): Promise<{
  yearBuilt: number;
  grossLivingArea: number;
  bedrooms: number;
  bathrooms: number;
}> {
  try {
    // Get the location from the property data
    const location = {
      address: propertyData.address,
      city: propertyData.city,
      state: propertyData.state,
      zipCode: propertyData.zipCode
    };
    
    console.log(`Generating property data for ${location.address}, ${location.city}, ${location.state}`);
    
    // First try using the AI orchestrator to analyze the property
    try {
      const marketAnalysis = await aiOrchestrator.generateMarketAnalysis(
        `${location.city}, ${location.state}`,
        propertyData.propertyType,
        AIProvider.AUTO // Let the system decide the best AI for this task
      );
      
      // Use the valuation system to estimate details
      const valuationData = await aiOrchestrator.automatedValuation(
        {
          address: location.address,
          city: location.city,
          state: location.state,
          zipCode: location.zipCode,
          propertyType: propertyData.propertyType
        },
        undefined,
        AIProvider.AUTO
      );
      
      // Extract property details from the valuation data
      const yearBuilt = valuationData.yearBuilt || Math.floor(Math.random() * 40) + 1980;
      const grossLivingArea = valuationData.squareFeet || Math.floor(Math.random() * 1000) + 1500;
      const bedrooms = valuationData.bedrooms || Math.floor(Math.random() * 2) + 3;
      const bathrooms = valuationData.bathrooms || Math.floor(Math.random() * 2) + 2;
      
      return {
        yearBuilt,
        grossLivingArea,
        bedrooms,
        bathrooms
      };
    } catch (aiOrchestratorError) {
      console.error("Error using AI orchestrator for property data:", aiOrchestratorError);
      
      // Fallback to using OpenAI directly
      console.log("Falling back to direct OpenAI analysis");
      
      // Analyze the property using OpenAI to generate realistic data
      const analysis = await analyzeProperty({
        propertyType: propertyData.propertyType || "Single Family",
        location: location
      });
      
      // Generate realistic values from the AI response
      const yearBuiltMatch = analysis.valuationInsights.match(/built in (\d{4})/i);
      const yearBuilt = yearBuiltMatch ? parseInt(yearBuiltMatch[1]) : Math.floor(Math.random() * 40) + 1980;
      
      const sqftMatch = analysis.valuationInsights.match(/(\d{3,4}) square feet/i);
      const grossLivingArea = sqftMatch ? parseInt(sqftMatch[1]) : Math.floor(Math.random() * 1000) + 1500;
      
      const bedroomsMatch = analysis.valuationInsights.match(/(\d+) bedroom/i);
      const bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1]) : Math.floor(Math.random() * 2) + 3;
      
      const bathroomsMatch = analysis.valuationInsights.match(/(\d+)(?:\.5)? bathroom/i);
      const bathrooms = bathroomsMatch ? parseInt(bathroomsMatch[1]) : Math.floor(Math.random() * 2) + 2;
      
      return {
        yearBuilt,
        grossLivingArea,
        bedrooms,
        bathrooms
      };
    }
  } catch (error) {
    console.error("Error retrieving property public data:", error);
    
    // Return default values if all methods fail
    return {
      yearBuilt: 2000,
      grossLivingArea: 2000,
      bedrooms: 3,
      bathrooms: 2
    };
  }
}