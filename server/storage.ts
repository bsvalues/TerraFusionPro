import {
  users, User, InsertUser,
  properties, Property, InsertProperty,
  appraisalReports, AppraisalReport, InsertAppraisalReport,
  comparables, Comparable, InsertComparable,
  adjustments, Adjustment, InsertAdjustment,
  photos, Photo, InsertPhoto,
  sketches, Sketch, InsertSketch,
  complianceChecks, ComplianceCheck, InsertComplianceCheck,
  adjustmentModels, AdjustmentModel, InsertAdjustmentModel,
  modelAdjustments, ModelAdjustment, InsertModelAdjustment,
  marketAnalysis, MarketAnalysis, InsertMarketAnalysis
} from "@shared/schema";

// Extend the storage interface to support all our models
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Property operations
  getProperty(id: number): Promise<Property | undefined>;
  getPropertiesByUser(userId: number): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;

  // Appraisal report operations
  getAppraisalReport(id: number): Promise<AppraisalReport | undefined>;
  getAppraisalReportsByUser(userId: number): Promise<AppraisalReport[]>;
  getAppraisalReportsByProperty(propertyId: number): Promise<AppraisalReport[]>;
  createAppraisalReport(report: InsertAppraisalReport): Promise<AppraisalReport>;
  updateAppraisalReport(id: number, report: Partial<InsertAppraisalReport>): Promise<AppraisalReport | undefined>;
  deleteAppraisalReport(id: number): Promise<boolean>;

  // Comparable operations
  getComparable(id: number): Promise<Comparable | undefined>;
  getComparablesByReport(reportId: number): Promise<Comparable[]>;
  createComparable(comparable: InsertComparable): Promise<Comparable>;
  updateComparable(id: number, comparable: Partial<InsertComparable>): Promise<Comparable | undefined>;
  deleteComparable(id: number): Promise<boolean>;

  // Adjustment operations
  getAdjustment(id: number): Promise<Adjustment | undefined>;
  getAdjustmentsByReport(reportId: number): Promise<Adjustment[]>;
  getAdjustmentsByComparable(comparableId: number): Promise<Adjustment[]>;
  createAdjustment(adjustment: InsertAdjustment): Promise<Adjustment>;
  updateAdjustment(id: number, adjustment: Partial<InsertAdjustment>): Promise<Adjustment | undefined>;
  deleteAdjustment(id: number): Promise<boolean>;

  // Photo operations
  getPhoto(id: number): Promise<Photo | undefined>;
  getPhotosByReport(reportId: number): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  updatePhoto(id: number, photo: Partial<InsertPhoto>): Promise<Photo | undefined>;
  deletePhoto(id: number): Promise<boolean>;

  // Sketch operations
  getSketch(id: number): Promise<Sketch | undefined>;
  getSketchesByReport(reportId: number): Promise<Sketch[]>;
  createSketch(sketch: InsertSketch): Promise<Sketch>;
  updateSketch(id: number, sketch: Partial<InsertSketch>): Promise<Sketch | undefined>;
  deleteSketch(id: number): Promise<boolean>;

  // Compliance operations
  getComplianceCheck(id: number): Promise<ComplianceCheck | undefined>;
  getComplianceChecksByReport(reportId: number): Promise<ComplianceCheck[]>;
  createComplianceCheck(check: InsertComplianceCheck): Promise<ComplianceCheck>;
  deleteComplianceCheck(id: number): Promise<boolean>;
  
  // Adjustment Model operations
  getAdjustmentModel(id: number): Promise<AdjustmentModel | undefined>;
  getAdjustmentModelsByReport(reportId: number): Promise<AdjustmentModel[]>;
  createAdjustmentModel(model: InsertAdjustmentModel): Promise<AdjustmentModel>;
  updateAdjustmentModel(id: number, model: Partial<InsertAdjustmentModel>): Promise<AdjustmentModel | undefined>;
  deleteAdjustmentModel(id: number): Promise<boolean>;
  
  // Model Adjustment operations
  getModelAdjustment(id: number): Promise<ModelAdjustment | undefined>;
  getModelAdjustmentsByModel(modelId: number): Promise<ModelAdjustment[]>;
  getModelAdjustmentsByComparable(comparableId: number, modelId?: number): Promise<ModelAdjustment[]>;
  createModelAdjustment(adjustment: InsertModelAdjustment): Promise<ModelAdjustment>;
  updateModelAdjustment(id: number, adjustment: Partial<InsertModelAdjustment>): Promise<ModelAdjustment | undefined>;
  deleteModelAdjustment(id: number): Promise<boolean>;
  
  // Market Analysis operations
  getMarketAnalysis(id: number): Promise<MarketAnalysis | undefined>;
  getMarketAnalysesByReport(reportId: number): Promise<MarketAnalysis[]>;
  getMarketAnalysisByType(reportId: number, analysisType: string): Promise<MarketAnalysis | undefined>;
  createMarketAnalysis(analysis: InsertMarketAnalysis): Promise<MarketAnalysis>;
  updateMarketAnalysis(id: number, analysis: Partial<InsertMarketAnalysis>): Promise<MarketAnalysis | undefined>;
  deleteMarketAnalysis(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private appraisalReports: Map<number, AppraisalReport>;
  private comparables: Map<number, Comparable>;
  private adjustments: Map<number, Adjustment>;
  private photos: Map<number, Photo>;
  private sketches: Map<number, Sketch>;
  private complianceChecks: Map<number, ComplianceCheck>;
  
  private currentUserId: number;
  private currentPropertyId: number;
  private currentReportId: number;
  private currentComparableId: number;
  private currentAdjustmentId: number;
  private currentPhotoId: number;
  private currentSketchId: number;
  private currentComplianceCheckId: number;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.appraisalReports = new Map();
    this.comparables = new Map();
    this.adjustments = new Map();
    this.photos = new Map();
    this.sketches = new Map();
    this.complianceChecks = new Map();
    
    this.currentUserId = 1;
    this.currentPropertyId = 1;
    this.currentReportId = 1;
    this.currentComparableId = 1;
    this.currentAdjustmentId = 1;
    this.currentPhotoId = 1;
    this.currentSketchId = 1;
    this.currentComplianceCheckId = 1;
    
    // Add demo user
    this.users.set(1, {
      id: 1,
      username: "demo",
      password: "password",
      fullName: "John Appraiser",
      company: "ABC Appraisal",
      licenseNumber: "AP12345",
      email: "john@abcappraisal.com",
      phoneNumber: "555-123-4567"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Property methods
  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async getPropertiesByUser(userId: number): Promise<Property[]> {
    return Array.from(this.properties.values()).filter(
      (property) => property.userId === userId
    );
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = this.currentPropertyId++;
    const now = new Date();
    const property: Property = { 
      ...insertProperty, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.properties.set(id, property);
    return property;
  }

  async updateProperty(id: number, updateData: Partial<InsertProperty>): Promise<Property | undefined> {
    const property = this.properties.get(id);
    if (!property) return undefined;
    
    const updatedProperty: Property = {
      ...property,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<boolean> {
    return this.properties.delete(id);
  }

  // Appraisal report methods
  async getAppraisalReport(id: number): Promise<AppraisalReport | undefined> {
    return this.appraisalReports.get(id);
  }

  async getAppraisalReportsByUser(userId: number): Promise<AppraisalReport[]> {
    return Array.from(this.appraisalReports.values()).filter(
      (report) => report.userId === userId
    );
  }

  async getAppraisalReportsByProperty(propertyId: number): Promise<AppraisalReport[]> {
    return Array.from(this.appraisalReports.values()).filter(
      (report) => report.propertyId === propertyId
    );
  }

  async createAppraisalReport(insertReport: InsertAppraisalReport): Promise<AppraisalReport> {
    const id = this.currentReportId++;
    const now = new Date();
    const report: AppraisalReport = { 
      ...insertReport, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.appraisalReports.set(id, report);
    return report;
  }

  async updateAppraisalReport(id: number, updateData: Partial<InsertAppraisalReport>): Promise<AppraisalReport | undefined> {
    const report = this.appraisalReports.get(id);
    if (!report) return undefined;
    
    const updatedReport: AppraisalReport = {
      ...report,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.appraisalReports.set(id, updatedReport);
    return updatedReport;
  }

  async deleteAppraisalReport(id: number): Promise<boolean> {
    return this.appraisalReports.delete(id);
  }

  // Comparable methods
  async getComparable(id: number): Promise<Comparable | undefined> {
    return this.comparables.get(id);
  }

  async getComparablesByReport(reportId: number): Promise<Comparable[]> {
    return Array.from(this.comparables.values()).filter(
      (comparable) => comparable.reportId === reportId
    );
  }

  async createComparable(insertComparable: InsertComparable): Promise<Comparable> {
    const id = this.currentComparableId++;
    const now = new Date();
    const comparable: Comparable = { 
      ...insertComparable, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.comparables.set(id, comparable);
    return comparable;
  }

  async updateComparable(id: number, updateData: Partial<InsertComparable>): Promise<Comparable | undefined> {
    const comparable = this.comparables.get(id);
    if (!comparable) return undefined;
    
    const updatedComparable: Comparable = {
      ...comparable,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.comparables.set(id, updatedComparable);
    return updatedComparable;
  }

  async deleteComparable(id: number): Promise<boolean> {
    return this.comparables.delete(id);
  }

  // Adjustment methods
  async getAdjustment(id: number): Promise<Adjustment | undefined> {
    return this.adjustments.get(id);
  }

  async getAdjustmentsByReport(reportId: number): Promise<Adjustment[]> {
    return Array.from(this.adjustments.values()).filter(
      (adjustment) => adjustment.reportId === reportId
    );
  }

  async getAdjustmentsByComparable(comparableId: number): Promise<Adjustment[]> {
    return Array.from(this.adjustments.values()).filter(
      (adjustment) => adjustment.comparableId === comparableId
    );
  }

  async createAdjustment(insertAdjustment: InsertAdjustment): Promise<Adjustment> {
    const id = this.currentAdjustmentId++;
    const now = new Date();
    const adjustment: Adjustment = { 
      ...insertAdjustment, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.adjustments.set(id, adjustment);
    return adjustment;
  }

  async updateAdjustment(id: number, updateData: Partial<InsertAdjustment>): Promise<Adjustment | undefined> {
    const adjustment = this.adjustments.get(id);
    if (!adjustment) return undefined;
    
    const updatedAdjustment: Adjustment = {
      ...adjustment,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.adjustments.set(id, updatedAdjustment);
    return updatedAdjustment;
  }

  async deleteAdjustment(id: number): Promise<boolean> {
    return this.adjustments.delete(id);
  }

  // Photo methods
  async getPhoto(id: number): Promise<Photo | undefined> {
    return this.photos.get(id);
  }

  async getPhotosByReport(reportId: number): Promise<Photo[]> {
    return Array.from(this.photos.values()).filter(
      (photo) => photo.reportId === reportId
    );
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const id = this.currentPhotoId++;
    const now = new Date();
    const photo: Photo = { 
      ...insertPhoto, 
      id,
      createdAt: now
    };
    this.photos.set(id, photo);
    return photo;
  }

  async updatePhoto(id: number, updateData: Partial<InsertPhoto>): Promise<Photo | undefined> {
    const photo = this.photos.get(id);
    if (!photo) return undefined;
    
    const updatedPhoto: Photo = {
      ...photo,
      ...updateData
    };
    
    this.photos.set(id, updatedPhoto);
    return updatedPhoto;
  }

  async deletePhoto(id: number): Promise<boolean> {
    return this.photos.delete(id);
  }

  // Sketch methods
  async getSketch(id: number): Promise<Sketch | undefined> {
    return this.sketches.get(id);
  }

  async getSketchesByReport(reportId: number): Promise<Sketch[]> {
    return Array.from(this.sketches.values()).filter(
      (sketch) => sketch.reportId === reportId
    );
  }

  async createSketch(insertSketch: InsertSketch): Promise<Sketch> {
    const id = this.currentSketchId++;
    const now = new Date();
    const sketch: Sketch = { 
      ...insertSketch, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.sketches.set(id, sketch);
    return sketch;
  }

  async updateSketch(id: number, updateData: Partial<InsertSketch>): Promise<Sketch | undefined> {
    const sketch = this.sketches.get(id);
    if (!sketch) return undefined;
    
    const updatedSketch: Sketch = {
      ...sketch,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.sketches.set(id, updatedSketch);
    return updatedSketch;
  }

  async deleteSketch(id: number): Promise<boolean> {
    return this.sketches.delete(id);
  }

  // Compliance check methods
  async getComplianceCheck(id: number): Promise<ComplianceCheck | undefined> {
    return this.complianceChecks.get(id);
  }

  async getComplianceChecksByReport(reportId: number): Promise<ComplianceCheck[]> {
    return Array.from(this.complianceChecks.values()).filter(
      (check) => check.reportId === reportId
    );
  }

  async createComplianceCheck(insertCheck: InsertComplianceCheck): Promise<ComplianceCheck> {
    const id = this.currentComplianceCheckId++;
    const now = new Date();
    const check: ComplianceCheck = { 
      ...insertCheck, 
      id,
      createdAt: now
    };
    this.complianceChecks.set(id, check);
    return check;
  }

  async deleteComplianceCheck(id: number): Promise<boolean> {
    return this.complianceChecks.delete(id);
  }
}

import { DatabaseStorage } from "./database-storage";

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
