import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPropertySchema, insertAppraisalReportSchema, insertComparableSchema, insertAdjustmentSchema, insertPhotoSchema, insertSketchSchema, insertComplianceCheckSchema } from "@shared/schema";
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

// For production with real OpenAI API (commented out due to quota limitations)
// import {
//   performAutomatedValuation,
//   analyzeMarketTrends,
//   recommendAdjustments,
//   generateValuationNarrative
// } from "./lib/ai-agent";

// For development/testing with mock data
import {
  performAutomatedValuation,
  analyzeMarketTrends,
  recommendAdjustments,
  generateValuationNarrative
} from "./lib/ai-agent.mock";

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
      const ruleTypes = req.body.ruleTypes || ["UAD", "USPAP"]; // Default rule types
      
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
      
      // Validate compliance
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
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error validating compliance" });
    }
  });

  // AI Assistant routes
  
  // Advanced AI Valuation endpoints
  app.post("/api/ai/automated-valuation", async (req: Request, res: Response) => {
    try {
      const { subjectProperty, comparableProperties } = req.body;
      
      if (!subjectProperty || !comparableProperties || !Array.isArray(comparableProperties)) {
        return res.status(400).json({ message: "Subject property and comparable properties array are required" });
      }
      
      const valuation = await performAutomatedValuation(subjectProperty, comparableProperties);
      res.status(200).json(valuation);
    } catch (error) {
      console.error("Error performing automated valuation:", error);
      res.status(500).json({ message: "Error performing automated valuation" });
    }
  });

  app.post("/api/ai/market-trends", async (req: Request, res: Response) => {
    try {
      const { location, propertyType } = req.body;
      
      if (!location || !propertyType) {
        return res.status(400).json({ message: "Location and property type are required" });
      }
      
      if (!location.city || !location.state || !location.zipCode) {
        return res.status(400).json({ message: "Location must include city, state, and zipCode" });
      }
      
      const analysis = await analyzeMarketTrends(location, propertyType);
      res.status(200).json({ analysis });
    } catch (error) {
      console.error("Error analyzing market trends:", error);
      res.status(500).json({ message: "Error analyzing market trends" });
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
      
      // Combine report and property data for narrative generation
      const reportData = {
        report,
        property,
        comparables,
      };
      
      const narrative = await generateAppraisalNarrative(reportData);
      res.status(200).json(narrative);
    } catch (error) {
      console.error("Error generating narrative with AI:", error);
      res.status(500).json({ message: "Error generating narrative with AI" });
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

  const httpServer = createServer(app);
  return httpServer;
}
