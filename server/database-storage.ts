import { db } from './db';
import { eq, sql, and, desc, asc } from 'drizzle-orm';
import * as schema from '../shared/schema';
import type { 
  IStorage, 
  FileImportResult,
  FileImportResultUpdate,
  InsertFileImportResult,
  Order,
  InsertOrder
} from './storage';

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUsername(username: string) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  async createUser(userData: schema.InsertUser) {
    const [user] = await db.insert(schema.users).values(userData).returning();
    return user;
  }

  // Property methods
  async createProperty(propertyData: schema.InsertProperty) {
    const [property] = await db.insert(schema.properties).values(propertyData).returning();
    return property;
  }

  async getProperty(id: number) {
    const [property] = await db.select().from(schema.properties).where(eq(schema.properties.id, id));
    return property;
  }

  async updateProperty(id: number, propertyData: Partial<schema.InsertProperty>) {
    const [updatedProperty] = await db
      .update(schema.properties)
      .set(propertyData)
      .where(eq(schema.properties.id, id))
      .returning();
    return updatedProperty;
  }

  async deleteProperty(id: number) {
    await db.delete(schema.properties).where(eq(schema.properties.id, id));
  }

  async getPropertiesByUserId(userId: number) {
    return await db.select().from(schema.properties).where(eq(schema.properties.userId, userId));
  }

  // Appraisal report methods
  async createAppraisalReport(reportData: schema.InsertValuation) {
    const [report] = await db.insert(schema.valuations).values(reportData).returning();
    return report;
  }

  async getAppraisalReport(id: number) {
    try {
      console.log(`Fetching appraisal report with ID: ${id}`);
      const [report] = await db.select().from(schema.valuations).where(eq(schema.valuations.id, id));
      
      if (!report) {
        console.log(`No appraisal report found with ID: ${id}`);
        return undefined;
      }
      
      console.log(`Successfully fetched appraisal report with ID: ${id}`);
      return report;
    } catch (error) {
      console.error(`Error fetching appraisal report with ID ${id}:`, error);
      return undefined;
    }
  }

  async updateAppraisalReport(id: number, reportData: Partial<schema.InsertValuation>) {
    const [updatedReport] = await db
      .update(schema.valuations)
      .set(reportData)
      .where(eq(schema.valuations.id, id))
      .returning();
    return updatedReport;
  }

  async deleteAppraisalReport(id: number) {
    await db.delete(schema.valuations).where(eq(schema.valuations.id, id));
    return true;
  }

  async getAppraisalReportsByUserId(userId: number) {
    return await db.select().from(schema.valuations).where(eq(schema.valuations.userId, userId));
  }

  async getAppraisalReportsByPropertyId(propertyId: number) {
    return await db.select().from(schema.valuations).where(eq(schema.valuations.propertyId, propertyId));
  }

  // Comparable methods
  async createComparable(comparableData: schema.InsertComparable) {
    const [comparable] = await db.insert(schema.comparables).values(comparableData).returning();
    return comparable;
  }

  async getComparable(id: number) {
    try {
      console.log(`Fetching comparable with ID: ${id}`);
      const [comparable] = await db.select().from(schema.comparables).where(eq(schema.comparables.id, id));
      
      if (!comparable) {
        console.log(`No comparable found with ID: ${id}`);
        return undefined;
      }
      
      console.log(`Successfully fetched comparable with ID: ${id}`);
      return comparable;
    } catch (error) {
      console.error(`Error fetching comparable with ID ${id}:`, error);
      return undefined;
    }
  }

  async updateComparable(id: number, comparableData: Partial<schema.InsertComparable>) {
    const [updatedComparable] = await db
      .update(schema.comparables)
      .set(comparableData)
      .where(eq(schema.comparables.id, id))
      .returning();
    return updatedComparable;
  }

  async deleteComparable(id: number) {
    await db.delete(schema.comparables).where(eq(schema.comparables.id, id));
  }

  async getComparablesByReportId(reportId: number) {
    return await db.select().from(schema.comparables).where(eq(schema.comparables.reportId, reportId));
  }

  // Adjustment methods
  async createAdjustment(adjustmentData: schema.InsertAdjustment) {
    const [adjustment] = await db.insert(schema.adjustments).values(adjustmentData).returning();
    return adjustment;
  }

  async getAdjustment(id: number) {
    try {
      console.log(`Fetching adjustment with ID: ${id}`);
      const [adjustment] = await db.select().from(schema.adjustments).where(eq(schema.adjustments.id, id));
      
      if (!adjustment) {
        console.log(`No adjustment found with ID: ${id}`);
        return undefined;
      }
      
      console.log(`Successfully fetched adjustment with ID: ${id}`);
      return adjustment;
    } catch (error) {
      console.error(`Error fetching adjustment with ID ${id}:`, error);
      return undefined;
    }
  }

  async updateAdjustment(id: number, adjustmentData: Partial<schema.InsertAdjustment>) {
    const [updatedAdjustment] = await db
      .update(schema.adjustments)
      .set(adjustmentData)
      .where(eq(schema.adjustments.id, id))
      .returning();
    return updatedAdjustment;
  }

  async deleteAdjustment(id: number) {
    await db.delete(schema.adjustments).where(eq(schema.adjustments.id, id));
  }

  async getAdjustmentsByReportId(reportId: number) {
    return await db.select().from(schema.adjustments).where(eq(schema.adjustments.reportId, reportId));
  }

  async getAdjustmentsByComparableId(comparableId: number) {
    return await db.select().from(schema.adjustments).where(eq(schema.adjustments.comparableId, comparableId));
  }

  // Photo methods
  async createPhoto(photoData: schema.InsertPhoto) {
    const [photo] = await db.insert(schema.photos).values(photoData).returning();
    return photo;
  }

  async getPhoto(id: number) {
    try {
      console.log(`Fetching photo with ID: ${id}`);
      const [photo] = await db.select().from(schema.photos).where(eq(schema.photos.id, id));
      
      if (!photo) {
        console.log(`No photo found with ID: ${id}`);
        return undefined;
      }
      
      console.log(`Successfully fetched photo with ID: ${id}`);
      return photo;
    } catch (error) {
      console.error(`Error fetching photo with ID ${id}:`, error);
      return undefined;
    }
  }

  async deletePhoto(id: number): Promise<boolean> {
    await db.delete(schema.photos).where(eq(schema.photos.id, id));
    return true;
  }

  async getPhotosByReportId(reportId: number) {
    try {
      console.log(`Getting photos for report ID: ${reportId}`);
      const photos = await db.select().from(schema.photos).where(eq(schema.photos.reportId, reportId));
      console.log(`Found ${photos.length} photos for report ID: ${reportId}`);
      return photos;
    } catch (error) {
      console.error(`Error in getPhotosByReportId:`, error);
      // Return empty array instead of throwing an error
      return [];
    }
  }
  
  // Alias for getPhotosByReportId to match storage interface
  async getPhotosByReport(reportId: number) {
    try {
      console.log(`Using getPhotosByReport for report ID: ${reportId}`);
      return this.getPhotosByReportId(reportId);
    } catch (error) {
      console.error(`Error in getPhotosByReport:`, error);
      // Return empty array instead of throwing an error
      return [];
    }
  }
  
  // Add updatePhoto method
  async updatePhoto(id: number, photoData: Partial<schema.InsertPhoto>) {
    const [updatedPhoto] = await db
      .update(schema.photos)
      .set(photoData)
      .where(eq(schema.photos.id, id))
      .returning();
    return updatedPhoto;
  }

  // Sketch methods
  async createSketch(sketchData: schema.InsertSketch) {
    const [sketch] = await db.insert(schema.sketches).values(sketchData).returning();
    return sketch;
  }

  async getSketch(id: number) {
    const [sketch] = await db.select().from(schema.sketches).where(eq(schema.sketches.id, id));
    return sketch;
  }

  async updateSketch(id: number, sketchData: Partial<schema.InsertSketch>) {
    const [updatedSketch] = await db
      .update(schema.sketches)
      .set(sketchData)
      .where(eq(schema.sketches.id, id))
      .returning();
    return updatedSketch;
  }

  async deleteSketch(id: number): Promise<boolean> {
    await db.delete(schema.sketches).where(eq(schema.sketches.id, id));
    return true;
  }

  async getSketchesByReportId(reportId: number) {
    try {
      console.log(`Fetching sketches for report ID: ${reportId}`);
      // Only select columns that exist in the database
      const sketches = await db.select({
        id: schema.sketches.id,
        reportId: schema.sketches.reportId,
        // Add other fields that exist in the database and comment out those that don't
        // title: schema.sketches.title,
        // description: schema.sketches.description,
        // sketchUrl: schema.sketches.sketchUrl,
        // sketchData: schema.sketches.sketchData,
        // sketchType: schema.sketches.sketchType,
        // squareFootage: schema.sketches.squareFootage,
        // scale: schema.sketches.scale,
        // notes: schema.sketches.notes,
        createdAt: schema.sketches.createdAt,
        updatedAt: schema.sketches.updatedAt
      }).from(schema.sketches).where(eq(schema.sketches.reportId, reportId));
      
      console.log(`Found ${sketches.length} sketches for report ID: ${reportId}`);
      return sketches;
    } catch (error) {
      console.error(`Error fetching sketches for report ID ${reportId}:`, error);
      // Return empty array instead of throwing an error
      return [];
    }
  }

  // Compliance check methods
  async createComplianceCheck(checkData: schema.InsertComplianceCheck) {
    const [check] = await db.insert(schema.complianceChecks).values(checkData).returning();
    return check;
  }

  async getComplianceCheck(id: number) {
    const [check] = await db.select().from(schema.complianceChecks).where(eq(schema.complianceChecks.id, id));
    return check;
  }

  async deleteComplianceCheck(id: number): Promise<boolean> {
    await db.delete(schema.complianceChecks).where(eq(schema.complianceChecks.id, id));
    return true;
  }

  async getComplianceChecksByReportId(reportId: number) {
    try {
      console.log(`Fetching compliance checks for report ID: ${reportId}`);
      
      // Check if complianceChecks table exists before querying
      try {
        // Only select columns that exist in the database
        const checks = await db.select({
          id: schema.complianceChecks.id,
          reportId: schema.complianceChecks.reportId,
          // Use proper column names from the database, comment out those that don't exist
          checkType: schema.complianceChecks.checkType,
          // status: schema.complianceChecks.status, // Might be named differently in the database
          severity: schema.complianceChecks.severity,
          // message: schema.complianceChecks.message, // Might be description in the database
          description: schema.complianceChecks.description,
          details: schema.complianceChecks.details,
          rule: schema.complianceChecks.rule,
          recommendation: schema.complianceChecks.recommendation,
          checkResult: schema.complianceChecks.checkResult,
          // field: schema.complianceChecks.field, // Might not exist in the database
          createdAt: schema.complianceChecks.createdAt
        }).from(schema.complianceChecks).where(eq(schema.complianceChecks.reportId, reportId));
        
        console.log(`Found ${checks.length} compliance checks for report ID: ${reportId}`);
        return checks;
      } catch (innerError) {
        console.error(`Error executing database query for compliance checks:`, innerError);
        // Return empty array instead of throwing an error
        return [];
      }
    } catch (error) {
      console.error(`Error fetching compliance checks for report ID ${reportId}:`, error);
      // Return empty array instead of throwing an error
      return [];
    }
  }

  // Adjustment model methods
  async createAdjustmentModel(modelData: schema.InsertAdjustmentModel) {
    const [model] = await db.insert(schema.adjustmentModels).values(modelData).returning();
    return model;
  }

  async getAdjustmentModel(id: number) {
    const [model] = await db.select().from(schema.adjustmentModels).where(eq(schema.adjustmentModels.id, id));
    return model;
  }

  async updateAdjustmentModel(id: number, modelData: Partial<schema.InsertAdjustmentModel>) {
    const [updatedModel] = await db
      .update(schema.adjustmentModels)
      .set(modelData)
      .where(eq(schema.adjustmentModels.id, id))
      .returning();
    return updatedModel;
  }

  async deleteAdjustmentModel(id: number) {
    await db.delete(schema.adjustmentModels).where(eq(schema.adjustmentModels.id, id));
  }

  async getAdjustmentModelsByReportId(reportId: number) {
    return await db.select().from(schema.adjustmentModels).where(eq(schema.adjustmentModels.reportId, reportId));
  }

  // Model adjustment methods
  async createModelAdjustment(adjustmentData: schema.InsertModelAdjustment) {
    const [adjustment] = await db.insert(schema.modelAdjustments).values(adjustmentData).returning();
    return adjustment;
  }

  async getModelAdjustment(id: number) {
    const [adjustment] = await db.select().from(schema.modelAdjustments).where(eq(schema.modelAdjustments.id, id));
    return adjustment;
  }

  async updateModelAdjustment(id: number, adjustmentData: Partial<schema.InsertModelAdjustment>) {
    const [updatedAdjustment] = await db
      .update(schema.modelAdjustments)
      .set(adjustmentData)
      .where(eq(schema.modelAdjustments.id, id))
      .returning();
    return updatedAdjustment;
  }

  async deleteModelAdjustment(id: number) {
    await db.delete(schema.modelAdjustments).where(eq(schema.modelAdjustments.id, id));
  }

  async getModelAdjustmentsByModelId(modelId: number) {
    return await db.select().from(schema.modelAdjustments).where(eq(schema.modelAdjustments.modelId, modelId));
  }

  async getModelAdjustmentsByComparableId(comparableId: number) {
    return await db.select().from(schema.modelAdjustments).where(eq(schema.modelAdjustments.comparableId, comparableId));
  }

  // File import methods
  async createFileImportResult(importData: InsertFileImportResult): Promise<FileImportResult> {
    const [result] = await db.insert(schema.fileImportResults).values(importData).returning();
    return result;
  }

  async getFileImportResult(id: string): Promise<FileImportResult | undefined> {
    const [result] = await db.select().from(schema.fileImportResults).where(eq(schema.fileImportResults.id, id));
    return result;
  }

  async updateFileImportResult(id: string, updateData: FileImportResultUpdate): Promise<FileImportResult> {
    const [result] = await db
      .update(schema.fileImportResults)
      .set(updateData)
      .where(eq(schema.fileImportResults.id, id))
      .returning();
    return result;
  }

  async getFileImportResults(limit?: number, offset?: number): Promise<FileImportResult[]> {
    let query = db.select().from(schema.fileImportResults).orderBy(schema.fileImportResults.dateImported);
    
    if (limit !== undefined) {
      query = query.limit(limit);
    }
    
    if (offset !== undefined) {
      query = query.offset(offset);
    }
    
    return await query;
  }
  
  async getFileImportResultsByUserId(userId: number): Promise<FileImportResult[]> {
    return await db
      .select()
      .from(schema.fileImportResults)
      .where(eq(schema.fileImportResults.userId, userId))
      .orderBy(schema.fileImportResults.dateImported);
  }

  // RealEstateTerm methods
  async getRealEstateTerm(id: number): Promise<schema.RealEstateTerm | undefined> {
    const [term] = await db
      .select()
      .from(schema.realEstateTerms)
      .where(eq(schema.realEstateTerms.id, id));
    return term;
  }

  async getRealEstateTermByName(term: string): Promise<schema.RealEstateTerm | undefined> {
    const [result] = await db
      .select()
      .from(schema.realEstateTerms)
      .where(eq(schema.realEstateTerms.term, term));
    return result;
  }

  async getAllRealEstateTerms(): Promise<schema.RealEstateTerm[]> {
    return await db
      .select()
      .from(schema.realEstateTerms)
      .orderBy(schema.realEstateTerms.term);
  }

  async getRealEstateTermsByCategory(category: string): Promise<schema.RealEstateTerm[]> {
    return await db
      .select()
      .from(schema.realEstateTerms)
      .where(eq(schema.realEstateTerms.category, category))
      .orderBy(schema.realEstateTerms.term);
  }

  async getTermsByNames(termNames: string[]): Promise<schema.RealEstateTerm[]> {
    // Using an 'in' condition with drizzle
    return await db
      .select()
      .from(schema.realEstateTerms)
      .where(schema.realEstateTerms.term.in(termNames));
  }

  async createRealEstateTerm(termData: schema.InsertRealEstateTerm): Promise<schema.RealEstateTerm> {
    const [term] = await db
      .insert(schema.realEstateTerms)
      .values(termData)
      .returning();
    return term;
  }

  async updateRealEstateTerm(id: number, termData: Partial<schema.InsertRealEstateTerm>): Promise<schema.RealEstateTerm | undefined> {
    const [updatedTerm] = await db
      .update(schema.realEstateTerms)
      .set(termData)
      .where(eq(schema.realEstateTerms.id, id))
      .returning();
    return updatedTerm;
  }

  async deleteRealEstateTerm(id: number): Promise<boolean> {
    await db.delete(schema.realEstateTerms).where(eq(schema.realEstateTerms.id, id));
    return true;
  }
  
  // Alias methods to maintain compatibility with existing code
  async getPropertiesByUser(userId: number) {
    return this.getPropertiesByUserId(userId);
  }
  
  async getAppraisalReportsByUser(userId: number) {
    return this.getAppraisalReportsByUserId(userId);
  }
  
  async getAppraisalReportsByProperty(propertyId: number) {
    return this.getAppraisalReportsByPropertyId(propertyId);
  }
  
  async getComparablesByReport(reportId: number) {
    return this.getComparablesByReportId(reportId);
  }
  
  async getAdjustmentsByComparable(comparableId: number) {
    return this.getAdjustmentsByComparableId(comparableId);
  }
  
  async getSketchesByReport(reportId: number) {
    return this.getSketchesByReportId(reportId);
  }
  
  async getComplianceChecksByReport(reportId: number) {
    return this.getComplianceChecksByReportId(reportId);
  }
  
  async getAdjustmentModelsByReport(reportId: number) {
    return this.getAdjustmentModelsByReportId(reportId);
  }
  
  async getModelAdjustmentsByModel(modelId: number) {
    return this.getModelAdjustmentsByModelId(modelId);
  }
  
  async getModelAdjustmentsByComparable(comparableId: number, modelId?: number) {
    if (modelId !== undefined) {
      return await db
        .select()
        .from(schema.modelAdjustments)
        .where(eq(schema.modelAdjustments.comparableId, comparableId))
        .where(eq(schema.modelAdjustments.modelId, modelId));
    }
    return this.getModelAdjustmentsByComparableId(comparableId);
  }
  
  // Delete file import - stub for IStorage interface
  async deleteFileImportResult(id: string): Promise<boolean> {
    await db.delete(schema.fileImportResults).where(eq(schema.fileImportResults.id, id));
    return true;
  }
  
  // Save import result - stub for IStorage interface
  async saveImportResult(result: InsertFileImportResult): Promise<FileImportResult> {
    return this.createFileImportResult(result);
  }
  
  // Property address search for imports
  async getPropertiesByAddress(address: string, city: string, state: string): Promise<schema.Property[]> {
    return await db
      .select()
      .from(schema.properties)
      .where(eq(schema.properties.address, address))
      .where(eq(schema.properties.city, city))
      .where(eq(schema.properties.state, state));
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    try {
      console.log(`Fetching order with ID: ${id}`);
      
      // Use raw SQL to ensure proper column names are used
      const query = `
        SELECT *
        FROM "orders"
        WHERE "id" = $1
      `;
      
      const result = await db.execute(query, [id]);
      const order = result[0];
      
      if (!order) {
        console.log(`No order found with ID: ${id}`);
        return undefined;
      }
      
      console.log(`Successfully fetched order with ID: ${id}`);
      return order;
    } catch (error) {
      console.error(`Error fetching order with ID ${id}:`, error);
      return undefined;
    }
  }

  async getOrders(): Promise<Order[]> {
    try {
      console.log('Fetching all orders');
      
      // Use raw SQL to ensure proper column names are used
      const query = `
        SELECT *
        FROM "orders"
        ORDER BY "created_at" DESC
      `;
      
      const orders = await db.execute(query);
      console.log(`Successfully fetched ${orders.length} orders`);
      return orders;
    } catch (error) {
      console.error('Error fetching all orders:', error);
      return [];
    }
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    try {
      console.log(`Fetching orders for user ID: ${userId}`);
      
      // Use raw SQL to ensure proper column names are used
      const query = `
        SELECT *
        FROM "orders"
        WHERE "user_id" = $1
        ORDER BY "created_at" DESC
      `;
      
      const orders = await db.execute(query, [userId]);
      console.log(`Successfully fetched ${orders.length} orders for user ID: ${userId}`);
      return orders;
    } catch (error) {
      console.error(`Error fetching orders for user ID ${userId}:`, error);
      return [];
    }
  }

  async getOrdersByProperty(propertyId: number): Promise<Order[]> {
    try {
      console.log(`Fetching orders for property ID: ${propertyId}`);
      
      // Use raw SQL to ensure proper column names are used
      const query = `
        SELECT *
        FROM "orders"
        WHERE "property_id" = $1
        ORDER BY "created_at" DESC
      `;
      
      const orders = await db.execute(query, [propertyId]);
      console.log(`Successfully fetched ${orders.length} orders for property ID: ${propertyId}`);
      return orders;
    } catch (error) {
      console.error(`Error fetching orders for property ID ${propertyId}:`, error);
      return [];
    }
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    try {
      console.log(`Fetching orders with status: ${status}`);
      
      // Use raw SQL to ensure proper column names are used
      const query = `
        SELECT *
        FROM "orders"
        WHERE LOWER("status"::text) = LOWER($1)
        ORDER BY "created_at" DESC
      `;
      
      const orders = await db.execute(query, [status]);
      console.log(`Successfully fetched ${orders.length} orders with status: ${status}`);
      return orders;
    } catch (error) {
      console.error(`Error fetching orders with status ${status}:`, error);
      return [];
    }
  }

  async getOrdersByType(type: string): Promise<Order[]> {
    try {
      console.log(`Fetching orders with type: ${type}`);
      
      // Use raw SQL to ensure proper column names are used
      const query = `
        SELECT *
        FROM "orders"
        WHERE LOWER("order_type"::text) = LOWER($1)
        ORDER BY "created_at" DESC
      `;
      
      const orders = await db.execute(query, [type]);
      console.log(`Successfully fetched ${orders.length} orders with type: ${type}`);
      return orders;
    } catch (error) {
      console.error(`Error fetching orders with type ${type}:`, error);
      return [];
    }
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    try {
      console.log('Creating new order:', order);
      
      // Use parameterized query with explicit column names that match the DB
      const query = `
        INSERT INTO "orders" (
          "user_id", 
          "property_id", 
          "order_type", 
          "status", 
          "priority", 
          "due_date", 
          "notes"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        )
        RETURNING *
      `;
      
      // The column name for status in the database is "status", but it's representing the orderStatusEnum
      // Ensure all values are properly formatted for database
      const priority = order.priority || 'medium'; // Default to 'medium' if not specified
      const status = order.status || 'pending'; // Default to 'pending' if not specified
      
      const params = [
        order.userId,
        order.propertyId,
        order.orderType,
        status,
        priority,
        order.dueDate || null,
        order.notes || null
      ];
      
      console.log('Executing query with params:', params);
      
      // Execute the query with the values array
      const result = await db.execute(query, params);
      
      // Handle empty result
      if (!result || !result.rows || result.rows.length === 0) {
        throw new Error('No order was created');
      }
      
      const createdOrder = result.rows[0];
      console.log('Order created successfully:', createdOrder);
      return createdOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error; // Rethrow to allow proper error handling in the route
    }
  }

  async updateOrder(id: number, orderData: Partial<InsertOrder>): Promise<Order | undefined> {
    try {
      console.log(`Updating order with ID: ${id}`);
      
      // Prepare SET clause parts for the SQL query
      const setClauses = [];
      const values = [];
      let paramIndex = 1;
      
      // Always update the updated_at field
      setClauses.push(`"updated_at" = NOW()`);
      
      // Add other fields that need to be updated
      // Only include fields that exist in the database based on our schema check
      if (orderData.userId !== undefined) {
        setClauses.push(`"user_id" = $${paramIndex++}`);
        values.push(orderData.userId);
      }
      
      if (orderData.propertyId !== undefined) {
        setClauses.push(`"property_id" = $${paramIndex++}`);
        values.push(orderData.propertyId);
      }
      
      if (orderData.orderType !== undefined) {
        setClauses.push(`"order_type" = $${paramIndex++}`);
        values.push(orderData.orderType);
      }
      
      if (orderData.status !== undefined) {
        setClauses.push(`"status" = $${paramIndex++}`);
        values.push(orderData.status);
      }
      
      if (orderData.priority !== undefined) {
        setClauses.push(`"priority" = $${paramIndex++}`);
        values.push(orderData.priority);
      }
      
      if (orderData.dueDate !== undefined) {
        setClauses.push(`"due_date" = $${paramIndex++}`);
        values.push(orderData.dueDate);
      }
      
      if (orderData.notes !== undefined) {
        setClauses.push(`"notes" = $${paramIndex++}`);
        values.push(orderData.notes);
      }
      
      // Skip fields that don't exist in the database
      // assignedTo and totalFee are not present in the actual database schema
      
      // If no fields to update, return existing record
      if (setClauses.length <= 1) { // Only updated_at
        const query = `
          SELECT *
          FROM "orders"
          WHERE "id" = $1
        `;
        const result = await db.execute(query, [id]);
        return result[0];
      }
      
      // Build and execute the SQL update query
      const query = `
        UPDATE "orders"
        SET ${setClauses.join(', ')}
        WHERE "id" = $${paramIndex}
        RETURNING *
      `;
      
      values.push(id);
      const result = await db.execute(query, values);
      
      // Check if results were returned
      if (!result || result.length === 0) {
        console.log(`No order found with ID: ${id} to update`);
        return undefined;
      }
      
      const updatedOrder = result[0];
      
      console.log('Order updated successfully:', updatedOrder);
      return updatedOrder;
    } catch (error) {
      console.error(`Error updating order with ID ${id}:`, error);
      return undefined;
    }
  }

  async updateOrderStatus(id: number, status: string, notes?: string): Promise<Order | undefined> {
    try {
      console.log(`Updating status of order with ID: ${id} to ${status}`);
      
      // Prepare SET clause parts for the SQL query
      const setClauses = [];
      const values = [];
      let paramIndex = 1;
      
      // Always update status and updated_at fields
      setClauses.push(`"status" = $${paramIndex++}`);
      values.push(status);
      
      setClauses.push(`"updated_at" = NOW()`);
      
      // Add notes if provided
      if (notes) {
        setClauses.push(`"notes" = $${paramIndex++}`);
        values.push(notes);
      }
      
      // Build and execute the SQL update query
      const query = `
        UPDATE "orders"
        SET ${setClauses.join(', ')}
        WHERE "id" = $${paramIndex}
        RETURNING *
      `;
      
      values.push(id);
      const result = await db.execute(query, values);
      
      // Check if results were returned
      if (!result || result.length === 0) {
        console.log(`No order found with ID: ${id} to update status`);
        return undefined;
      }
      
      const updatedOrder = result[0];
      
      console.log('Order status updated successfully:', updatedOrder);
      return updatedOrder;
    } catch (error) {
      console.error(`Error updating status of order with ID ${id}:`, error);
      return undefined;
    }
  }

  async deleteOrder(id: number): Promise<boolean> {
    try {
      console.log(`Deleting order with ID: ${id}`);
      
      // Use raw SQL for the delete operation
      const query = `
        DELETE FROM "orders"
        WHERE "id" = $1
      `;
      
      await db.execute(query, [id]);
      console.log(`Order with ID: ${id} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`Error deleting order with ID ${id}:`, error);
      return false;
    }
  }
}