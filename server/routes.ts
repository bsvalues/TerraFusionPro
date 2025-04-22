import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPropertySchema, insertAppraisalReportSchema, insertComparableSchema, insertAdjustmentSchema, insertPhotoSchema, insertSketchSchema, insertComplianceCheckSchema, insertAdjustmentModelSchema, insertModelAdjustmentSchema, insertMarketAnalysisSchema } from "@shared/schema";
import { z } from "zod";
import { generatePDF } from "./lib/pdf-generator";
import { generateMismoXML } from "./lib/mismo";
import { validateCompliance } from "./lib/compliance-rules";
import { 
  analyzeProperty, 
  analyzeComparables, 
  generateAppraisalNarrative,
  validateUADCompliance,
  smartSearch,
  chatQuery,
  analyzeMarketAdjustments
} from "./lib/openai";

import { aiOrchestrator, AIProvider } from "./lib/ai-orchestrator";

// Define the type for AI Valuation Response
export interface AIValuationResponse {
  estimatedValue: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  valueRange: {
    min: number;
    max: number;
  };
  adjustments: Array<{
    factor: string;
    description: string;
    amount: number;
    reasoning: string;
  }>;
  marketAnalysis: string;
  comparableAnalysis: string;
  valuationMethodology: string;
}

// For production with real OpenAI API
import {
  performAutomatedValuation,
  analyzeMarketTrends,
  recommendAdjustments,
  generateValuationNarrative
} from "./lib/ai-agent";

// For development/testing with mock data
// import {
//   performAutomatedValuation,
//   analyzeMarketTrends,
//   recommendAdjustments,
//   generateValuationNarrative
// } from "./lib/ai-agent.mock";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error during login" });
    }
  });
  
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(validatedData);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error creating user" });
    }
  });
  
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching user" });
    }
  });
  
  // Property routes
  app.get("/api/properties", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.query.userId);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const properties = await storage.getPropertiesByUser(userId);
      res.status(200).json(properties);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching properties" });
    }
  });
  
  app.get("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      const propertyId = Number(req.params.id);
      const property = await storage.getProperty(propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.status(200).json(property);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching property" });
    }
  });
  
  app.post("/api/properties", async (req: Request, res: Response) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      const newProperty = await storage.createProperty(validatedData);
      res.status(201).json(newProperty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error creating property" });
    }
  });
  
  app.put("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      const propertyId = Number(req.params.id);
      const validatedData = insertPropertySchema.partial().parse(req.body);
      
      const updatedProperty = await storage.updateProperty(propertyId, validatedData);
      
      if (!updatedProperty) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.status(200).json(updatedProperty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error updating property" });
    }
  });
  
  app.delete("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      const propertyId = Number(req.params.id);
      const success = await storage.deleteProperty(propertyId);
      
      if (!success) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Server error deleting property" });
    }
  });
  
  // Appraisal Report routes
  app.get("/api/reports", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.query.userId);
      const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
      
      if (!userId && !propertyId) {
        return res.status(400).json({ message: "Either userId or propertyId is required" });
      }
      
      let reports;
      if (propertyId) {
        reports = await storage.getAppraisalReportsByProperty(propertyId);
      } else {
        reports = await storage.getAppraisalReportsByUser(userId);
      }
      
      res.status(200).json(reports);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching reports" });
    }
  });
  
  app.get("/api/reports/:id", async (req: Request, res: Response) => {
    try {
      const reportId = Number(req.params.id);
      const report = await storage.getAppraisalReport(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.status(200).json(report);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching report" });
    }
  });
  
  app.post("/api/reports", async (req: Request, res: Response) => {
    try {
      const validatedData = insertAppraisalReportSchema.parse(req.body);
      const newReport = await storage.createAppraisalReport(validatedData);
      res.status(201).json(newReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error creating report" });
    }
  });
  
  app.put("/api/reports/:id", async (req: Request, res: Response) => {
    try {
      const reportId = Number(req.params.id);
      const validatedData = insertAppraisalReportSchema.partial().parse(req.body);
      
      const updatedReport = await storage.updateAppraisalReport(reportId, validatedData);
      
      if (!updatedReport) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.status(200).json(updatedReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error updating report" });
    }
  });
  
  app.delete("/api/reports/:id", async (req: Request, res: Response) => {
    try {
      const reportId = Number(req.params.id);
      const success = await storage.deleteAppraisalReport(reportId);
      
      if (!success) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Server error deleting report" });
    }
  });
  
  // Comparable routes
  app.get("/api/reports/:reportId/comparables", async (req: Request, res: Response) => {
    try {
      const reportId = Number(req.params.reportId);
      const comparables = await storage.getComparablesByReport(reportId);
      res.status(200).json(comparables);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching comparables" });
    }
  });
  
  app.post("/api/comparables", async (req: Request, res: Response) => {
    try {
      const validatedData = insertComparableSchema.parse(req.body);
      const newComparable = await storage.createComparable(validatedData);
      res.status(201).json(newComparable);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error creating comparable" });
    }
  });
  
  app.put("/api/comparables/:id", async (req: Request, res: Response) => {
    try {
      const comparableId = Number(req.params.id);
      const validatedData = insertComparableSchema.partial().parse(req.body);
      
      const updatedComparable = await storage.updateComparable(comparableId, validatedData);
      
      if (!updatedComparable) {
        return res.status(404).json({ message: "Comparable not found" });
      }
      
      res.status(200).json(updatedComparable);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error updating comparable" });
    }
  });
  
  app.delete("/api/comparables/:id", async (req: Request, res: Response) => {
    try {
      const comparableId = Number(req.params.id);
      const success = await storage.deleteComparable(comparableId);
      
      if (!success) {
        return res.status(404).json({ message: "Comparable not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Server error deleting comparable" });
    }
  });
  
  // Adjustment routes
  app.get("/api/comparables/:comparableId/adjustments", async (req: Request, res: Response) => {
    try {
      const comparableId = Number(req.params.comparableId);
      const adjustments = await storage.getAdjustmentsByComparable(comparableId);
      res.status(200).json(adjustments);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching adjustments" });
    }
  });
  
  app.post("/api/adjustments", async (req: Request, res: Response) => {
    try {
      const validatedData = insertAdjustmentSchema.parse(req.body);
      const newAdjustment = await storage.createAdjustment(validatedData);
      res.status(201).json(newAdjustment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error creating adjustment" });
    }
  });
  
  app.put("/api/adjustments/:id", async (req: Request, res: Response) => {
    try {
      const adjustmentId = Number(req.params.id);
      const validatedData = insertAdjustmentSchema.partial().parse(req.body);
      
      const updatedAdjustment = await storage.updateAdjustment(adjustmentId, validatedData);
      
      if (!updatedAdjustment) {
        return res.status(404).json({ message: "Adjustment not found" });
      }
      
      res.status(200).json(updatedAdjustment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error updating adjustment" });
    }
  });
  
  app.delete("/api/adjustments/:id", async (req: Request, res: Response) => {
    try {
      const adjustmentId = Number(req.params.id);
      const success = await storage.deleteAdjustment(adjustmentId);
      
      if (!success) {
        return res.status(404).json({ message: "Adjustment not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Server error deleting adjustment" });
    }
  });
  
  // Photo routes
  app.get("/api/reports/:reportId/photos", async (req: Request, res: Response) => {
    try {
      const reportId = Number(req.params.reportId);
      const photos = await storage.getPhotosByReport(reportId);
      res.status(200).json(photos);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching photos" });
    }
  });
  
  app.post("/api/photos", async (req: Request, res: Response) => {
    try {
      const validatedData = insertPhotoSchema.parse(req.body);
      const newPhoto = await storage.createPhoto(validatedData);
      res.status(201).json(newPhoto);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error creating photo" });
    }
  });
  
  app.put("/api/photos/:id", async (req: Request, res: Response) => {
    try {
      const photoId = Number(req.params.id);
      const validatedData = insertPhotoSchema.partial().parse(req.body);
      
      const updatedPhoto = await storage.updatePhoto(photoId, validatedData);
      
      if (!updatedPhoto) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      res.status(200).json(updatedPhoto);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error updating photo" });
    }
  });
  
  app.delete("/api/photos/:id", async (req: Request, res: Response) => {
    try {
      const photoId = Number(req.params.id);
      const success = await storage.deletePhoto(photoId);
      
      if (!success) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Server error deleting photo" });
    }
  });
  
  // Sketch routes
  app.get("/api/reports/:reportId/sketches", async (req: Request, res: Response) => {
    try {
      const reportId = Number(req.params.reportId);
      const sketches = await storage.getSketchesByReport(reportId);
      res.status(200).json(sketches);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching sketches" });
    }
  });
  
  app.post("/api/sketches", async (req: Request, res: Response) => {
    try {
      const validatedData = insertSketchSchema.parse(req.body);
      const newSketch = await storage.createSketch(validatedData);
      res.status(201).json(newSketch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error creating sketch" });
    }
  });
  
  app.put("/api/sketches/:id", async (req: Request, res: Response) => {
    try {
      const sketchId = Number(req.params.id);
      const validatedData = insertSketchSchema.partial().parse(req.body);
      
      const updatedSketch = await storage.updateSketch(sketchId, validatedData);
      
      if (!updatedSketch) {
        return res.status(404).json({ message: "Sketch not found" });
      }
      
      res.status(200).json(updatedSketch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error updating sketch" });
    }
  });
  
  app.delete("/api/sketches/:id", async (req: Request, res: Response) => {
    try {
      const sketchId = Number(req.params.id);
      const success = await storage.deleteSketch(sketchId);
      
      if (!success) {
        return res.status(404).json({ message: "Sketch not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Server error deleting sketch" });
    }
  });
  
  // Compliance routes
  app.get("/api/reports/:reportId/compliance", async (req: Request, res: Response) => {
    try {
      const reportId = Number(req.params.reportId);
      const complianceChecks = await storage.getComplianceChecksByReport(reportId);
      res.status(200).json(complianceChecks);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching compliance checks" });
    }
  });
  
  app.post("/api/compliance", async (req: Request, res: Response) => {
    try {
      const validatedData = insertComplianceCheckSchema.parse(req.body);
      const newCheck = await storage.createComplianceCheck(validatedData);
      res.status(201).json(newCheck);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error creating compliance check" });
    }
  });
  
  app.delete("/api/compliance/:id", async (req: Request, res: Response) => {
    try {
      const checkId = Number(req.params.id);
      const success = await storage.deleteComplianceCheck(checkId);
      
      if (!success) {
        return res.status(404).json({ message: "Compliance check not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Server error deleting compliance check" });
    }
  });
  
  // Report generation routes
  app.post("/api/reports/:id/generate-pdf", async (req: Request, res: Response) => {
    try {
      const reportId = Number(req.params.id);
      const report = await storage.getAppraisalReport(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      // Get all related data
      const property = await storage.getProperty(report.propertyId);
      const comparables = await storage.getComparablesByReport(reportId);
      const photos = await storage.getPhotosByReport(reportId);
      
      // Generate the PDF
      const pdfBuffer = await generatePDF(report, property, comparables, photos);
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="appraisal-report-${reportId}.pdf"`);
      
      // Send the PDF
      res.status(200).send(pdfBuffer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error generating PDF" });
    }
  });
  
  app.post("/api/reports/:id/generate-xml", async (req: Request, res: Response) => {
    try {
      const reportId = Number(req.params.id);
      const report = await storage.getAppraisalReport(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      // Get all related data
      const property = await storage.getProperty(report.propertyId);
      const comparables = await storage.getComparablesByReport(reportId);
      const adjustments = await Promise.all(
        comparables.map(comp => storage.getAdjustmentsByComparable(comp.id))
      );
      
      // Generate MISMO XML
      const xmlString = await generateMismoXML(report, property, comparables, adjustments.flat());
      
      // Set response headers
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="appraisal-report-${reportId}.xml"`);
      
      // Send the XML
      res.status(200).send(xmlString);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error generating XML" });
    }
  });
  
  // Compliance validation route
  app.post("/api/reports/:id/validate-compliance", async (req: Request, res: Response) => {
    try {
      const reportId = Number(req.params.id);
      const { ruleTypes = ["UAD", "USPAP"], useOrchestrator = true, aiProvider = "auto" } = req.body;
      
      const report = await storage.getAppraisalReport(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      // Get all related data
      const property = await storage.getProperty(report.propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const comparables = await storage.getComparablesByReport(reportId);
      const adjustments = await Promise.all(
        comparables.map(comp => storage.getAdjustmentsByComparable(comp.id))
      );
      
      // Determine if we should use the AI Orchestrator
      if (useOrchestrator) {
        // Convert the AI provider string to enum value
        let provider = AIProvider.AUTO;
        if (aiProvider === "openai") {
          provider = AIProvider.OPENAI;
        } else if (aiProvider === "anthropic") {
          provider = AIProvider.ANTHROPIC;
        }
        
        // Prepare the report text that will be analyzed
        const reportText = report.narrativeText || 
          `Appraisal report for ${property.address}, ${property.city}, ${property.state} ${property.zipCode}. 
          Property is a ${property.propertyType} built in ${property.yearBuilt}, with 
          ${property.grossLivingArea}sqft, ${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms.`;
          
        // Combine data for context
        const reportData = {
          report,
          property,
          comparables,
          adjustments: adjustments.flat()
        };
          
        // Use the AI Orchestrator for compliance checking
        const complianceResults = await aiOrchestrator.checkUSPAPCompliance(
          reportText,
          "full_report", // Check the entire report
          provider
        );
        
        // Save the compliance check results
        const savedResults = [];
        
        // Process standard compliance issues
        if (complianceResults.issues && Array.isArray(complianceResults.issues)) {
          for (const issue of complianceResults.issues) {
            const savedCheck = await storage.createComplianceCheck({
              reportId,
              checkType: issue.type || "USPAP",
              status: issue.severity === "high" ? "error" : (issue.severity === "medium" ? "warning" : "info"),
              message: issue.recommendation || issue.requirement,
              severity: issue.severity || "medium",
              field: issue.field || "general",
            });
            savedResults.push(savedCheck);
          }
        }
        
        // If no specific issues but has recommendations
        if (savedResults.length === 0 && complianceResults.recommendations) {
          const savedCheck = await storage.createComplianceCheck({
            reportId,
            checkType: "USPAP",
            status: "info",
            message: Array.isArray(complianceResults.recommendations) 
              ? complianceResults.recommendations.join("; ") 
              : complianceResults.recommendations,
            severity: "low",
            field: "general",
          });
          savedResults.push(savedCheck);
        }
        
        // Return detailed response with score
        res.status(200).json({
          results: savedResults,
          overallScore: complianceResults.overallCompliance || 0.8,
          recommendations: complianceResults.recommendations || []
        });
      } else {
        // Use the legacy compliance validation
        const validationResults = await validateCompliance(
          report, 
          property, 
          comparables, 
          adjustments.flat(), 
          ruleTypes
        );
        
        // Save compliance check results
        const savedResults = await Promise.all(
          validationResults.map(result => 
            storage.createComplianceCheck({
              reportId,
              checkType: result.checkType,
              status: result.status,
              message: result.message,
              severity: result.severity,
              field: result.field,
            })
          )
        );
        
        res.status(200).json(savedResults);
      }
    } catch (error) {
      console.error("Error validating compliance:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        message: "Error validating report compliance", 
        error: errorMessage 
      });
    }
  });

  // AI Assistant routes
  
  // Advanced AI Valuation endpoints
  app.post("/api/ai/automated-valuation", async (req: Request, res: Response) => {
    try {
      const { subjectProperty, comparableProperties, useOrchestrator = true, aiProvider = "auto" } = req.body;
      
      if (!subjectProperty) {
        return res.status(400).json({ message: "Subject property is required" });
      }
      
      console.log(`Performing automated valuation with ${useOrchestrator ? 'AI Orchestrator' : 'Legacy AI Agent'}...`);
      
      let valuation;
      
      // Check if we should use the new AI Orchestrator
      if (useOrchestrator) {
        // Convert the AI provider string to enum value
        let provider = AIProvider.AUTO;
        if (aiProvider === "openai") {
          provider = AIProvider.OPENAI;
        } else if (aiProvider === "anthropic") {
          provider = AIProvider.ANTHROPIC;
        }
        
        // Use the AI Orchestrator with selected provider
        valuation = await aiOrchestrator.automatedValuation(
          subjectProperty,
          comparableProperties || undefined,
          provider
        );
      } else {
        // Use the legacy AI agent for backward compatibility
        valuation = await performAutomatedValuation(subjectProperty, comparableProperties || []);
      }
      
      res.status(200).json(valuation);
    } catch (error) {
      console.error("Error performing automated valuation:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        message: "Error performing automated valuation", 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  app.post("/api/ai/market-trends", async (req: Request, res: Response) => {
    try {
      const { location, propertyType, useOrchestrator = true, aiProvider = "auto" } = req.body;
      
      if (!location || !propertyType) {
        return res.status(400).json({ message: "Location and property type are required" });
      }
      
      if (typeof location === 'object' && (!location.city || !location.state)) {
        return res.status(400).json({ message: "Location must include at least city and state" });
      }
      
      let analysis;
      
      // Check if we should use the new AI Orchestrator
      if (useOrchestrator) {
        // Convert the AI provider string to enum value
        let provider = AIProvider.AUTO;
        if (aiProvider === "openai") {
          provider = AIProvider.OPENAI;
        } else if (aiProvider === "anthropic") {
          provider = AIProvider.ANTHROPIC;
        }
        
        // Format the location string from an object if needed
        const locationString = typeof location === 'object' 
          ? `${location.city}, ${location.state}` + (location.zipCode ? ` ${location.zipCode}` : '')
          : location;
        
        // Use the AI Orchestrator with the selected provider
        analysis = await aiOrchestrator.generateMarketAnalysis(
          locationString,
          propertyType,
          provider
        );
      } else {
        // Use the legacy AI agent for backward compatibility
        analysis = await analyzeMarketTrends(location, propertyType);
      }
      
      res.status(200).json({ analysis });
    } catch (error) {
      console.error("Error analyzing market trends:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        message: "Error analyzing market trends", 
        error: errorMessage
      });
    }
  });

  app.post("/api/ai/recommend-adjustments", async (req: Request, res: Response) => {
    try {
      const { subjectProperty, comparableProperty } = req.body;
      
      if (!subjectProperty || !comparableProperty) {
        return res.status(400).json({ message: "Subject property and comparable property are required" });
      }
      
      const adjustments = await recommendAdjustments(subjectProperty, comparableProperty);
      res.status(200).json({ adjustments });
    } catch (error) {
      console.error("Error recommending adjustments:", error);
      res.status(500).json({ message: "Error recommending adjustments" });
    }
  });

  app.post("/api/ai/valuation-narrative", async (req: Request, res: Response) => {
    try {
      const { property, valuation } = req.body;
      
      if (!property || !valuation) {
        return res.status(400).json({ message: "Property and valuation data are required" });
      }
      
      const narrative = await generateValuationNarrative(property, valuation);
      res.status(200).json({ narrative });
    } catch (error) {
      console.error("Error generating valuation narrative:", error);
      res.status(500).json({ message: "Error generating valuation narrative" });
    }
  });
  app.post("/api/ai/analyze-property", async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.body;
      
      if (!propertyId) {
        return res.status(400).json({ message: "Property ID is required" });
      }
      
      const property = await storage.getProperty(Number(propertyId));
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const analysis = await analyzeProperty(property);
      res.status(200).json(analysis);
    } catch (error) {
      console.error("Error analyzing property with AI:", error);
      res.status(500).json({ message: "Error analyzing property with AI" });
    }
  });
  
  app.post("/api/ai/analyze-comparables", async (req: Request, res: Response) => {
    try {
      const { reportId } = req.body;
      
      if (!reportId) {
        return res.status(400).json({ message: "Report ID is required" });
      }
      
      const report = await storage.getAppraisalReport(Number(reportId));
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      const property = await storage.getProperty(report.propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const comparables = await storage.getComparablesByReport(Number(reportId));
      
      if (comparables.length === 0) {
        return res.status(400).json({ message: "No comparables found for this report" });
      }
      
      const analysis = await analyzeComparables(property, comparables);
      res.status(200).json(analysis);
    } catch (error) {
      console.error("Error analyzing comparables with AI:", error);
      res.status(500).json({ message: "Error analyzing comparables with AI" });
    }
  });
  
  app.post("/api/ai/generate-narrative", async (req: Request, res: Response) => {
    try {
      const { reportId, section, useOrchestrator = true, aiProvider = "auto" } = req.body;
      
      if (!reportId) {
        return res.status(400).json({ message: "Report ID is required" });
      }
      
      const report = await storage.getAppraisalReport(Number(reportId));
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      const property = await storage.getProperty(report.propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const comparables = await storage.getComparablesByReport(Number(reportId));
      
      // Combine report and property data for narrative generation
      const reportData = {
        report,
        property,
        comparables,
      };
      
      let narrative;
      
      // Check if we should use the new AI Orchestrator
      if (useOrchestrator) {
        // Convert the AI provider string to enum value
        let provider = AIProvider.AUTO;
        if (aiProvider === "openai") {
          provider = AIProvider.OPENAI;
        } else if (aiProvider === "anthropic") {
          provider = AIProvider.ANTHROPIC;
        }
        
        // Use the AI Orchestrator with the selected provider
        narrative = await aiOrchestrator.generateNarrativeSection(
          section || "property_description",
          property,
          {
            report,
            comparables,
          },
          provider
        );
      } else {
        // Use the legacy AI approach
        narrative = await generateAppraisalNarrative(reportData);
      }
      
      res.status(200).json(narrative);
    } catch (error) {
      console.error("Error generating narrative with AI:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        message: "Error generating narrative with AI",
        error: errorMessage
      });
    }
  });
  
  app.post("/api/ai/validate-uad", async (req: Request, res: Response) => {
    try {
      const { reportId } = req.body;
      
      if (!reportId) {
        return res.status(400).json({ message: "Report ID is required" });
      }
      
      const report = await storage.getAppraisalReport(Number(reportId));
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      const property = await storage.getProperty(report.propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const comparables = await storage.getComparablesByReport(Number(reportId));
      
      // Combine all data for UAD validation
      const reportData = {
        report,
        property,
        comparables,
      };
      
      const validation = await validateUADCompliance(reportData);
      res.status(200).json(validation);
    } catch (error) {
      console.error("Error validating UAD compliance with AI:", error);
      res.status(500).json({ message: "Error validating UAD compliance with AI" });
    }
  });
  
  app.post("/api/ai/smart-search", async (req: Request, res: Response) => {
    try {
      const { searchQuery, propertyId } = req.body;
      
      if (!searchQuery || !propertyId) {
        return res.status(400).json({ message: "Search query and property ID are required" });
      }
      
      const property = await storage.getProperty(Number(propertyId));
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const searchResults = await smartSearch(searchQuery, property);
      res.status(200).json(searchResults);
    } catch (error) {
      console.error("Error performing smart search with AI:", error);
      res.status(500).json({ message: "Error performing smart search with AI" });
    }
  });
  
  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    try {
      const { question, reportId } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }
      
      let contextData = {};
      
      // If a report ID is provided, gather context data
      if (reportId) {
        const report = await storage.getAppraisalReport(Number(reportId));
        
        if (!report) {
          return res.status(404).json({ message: "Report not found" });
        }
        
        const property = await storage.getProperty(report.propertyId);
        const comparables = await storage.getComparablesByReport(Number(reportId));
        
        contextData = {
          report,
          property,
          comparables,
        };
      }
      
      const response = await chatQuery(question, contextData);
      res.status(200).json(response);
    } catch (error) {
      console.error("Error processing chat query with AI:", error);
      res.status(500).json({ message: "Error processing chat query with AI" });
    }
  });

  // Market-based adjustment analysis endpoint
  app.post("/api/ai/market-adjustments", async (req: Request, res: Response) => {
    try {
      const { marketArea, salesData } = req.body;
      
      if (!marketArea || !salesData || !Array.isArray(salesData)) {
        return res.status(400).json({ 
          message: "Market area and sales data array are required" 
        });
      }
      
      // Analyze market adjustments using OpenAI
      const analysis = await analyzeMarketAdjustments(marketArea, salesData);
      res.status(200).json(analysis);
    } catch (error) {
      console.error("Error analyzing market adjustments with AI:", error);
      res.status(500).json({ 
        message: "Error analyzing market adjustments with AI" 
      });
    }
  });

  // Automated Order Processing Routes
  
  // Process email to extract property data and create a report
  app.post("/api/orders/process-email", async (req: Request, res: Response) => {
    try {
      const { emailContent, senderEmail, subject, useOrchestrator = true, aiProvider = "auto" } = req.body;
      
      if (!emailContent) {
        return res.status(400).json({ message: "Email content is required" });
      }
      
      // Simulate the user being logged in with ID 1
      const userId = 1; // In a real app, this would come from the authenticated session
      
      // Create an email object for processing
      const emailData = {
        id: `email-${Date.now()}`,
        subject: subject || "Appraisal Order",
        from: senderEmail || "client@example.com",
        to: "appraiser@example.com",
        body: emailContent,
        receivedDate: new Date(),
        attachments: []
      };
      
      console.log(`Processing email order with ${useOrchestrator ? 'AI Orchestrator' : 'Legacy Processor'}...`);
      
      let reportId;
      
      if (useOrchestrator) {
        // Convert the AI provider string to enum value
        let provider = AIProvider.AUTO;
        if (aiProvider === "openai") {
          provider = AIProvider.OPENAI;
        } else if (aiProvider === "anthropic") {
          provider = AIProvider.ANTHROPIC;
        }
        
        // First extract property data using the orchestrator
        const extractedData = await aiOrchestrator.processEmailOrder(
          emailContent,
          subject,
          senderEmail,
          provider
        );
        
        // Import code from email-integration.ts
        const { processOrderEmail } = await import("./lib/email-integration");
        
        // Create transformed email object with the extracted data
        const enhancedEmail = {
          ...emailData,
          extractedData
        };
        
        // Process the email to create a property and report
        reportId = await processOrderEmail(enhancedEmail, userId);
      } else {
        // Use the legacy email processing flow
        // Import code from email-integration.ts
        const { processOrderEmail } = await import("./lib/email-integration");
        
        // Process the email to create a property and report
        reportId = await processOrderEmail(emailData, userId);
      }
      
      if (!reportId) {
        return res.status(500).json({ message: "Failed to process email and create report" });
      }
      
      res.status(200).json({ 
        success: true, 
        message: "Email processed successfully", 
        reportId 
      });
    } catch (error) {
      console.error("Error processing email order:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        message: "Error processing email order", 
        error: errorMessage 
      });
    }
  });
  
  // Process uploaded files to extract property data and create a report
  app.post("/api/orders/process-files", async (req: Request, res: Response) => {
    try {
      const { fileContent, documentType = "order", useOrchestrator = true, aiProvider = "auto" } = req.body;
      
      // Simulate the user being logged in with ID 1
      const userId = 1; // In a real app, this would come from the authenticated session
      
      let property;
      let report;
      
      if (useOrchestrator && fileContent) {
        console.log(`Processing document with AI Orchestrator, type: ${documentType}...`);
        
        // Convert the AI provider string to enum value
        let provider = AIProvider.AUTO;
        if (aiProvider === "openai") {
          provider = AIProvider.OPENAI;
        } else if (aiProvider === "anthropic") {
          provider = AIProvider.ANTHROPIC;
        }
        
        // Use the AI orchestrator to analyze the document
        // In a real implementation, this would handle PDF, images, etc.
        const documentAnalysis = await aiOrchestrator.processEmailOrder(
          fileContent, 
          documentType, // Using document type as the subject
          undefined, // No sender email 
          provider
        );
        
        // Create a new property from the extracted data
        property = await storage.createProperty({
          userId,
          address: documentAnalysis.address || "123 Sample St",
          city: documentAnalysis.city || "Example City",
          state: documentAnalysis.state || "CA",
          zipCode: documentAnalysis.zipCode || "90210",
          propertyType: documentAnalysis.propertyType || "Single Family",
          yearBuilt: documentAnalysis.yearBuilt || 2000,
          grossLivingArea: String(documentAnalysis.squareFeet || 2000),
          bedrooms: String(documentAnalysis.bedrooms || 3),
          bathrooms: String(documentAnalysis.bathrooms || 2)
        });
        
        // Create a new appraisal report with extracted data
        report = await storage.createAppraisalReport({
          propertyId: property.id,
          userId,
          reportType: documentAnalysis.reportType || "URAR",
          formType: documentAnalysis.formType || "URAR",
          status: "in_progress",
          purpose: documentAnalysis.purpose || "Purchase",
          effectiveDate: new Date(),
          reportDate: new Date(),
          clientName: documentAnalysis.clientName || "Example Client",
          clientAddress: documentAnalysis.clientAddress || "Unknown",
          lenderName: documentAnalysis.lenderName || "Example Bank",
          lenderAddress: documentAnalysis.lenderAddress || "Unknown",
          borrowerName: documentAnalysis.borrowerName || "Unknown",
          occupancy: documentAnalysis.occupancy || "Unknown",
          salesPrice: documentAnalysis.salesPrice || null,
          marketValue: null
        });
      } else {
        console.log("Using simulated data for document processing...");
        
        // In a real implementation, we would use multer middleware to handle file uploads
        // For demonstration, we'll use simulated property and report data
        
        // Create a new property for demonstration
        property = await storage.createProperty({
          userId,
          address: "123 Sample St",
          city: "Example City",
          state: "CA",
          zipCode: "90210",
          propertyType: "Single Family",
          yearBuilt: 2005,
          grossLivingArea: String(2200),
          bedrooms: String(4),
          bathrooms: String(3)
        });
        
        // Create a new appraisal report
        report = await storage.createAppraisalReport({
          propertyId: property.id,
          userId,
          reportType: "URAR",
          formType: "URAR",
          status: "in_progress",
          purpose: "Purchase",
          effectiveDate: new Date(),
          reportDate: new Date(),
          clientName: "Example Client",
          clientAddress: "456 Client Ave, Business City, CA 90211",
          lenderName: "Example Bank",
          lenderAddress: "789 Bank St, Finance City, CA 90212",
          borrowerName: "John Borrower",
          occupancy: "Owner Occupied",
          salesPrice: null,
          marketValue: null
        });
      }
      
      // For a production implementation, we would also:
      // 1. Handle multiple file uploads
      // 2. Process different file types (PDFs, images, etc.)
      // 3. Call public record APIs to get additional data
      // 4. Attach the original files to the report
      
      res.status(200).json({ 
        success: true, 
        message: "Files processed successfully", 
        reportId: report.id,
        property: {
          id: property.id,
          address: property.address,
          city: property.city,
          state: property.state,
          zipCode: property.zipCode
        }
      });
    } catch (error) {
      console.error("Error processing file order:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        message: "Error processing file order", 
        error: errorMessage 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
