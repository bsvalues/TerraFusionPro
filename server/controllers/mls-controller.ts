/**
 * MLS Controller
 * Handles API endpoints for MLS integration
 */
import { Request, Response } from 'express';
import { db } from '../db';
import { mlsSystems, mlsFieldMappings, mlsPropertyMappings, mlsComparableMappings } from '@shared/schema';
import { MlsService } from '../services/mls-service';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Create an instance of the MLS service for handling connections and data sync
const mlsService = new MlsService();

/**
 * Get all MLS systems
 */
export async function getMlsSystems(req: Request, res: Response) {
  try {
    const systems = await db.select().from(mlsSystems);
    return res.status(200).json(systems);
  } catch (error) {
    console.error('Error fetching MLS systems:', error);
    return res.status(500).json({ error: 'Failed to fetch MLS systems' });
  }
}

/**
 * Get a specific MLS system by ID
 */
export async function getMlsSystem(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid MLS system ID' });
    }
    
    const [system] = await db.select().from(mlsSystems).where(eq(mlsSystems.id, id));
    
    if (!system) {
      return res.status(404).json({ error: 'MLS system not found' });
    }
    
    return res.status(200).json(system);
  } catch (error) {
    console.error('Error fetching MLS system:', error);
    return res.status(500).json({ error: 'Failed to fetch MLS system' });
  }
}

/**
 * Create a new MLS system
 */
export async function createMlsSystem(req: Request, res: Response) {
  try {
    const systemSchema = z.object({
      name: z.string().min(1),
      systemType: z.enum(['RETS', 'Web API', 'IDX', 'Custom']),
      url: z.string().url(),
      username: z.string().optional(),
      password: z.string().optional(),
      apiKey: z.string().optional(),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      version: z.string().optional(),
      userAgent: z.string().optional(),
      isActive: z.boolean().default(true),
      metadata: z.record(z.any()).optional(),
    });

    const validatedData = systemSchema.parse(req.body);
    const [newSystem] = await db.insert(mlsSystems).values(validatedData).returning();
    
    return res.status(201).json(newSystem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating MLS system:', error);
    return res.status(500).json({ error: 'Failed to create MLS system' });
  }
}

/**
 * Update an existing MLS system
 */
export async function updateMlsSystem(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid MLS system ID' });
    }
    
    const systemSchema = z.object({
      name: z.string().min(1).optional(),
      systemType: z.enum(['RETS', 'Web API', 'IDX', 'Custom']).optional(),
      url: z.string().url().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      apiKey: z.string().optional(),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      version: z.string().optional(),
      userAgent: z.string().optional(),
      isActive: z.boolean().optional(),
      metadata: z.record(z.any()).optional(),
    });

    const validatedData = systemSchema.parse(req.body);
    
    const [updatedSystem] = await db
      .update(mlsSystems)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(eq(mlsSystems.id, id))
      .returning();
    
    if (!updatedSystem) {
      return res.status(404).json({ error: 'MLS system not found' });
    }
    
    return res.status(200).json(updatedSystem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error updating MLS system:', error);
    return res.status(500).json({ error: 'Failed to update MLS system' });
  }
}

/**
 * Delete an MLS system
 */
export async function deleteMlsSystem(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid MLS system ID' });
    }
    
    const [system] = await db.select().from(mlsSystems).where(eq(mlsSystems.id, id));
    
    if (!system) {
      return res.status(404).json({ error: 'MLS system not found' });
    }
    
    // Delete any related data (mappings, etc.)
    await db.delete(mlsFieldMappings).where(eq(mlsFieldMappings.mlsSystemId, id));
    await db.delete(mlsPropertyMappings).where(eq(mlsPropertyMappings.mlsSystemId, id));
    await db.delete(mlsComparableMappings).where(eq(mlsComparableMappings.mlsSystemId, id));
    
    // Now delete the system itself
    await db.delete(mlsSystems).where(eq(mlsSystems.id, id));
    
    return res.status(204).end();
  } catch (error) {
    console.error('Error deleting MLS system:', error);
    return res.status(500).json({ error: 'Failed to delete MLS system' });
  }
}

/**
 * Test connection to an MLS system
 */
export async function testMlsConnection(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid MLS system ID' });
    }
    
    const [system] = await db.select().from(mlsSystems).where(eq(mlsSystems.id, id));
    
    if (!system) {
      return res.status(404).json({ error: 'MLS system not found' });
    }
    
    // Test the connection using the MLS service
    const isConnected = await mlsService.authenticate(id);
    
    if (isConnected) {
      return res.status(200).json({ status: 'success', message: 'Successfully connected to MLS system' });
    } else {
      return res.status(400).json({ status: 'failed', message: 'Failed to connect to MLS system' });
    }
  } catch (error) {
    console.error('Error testing MLS connection:', error);
    return res.status(500).json({ error: 'Failed to test MLS connection' });
  }
}

/**
 * Search for properties in the MLS
 */
export async function searchMlsProperties(req: Request, res: Response) {
  try {
    const id = parseInt(req.body.mlsSystemId, 10);
    const searchCriteria = req.body.searchCriteria;
    
    if (isNaN(id) || !searchCriteria) {
      return res.status(400).json({ error: 'Invalid MLS system ID or missing search criteria' });
    }
    
    const [system] = await db.select().from(mlsSystems).where(eq(mlsSystems.id, id));
    
    if (!system) {
      return res.status(404).json({ error: 'MLS system not found' });
    }
    
    // Search properties using the MLS service
    const properties = await mlsService.searchProperties(id, searchCriteria);
    
    return res.status(200).json(properties);
  } catch (error) {
    console.error('Error searching MLS properties:', error);
    return res.status(500).json({ error: 'Failed to search MLS properties' });
  }
}

/**
 * Import a property from the MLS
 */
export async function importMlsProperty(req: Request, res: Response) {
  try {
    const { mlsSystemId, mlsNumber, propertyType } = req.body;
    
    if (!mlsSystemId || !mlsNumber || !propertyType) {
      return res.status(400).json({ error: 'Missing required fields: mlsSystemId, mlsNumber, propertyType' });
    }
    
    const id = parseInt(mlsSystemId, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid MLS system ID' });
    }
    
    const [system] = await db.select().from(mlsSystems).where(eq(mlsSystems.id, id));
    
    if (!system) {
      return res.status(404).json({ error: 'MLS system not found' });
    }
    
    // Search for the specified property by MLS number
    const properties = await mlsService.searchProperties(id, { mlsNumber });
    
    if (!properties || properties.length === 0) {
      return res.status(404).json({ error: 'Property not found in MLS' });
    }
    
    // Import/save the property using the MLS service
    const savedProperty = await mlsService.savePropertyFromMls(id, properties[0], req.body.userId);
    
    return res.status(201).json(savedProperty);
  } catch (error) {
    console.error('Error importing MLS property:', error);
    return res.status(500).json({ error: 'Failed to import MLS property' });
  }
}

/**
 * Get field mappings for an MLS system
 */
export async function getFieldMappings(req: Request, res: Response) {
  try {
    const mlsSystemId = parseInt(req.query.mlsSystemId as string, 10);
    const category = req.query.category as string;
    
    if (isNaN(mlsSystemId)) {
      return res.status(400).json({ error: 'Invalid MLS system ID' });
    }
    
    let query = db.select().from(mlsFieldMappings);
    
    if (mlsSystemId) {
      if (category) {
        query = db.select().from(mlsFieldMappings)
          .where(and(
            eq(mlsFieldMappings.mlsSystemId, mlsSystemId),
            eq(mlsFieldMappings.category, category)
          ));
      } else {
        query = db.select().from(mlsFieldMappings)
          .where(eq(mlsFieldMappings.mlsSystemId, mlsSystemId));
      }
    }
    
    const mappings = await query;
    return res.status(200).json(mappings);
  } catch (error) {
    console.error('Error fetching field mappings:', error);
    return res.status(500).json({ error: 'Failed to fetch field mappings' });
  }
}

/**
 * Create a new field mapping
 */
export async function createFieldMapping(req: Request, res: Response) {
  try {
    const mappingSchema = z.object({
      mlsSystemId: z.number(),
      mlsField: z.string(),
      appField: z.string(),
      category: z.string(),
      dataType: z.string(),
      mappingType: z.string().optional(),
      transformationFunction: z.string().optional(),
      isRequired: z.boolean().default(false),
      metadata: z.record(z.any()).optional(),
    });

    const validatedData = mappingSchema.parse(req.body);
    
    // Check if mapping with same fields already exists
    const existingMappings = await db.select()
      .from(mlsFieldMappings)
      .where(
        and(
          eq(mlsFieldMappings.mlsSystemId, validatedData.mlsSystemId),
          eq(mlsFieldMappings.mlsField, validatedData.mlsField),
          eq(mlsFieldMappings.appField, validatedData.appField)
        )
      );
    
    if (existingMappings.length > 0) {
      return res.status(409).json({ error: 'Mapping already exists for these fields' });
    }
    
    const [newMapping] = await db.insert(mlsFieldMappings).values(validatedData).returning();
    
    return res.status(201).json(newMapping);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating field mapping:', error);
    return res.status(500).json({ error: 'Failed to create field mapping' });
  }
}

/**
 * Update an existing field mapping
 */
export async function updateFieldMapping(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid field mapping ID' });
    }
    
    const mappingSchema = z.object({
      mlsField: z.string().optional(),
      appField: z.string().optional(),
      category: z.string().optional(),
      dataType: z.string().optional(),
      mappingType: z.string().optional(),
      transformationFunction: z.string().optional(),
      isRequired: z.boolean().optional(),
      metadata: z.record(z.any()).optional(),
    });

    const validatedData = mappingSchema.parse(req.body);
    
    const [updatedMapping] = await db
      .update(mlsFieldMappings)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(eq(mlsFieldMappings.id, id))
      .returning();
    
    if (!updatedMapping) {
      return res.status(404).json({ error: 'Field mapping not found' });
    }
    
    return res.status(200).json(updatedMapping);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error updating field mapping:', error);
    return res.status(500).json({ error: 'Failed to update field mapping' });
  }
}

/**
 * Delete a field mapping
 */
export async function deleteFieldMapping(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid field mapping ID' });
    }
    
    const [mapping] = await db.select().from(mlsFieldMappings).where(eq(mlsFieldMappings.id, id));
    
    if (!mapping) {
      return res.status(404).json({ error: 'Field mapping not found' });
    }
    
    await db.delete(mlsFieldMappings).where(eq(mlsFieldMappings.id, id));
    
    return res.status(204).end();
  } catch (error) {
    console.error('Error deleting field mapping:', error);
    return res.status(500).json({ error: 'Failed to delete field mapping' });
  }
}