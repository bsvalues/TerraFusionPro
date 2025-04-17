import { 
  users, User, InsertUser,
  properties, Property, InsertProperty,
  appraisalReports, AppraisalReport, InsertAppraisalReport,
  comparables, Comparable, InsertComparable,
  adjustments, Adjustment, InsertAdjustment,
  photos, Photo, InsertPhoto,
  sketches, Sketch, InsertSketch,
  complianceChecks, ComplianceCheck, InsertComplianceCheck
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }

  // Property operations
  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async getPropertiesByUser(userId: number): Promise<Property[]> {
    return await db.select().from(properties).where(eq(properties.userId, userId));
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [createdProperty] = await db.insert(properties).values(property).returning();
    return createdProperty;
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const [updatedProperty] = await db
      .update(properties)
      .set({...property, updatedAt: new Date()})
      .where(eq(properties.id, id))
      .returning();
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<boolean> {
    try {
      const result = await db.delete(properties).where(eq(properties.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting property:", error);
      return false;
    }
  }

  // Appraisal report operations
  async getAppraisalReport(id: number): Promise<AppraisalReport | undefined> {
    const [report] = await db.select().from(appraisalReports).where(eq(appraisalReports.id, id));
    return report;
  }

  async getAppraisalReportsByUser(userId: number): Promise<AppraisalReport[]> {
    return await db.select().from(appraisalReports).where(eq(appraisalReports.userId, userId));
  }

  async getAppraisalReportsByProperty(propertyId: number): Promise<AppraisalReport[]> {
    return await db.select().from(appraisalReports).where(eq(appraisalReports.propertyId, propertyId));
  }

  async createAppraisalReport(report: InsertAppraisalReport): Promise<AppraisalReport> {
    const [createdReport] = await db.insert(appraisalReports).values(report).returning();
    return createdReport;
  }

  async updateAppraisalReport(id: number, report: Partial<InsertAppraisalReport>): Promise<AppraisalReport | undefined> {
    const [updatedReport] = await db
      .update(appraisalReports)
      .set({...report, updatedAt: new Date()})
      .where(eq(appraisalReports.id, id))
      .returning();
    return updatedReport;
  }

  async deleteAppraisalReport(id: number): Promise<boolean> {
    try {
      const result = await db.delete(appraisalReports).where(eq(appraisalReports.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting appraisal report:", error);
      return false;
    }
  }

  // Comparable operations
  async getComparable(id: number): Promise<Comparable | undefined> {
    const [comparable] = await db.select().from(comparables).where(eq(comparables.id, id));
    return comparable;
  }

  async getComparablesByReport(reportId: number): Promise<Comparable[]> {
    return await db.select().from(comparables).where(eq(comparables.reportId, reportId));
  }

  async createComparable(comparable: InsertComparable): Promise<Comparable> {
    const [createdComparable] = await db.insert(comparables).values(comparable).returning();
    return createdComparable;
  }

  async updateComparable(id: number, comparable: Partial<InsertComparable>): Promise<Comparable | undefined> {
    const [updatedComparable] = await db
      .update(comparables)
      .set({...comparable, updatedAt: new Date()})
      .where(eq(comparables.id, id))
      .returning();
    return updatedComparable;
  }

  async deleteComparable(id: number): Promise<boolean> {
    try {
      await db.delete(comparables).where(eq(comparables.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting comparable:", error);
      return false;
    }
  }

  // Adjustment operations
  async getAdjustment(id: number): Promise<Adjustment | undefined> {
    const [adjustment] = await db.select().from(adjustments).where(eq(adjustments.id, id));
    return adjustment;
  }

  async getAdjustmentsByReport(reportId: number): Promise<Adjustment[]> {
    return await db.select().from(adjustments).where(eq(adjustments.reportId, reportId));
  }

  async getAdjustmentsByComparable(comparableId: number): Promise<Adjustment[]> {
    return await db.select().from(adjustments).where(eq(adjustments.comparableId, comparableId));
  }

  async createAdjustment(adjustment: InsertAdjustment): Promise<Adjustment> {
    const [createdAdjustment] = await db.insert(adjustments).values(adjustment).returning();
    return createdAdjustment;
  }

  async updateAdjustment(id: number, adjustment: Partial<InsertAdjustment>): Promise<Adjustment | undefined> {
    const [updatedAdjustment] = await db
      .update(adjustments)
      .set({...adjustment, updatedAt: new Date()})
      .where(eq(adjustments.id, id))
      .returning();
    return updatedAdjustment;
  }

  async deleteAdjustment(id: number): Promise<boolean> {
    try {
      await db.delete(adjustments).where(eq(adjustments.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting adjustment:", error);
      return false;
    }
  }

  // Photo operations
  async getPhoto(id: number): Promise<Photo | undefined> {
    const [photo] = await db.select().from(photos).where(eq(photos.id, id));
    return photo;
  }

  async getPhotosByReport(reportId: number): Promise<Photo[]> {
    return await db.select().from(photos).where(eq(photos.reportId, reportId));
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const [createdPhoto] = await db.insert(photos).values(photo).returning();
    return createdPhoto;
  }

  async updatePhoto(id: number, photo: Partial<InsertPhoto>): Promise<Photo | undefined> {
    const [updatedPhoto] = await db
      .update(photos)
      .set(photo)
      .where(eq(photos.id, id))
      .returning();
    return updatedPhoto;
  }

  async deletePhoto(id: number): Promise<boolean> {
    try {
      await db.delete(photos).where(eq(photos.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting photo:", error);
      return false;
    }
  }

  // Sketch operations
  async getSketch(id: number): Promise<Sketch | undefined> {
    const [sketch] = await db.select().from(sketches).where(eq(sketches.id, id));
    return sketch;
  }

  async getSketchesByReport(reportId: number): Promise<Sketch[]> {
    return await db.select().from(sketches).where(eq(sketches.reportId, reportId));
  }

  async createSketch(sketch: InsertSketch): Promise<Sketch> {
    const [createdSketch] = await db.insert(sketches).values(sketch).returning();
    return createdSketch;
  }

  async updateSketch(id: number, sketch: Partial<InsertSketch>): Promise<Sketch | undefined> {
    const [updatedSketch] = await db
      .update(sketches)
      .set({...sketch, updatedAt: new Date()})
      .where(eq(sketches.id, id))
      .returning();
    return updatedSketch;
  }

  async deleteSketch(id: number): Promise<boolean> {
    try {
      await db.delete(sketches).where(eq(sketches.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting sketch:", error);
      return false;
    }
  }

  // Compliance operations
  async getComplianceCheck(id: number): Promise<ComplianceCheck | undefined> {
    const [check] = await db.select().from(complianceChecks).where(eq(complianceChecks.id, id));
    return check;
  }

  async getComplianceChecksByReport(reportId: number): Promise<ComplianceCheck[]> {
    return await db.select().from(complianceChecks).where(eq(complianceChecks.reportId, reportId));
  }

  async createComplianceCheck(check: InsertComplianceCheck): Promise<ComplianceCheck> {
    const [createdCheck] = await db.insert(complianceChecks).values(check).returning();
    return createdCheck;
  }

  async deleteComplianceCheck(id: number): Promise<boolean> {
    try {
      await db.delete(complianceChecks).where(eq(complianceChecks.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting compliance check:", error);
      return false;
    }
  }
}