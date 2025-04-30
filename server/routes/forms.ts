import express from 'express';
import { z } from 'zod';
import { updateCRDTForm, getCRDTFormState, takeFormSnapshot } from '../services/crdt';
import { getSnapshotById } from '../services/comps';

export const formsRouter = express.Router();

// Schema for validating push requests
const PushRequest = z.object({
  formId: z.string(),
  snapshotId: z.string(),
  fieldMappings: z.record(z.string(), z.string()) // e.g., { salePrice: "G1", gla: "G2" }
});

/**
 * Push data from a snapshot to a form
 * 
 * This endpoint takes data from a ComparableSnapshot and updates the form's
 * CRDT document with the mapped values.
 */
formsRouter.post('/forms/push', async (req, res) => {
  try {
    const parseResult = PushRequest.safeParse(req.body);
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request format',
        details: parseResult.error.issues
      });
    }
    
    const { formId, snapshotId, fieldMappings } = parseResult.data;
    
    // Retrieve the snapshot
    const snapshot = await getSnapshotById(snapshotId);
    if (!snapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }
    
    // Map the snapshot fields to form fields
    const updates = Object.entries(fieldMappings).reduce((acc, [snapshotKey, formField]) => {
      // @ts-ignore - We know snapshotKey might not be in fields, but we check it
      const value = snapshot.fields[snapshotKey];
      if (value !== undefined) {
        acc[formField] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    // Update the form CRDT document
    await updateCRDTForm(formId, updates);
    
    // Take a snapshot of the form's state after the update
    await takeFormSnapshot(formId);
    
    // Get the current form state to return in response
    const currentState = await getCRDTFormState(formId);
    
    // Return success with the updated fields
    res.json({ 
      success: true,
      fields: updates,
      formState: currentState
    });
  } catch (error) {
    console.error('Error pushing snapshot to form:', error);
    res.status(500).json({ 
      error: 'Failed to push snapshot to form', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Get form state
 * 
 * Retrieves the current state of a form from the CRDT document
 */
formsRouter.get('/forms/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    
    if (!formId) {
      return res.status(400).json({ error: 'Form ID is required' });
    }
    
    // Get the current form state
    const formState = await getCRDTFormState(formId);
    
    res.json({ 
      formId,
      state: formState
    });
  } catch (error) {
    console.error('Error retrieving form state:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve form state', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});