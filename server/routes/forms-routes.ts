/**
 * Forms Routes
 * 
 * API endpoints for forms data integration with comps
 */
import { Router } from 'express';
import { z } from 'zod';
import { getSnapshotById } from '../services/comps';
import * as Y from 'yjs';
import { encodeDocUpdate, applyEncodedUpdate } from '../../packages/crdt/src/index';

// In-memory form state storage
// In a real implementation, this would be in a database
const formDocs = new Map<string, Y.Doc>();

const router = Router();

// Get form state
router.get('/forms/:formId', async (req, res) => {
  try {
    const formId = req.params.formId;
    
    // Get or create form doc
    let doc = formDocs.get(formId);
    if (!doc) {
      doc = new Y.Doc();
      formDocs.set(formId, doc);
    }
    
    // Get form data
    const formData = doc.getMap('form').toJSON();
    
    res.json({ formId, formData });
  } catch (error) {
    console.error('Error fetching form data:', error);
    res.status(500).json({ 
      message: 'Failed to fetch form data',
      error: error.message
    });
  }
});

// Update form state
router.patch('/forms/:formId', async (req, res) => {
  try {
    const formId = req.params.formId;
    const updates = req.body;
    
    // Get or create form doc
    let doc = formDocs.get(formId);
    if (!doc) {
      doc = new Y.Doc();
      formDocs.set(formId, doc);
    }
    
    // Update form data
    const formMap = doc.getMap('form');
    
    Object.entries(updates).forEach(([key, value]) => {
      formMap.set(key, value);
    });
    
    const formData = formMap.toJSON();
    
    res.json({ formId, formData });
  } catch (error) {
    console.error('Error updating form data:', error);
    res.status(500).json({ 
      message: 'Failed to update form data',
      error: error.message
    });
  }
});

// Push snapshot data to form
router.post('/forms/push', async (req, res) => {
  try {
    // Define schema for request
    const schema = z.object({
      formId: z.string(),
      snapshotId: z.string(),
      fieldMappings: z.record(z.string())
    });
    
    const validatedData = schema.parse(req.body);
    const { formId, snapshotId, fieldMappings } = validatedData;
    
    // Get snapshot
    const snapshot = await getSnapshotById(snapshotId);
    if (!snapshot) {
      return res.status(404).json({ message: 'Snapshot not found' });
    }
    
    // Get or create form doc
    let doc = formDocs.get(formId);
    if (!doc) {
      doc = new Y.Doc();
      formDocs.set(formId, doc);
    }
    
    // Map snapshot fields to form fields
    const formMap = doc.getMap('form');
    const updatedFields: Record<string, any> = {};
    
    // Apply each mapped field
    Object.entries(fieldMappings).forEach(([snapshotField, formField]) => {
      const value = snapshot.fields[snapshotField];
      if (value !== undefined) {
        formMap.set(formField, value);
        updatedFields[formField] = value;
      }
    });
    
    // Get updated form state
    const formData = formMap.toJSON();
    
    res.json({
      success: true,
      fields: updatedFields,
      formState: formData
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    console.error('Error pushing data to form:', error);
    res.status(500).json({ 
      message: 'Failed to push data to form',
      error: error.message
    });
  }
});

// Sync form state (CRDT updates)
router.post('/forms/:formId/sync', async (req, res) => {
  try {
    const formId = req.params.formId;
    const { update, clientId } = req.body;
    
    if (!update) {
      return res.status(400).json({ message: 'Update data is required' });
    }
    
    // Get or create form doc
    let doc = formDocs.get(formId);
    if (!doc) {
      doc = new Y.Doc();
      formDocs.set(formId, doc);
    }
    
    // Apply update
    applyEncodedUpdate(doc, update);
    
    // Get form data
    const formData = doc.getMap('form').toJSON();
    
    // Encode state vector for client to sync
    const encodedState = encodeDocUpdate(doc);
    
    res.json({ 
      formId, 
      formData,
      stateVector: encodedState 
    });
  } catch (error) {
    console.error('Error syncing form data:', error);
    res.status(500).json({ 
      message: 'Failed to sync form data',
      error: error.message
    });
  }
});

export default router;