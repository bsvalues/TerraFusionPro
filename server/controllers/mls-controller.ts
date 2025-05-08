/**
 * MLS Controller
 * Handles API endpoints for MLS integration
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { MlsService } from '../services/mls-service';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { 
  mlsSystems, mlsPropertyMappings, mlsFieldMappings, publicRecordSources, 
  publicRecordMappings, insertMlsSystemSchema, insertMlsFieldMappingSchema 
} from '@shared/schema';

// Initialize MLS service
const mlsService = new MlsService();

// Get all MLS systems
export async function getMlsSystems(req: Request, res: Response) {
  try {
    const systems = await db
      .select()
      .from(mlsSystems);
    
    res.json(systems);
  } catch (error) {
    console.error('Error fetching MLS systems:', error);
    res.status(500).json({ message: 'Error fetching MLS systems' });
  }
}

// Get a specific MLS system
export async function getMlsSystem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const systemId = parseInt(id);
    
    if (isNaN(systemId)) {
      return res.status(400).json({ message: 'Invalid MLS system ID' });
    }
    
    const [system] = await db
      .select()
      .from(mlsSystems)
      .where(eq(mlsSystems.id, systemId));
    
    if (!system) {
      return res.status(404).json({ message: 'MLS system not found' });
    }
    
    res.json(system);
  } catch (error) {
    console.error('Error fetching MLS system:', error);
    res.status(500).json({ message: 'Error fetching MLS system' });
  }
}

// Create a new MLS system
export async function createMlsSystem(req: Request, res: Response) {
  try {
    const validationResult = insertMlsSystemSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid MLS system data', 
        errors: validationResult.error.errors 
      });
    }
    
    const [newSystem] = await db
      .insert(mlsSystems)
      .values({
        ...validationResult.data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    res.status(201).json(newSystem);
  } catch (error) {
    console.error('Error creating MLS system:', error);
    res.status(500).json({ message: 'Error creating MLS system' });
  }
}

// Update an MLS system
export async function updateMlsSystem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const systemId = parseInt(id);
    
    if (isNaN(systemId)) {
      return res.status(400).json({ message: 'Invalid MLS system ID' });
    }
    
    const validationResult = insertMlsSystemSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid MLS system data', 
        errors: validationResult.error.errors 
      });
    }
    
    const [existingSystem] = await db
      .select()
      .from(mlsSystems)
      .where(eq(mlsSystems.id, systemId));
    
    if (!existingSystem) {
      return res.status(404).json({ message: 'MLS system not found' });
    }
    
    const [updatedSystem] = await db
      .update(mlsSystems)
      .set({
        ...validationResult.data,
        updatedAt: new Date()
      })
      .where(eq(mlsSystems.id, systemId))
      .returning();
    
    res.json(updatedSystem);
  } catch (error) {
    console.error('Error updating MLS system:', error);
    res.status(500).json({ message: 'Error updating MLS system' });
  }
}

// Delete an MLS system
export async function deleteMlsSystem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const systemId = parseInt(id);
    
    if (isNaN(systemId)) {
      return res.status(400).json({ message: 'Invalid MLS system ID' });
    }
    
    // Check if system exists
    const [existingSystem] = await db
      .select()
      .from(mlsSystems)
      .where(eq(mlsSystems.id, systemId));
    
    if (!existingSystem) {
      return res.status(404).json({ message: 'MLS system not found' });
    }
    
    // Check for any dependent records
    const propertyMappings = await db
      .select()
      .from(mlsPropertyMappings)
      .where(eq(mlsPropertyMappings.mlsSystemId, systemId));
    
    if (propertyMappings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete MLS system with existing property mappings',
        count: propertyMappings.length
      });
    }
    
    // Delete field mappings first (foreign key constraint)
    await db
      .delete(mlsFieldMappings)
      .where(eq(mlsFieldMappings.mlsSystemId, systemId));
    
    // Delete the system
    await db
      .delete(mlsSystems)
      .where(eq(mlsSystems.id, systemId));
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting MLS system:', error);
    res.status(500).json({ message: 'Error deleting MLS system' });
  }
}

// Test MLS connection
export async function testMlsConnection(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const systemId = parseInt(id);
    
    if (isNaN(systemId)) {
      return res.status(400).json({ message: 'Invalid MLS system ID' });
    }
    
    const success = await mlsService.authenticate(systemId);
    
    if (success) {
      res.json({ success: true, message: 'Successfully connected to MLS system' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to connect to MLS system' });
    }
  } catch (error) {
    console.error('Error testing MLS connection:', error);
    res.status(500).json({ message: 'Error testing MLS connection' });
  }
}

// Search MLS properties
export async function searchMlsProperties(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const systemId = parseInt(id);
    
    if (isNaN(systemId)) {
      return res.status(400).json({ message: 'Invalid MLS system ID' });
    }
    
    // Validate search criteria
    const searchSchema = z.object({
      criteria: z.record(z.any())
    });
    
    const validationResult = searchSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid search criteria', 
        errors: validationResult.error.errors 
      });
    }
    
    const results = await mlsService.searchProperties(systemId, validationResult.data.criteria);
    res.json(results);
  } catch (error) {
    console.error('Error searching MLS properties:', error);
    res.status(500).json({ message: 'Error searching MLS properties' });
  }
}

// Import a property from MLS
export async function importMlsProperty(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const systemId = parseInt(id);
    
    if (isNaN(systemId)) {
      return res.status(400).json({ message: 'Invalid MLS system ID' });
    }
    
    // Validate import data
    const importSchema = z.object({
      mlsNumber: z.string(),
      propertyData: z.record(z.any())
    });
    
    const validationResult = importSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid property data', 
        errors: validationResult.error.errors 
      });
    }
    
    const { mlsNumber, propertyData } = validationResult.data;
    
    const propertyId = await mlsService.savePropertyFromMls(systemId, mlsNumber, propertyData);
    
    res.json({ 
      success: true, 
      message: 'Property imported successfully',
      propertyId
    });
  } catch (error) {
    console.error('Error importing MLS property:', error);
    res.status(500).json({ message: 'Error importing MLS property' });
  }
}

// Get field mappings for an MLS system
export async function getFieldMappings(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const systemId = parseInt(id);
    
    if (isNaN(systemId)) {
      return res.status(400).json({ message: 'Invalid MLS system ID' });
    }
    
    const mappings = await db
      .select()
      .from(mlsFieldMappings)
      .where(eq(mlsFieldMappings.mlsSystemId, systemId));
    
    res.json(mappings);
  } catch (error) {
    console.error('Error fetching field mappings:', error);
    res.status(500).json({ message: 'Error fetching field mappings' });
  }
}

// Create a field mapping
export async function createFieldMapping(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const systemId = parseInt(id);
    
    if (isNaN(systemId)) {
      return res.status(400).json({ message: 'Invalid MLS system ID' });
    }
    
    // Check if the MLS system exists
    const [system] = await db
      .select()
      .from(mlsSystems)
      .where(eq(mlsSystems.id, systemId));
    
    if (!system) {
      return res.status(404).json({ message: 'MLS system not found' });
    }
    
    const validationResult = insertMlsFieldMappingSchema.safeParse({
      ...req.body,
      mlsSystemId: systemId
    });
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid field mapping data', 
        errors: validationResult.error.errors 
      });
    }
    
    const [newMapping] = await db
      .insert(mlsFieldMappings)
      .values({
        ...validationResult.data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    res.status(201).json(newMapping);
  } catch (error) {
    console.error('Error creating field mapping:', error);
    res.status(500).json({ message: 'Error creating field mapping' });
  }
}

// Update a field mapping
export async function updateFieldMapping(req: Request, res: Response) {
  try {
    const { id, mappingId } = req.params;
    const systemId = parseInt(id);
    const fieldMappingId = parseInt(mappingId);
    
    if (isNaN(systemId) || isNaN(fieldMappingId)) {
      return res.status(400).json({ message: 'Invalid IDs' });
    }
    
    // Check if the mapping exists and belongs to the system
    const [existingMapping] = await db
      .select()
      .from(mlsFieldMappings)
      .where(eq(mlsFieldMappings.id, fieldMappingId))
      .where(eq(mlsFieldMappings.mlsSystemId, systemId));
    
    if (!existingMapping) {
      return res.status(404).json({ message: 'Field mapping not found' });
    }
    
    const validationResult = insertMlsFieldMappingSchema.safeParse({
      ...req.body,
      mlsSystemId: systemId
    });
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid field mapping data', 
        errors: validationResult.error.errors 
      });
    }
    
    const [updatedMapping] = await db
      .update(mlsFieldMappings)
      .set({
        ...validationResult.data,
        updatedAt: new Date()
      })
      .where(eq(mlsFieldMappings.id, fieldMappingId))
      .returning();
    
    res.json(updatedMapping);
  } catch (error) {
    console.error('Error updating field mapping:', error);
    res.status(500).json({ message: 'Error updating field mapping' });
  }
}

// Delete a field mapping
export async function deleteFieldMapping(req: Request, res: Response) {
  try {
    const { id, mappingId } = req.params;
    const systemId = parseInt(id);
    const fieldMappingId = parseInt(mappingId);
    
    if (isNaN(systemId) || isNaN(fieldMappingId)) {
      return res.status(400).json({ message: 'Invalid IDs' });
    }
    
    // Check if the mapping exists and belongs to the system
    const [existingMapping] = await db
      .select()
      .from(mlsFieldMappings)
      .where(eq(mlsFieldMappings.id, fieldMappingId))
      .where(eq(mlsFieldMappings.mlsSystemId, systemId));
    
    if (!existingMapping) {
      return res.status(404).json({ message: 'Field mapping not found' });
    }
    
    await db
      .delete(mlsFieldMappings)
      .where(eq(mlsFieldMappings.id, fieldMappingId));
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting field mapping:', error);
    res.status(500).json({ message: 'Error deleting field mapping' });
  }
}