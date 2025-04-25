import express, { Request, Response } from 'express';
import { storage } from '../storage';
import * as Y from 'yjs';
import { applyUpdateV2 } from 'yjs';
import { fromUint8Array, toUint8Array } from 'js-base64';
import { fieldNoteSchema } from '../../shared/schema';
import { z } from 'zod';

const router = express.Router();

// Map to store Yjs documents for field notes by parcelId
const fieldNoteDocs = new Map<string, Y.Doc>();

// Helper function to create or retrieve a field notes document
function getOrCreateFieldNoteDoc(parcelId: string): Y.Doc {
  if (!fieldNoteDocs.has(parcelId)) {
    const doc = new Y.Doc();
    fieldNoteDocs.set(parcelId, doc);
  }
  return fieldNoteDocs.get(parcelId)!;
}

// Helper function to get field notes data from a document
function getFieldNotesData(doc: Y.Doc): { notes: any[] } {
  const notesArray = doc.getArray('notes');
  return {
    notes: notesArray.toArray()
  };
}

// Helper function to update field notes data in a document
function updateFieldNoteData(doc: Y.Doc, noteData: any): void {
  // Parse and validate the note data
  try {
    const validatedData = fieldNoteSchema.parse(noteData);
    const notesArray = doc.getArray('notes');
    
    // Update existing note or add a new one
    if (validatedData.id) {
      const index = notesArray.toArray().findIndex((note: any) => note.id === validatedData.id);
      if (index !== -1) {
        // Update existing note
        notesArray.delete(index, 1);
        notesArray.insert(index, [validatedData]);
      } else {
        // Add new note
        notesArray.push([validatedData]);
      }
    } else {
      // Add new note with generated id
      notesArray.push([{
        ...validatedData,
        id: Date.now().toString(36) + Math.random().toString(36).substring(2)
      }]);
    }
  } catch (error) {
    console.error('Error validating field note data:', error);
    throw error;
  }
}

// Helper function to apply encoded updates to a document
function applyEncodedUpdate(doc: Y.Doc, encodedUpdate: string): void {
  try {
    // Convert base64 to Uint8Array
    const update = toUint8Array(encodedUpdate);
    // Apply the update to the document
    applyUpdateV2(doc, update);
  } catch (error) {
    console.error('Error applying encoded update:', error);
    throw error;
  }
}

// Helper function to encode document updates
function encodeDocUpdate(doc: Y.Doc): string {
  // Get the document state as an update
  const update = Y.encodeStateAsUpdate(doc);
  // Convert to base64 for JSON serialization
  return fromUint8Array(update);
}

// Helper function to merge updates
function mergeUpdates(doc: Y.Doc, encodedUpdate: string): string {
  // Apply the received update
  applyEncodedUpdate(doc, encodedUpdate);
  // Return the current state
  return encodeDocUpdate(doc);
}

// Get current field notes state
router.get('/:parcelId/notes', async (req: Request, res: Response) => {
  try {
    const { parcelId } = req.params;
    
    if (!parcelId) {
      return res.status(400).json({ message: 'Parcel ID is required' });
    }
    
    // Get or create the Yjs document for this parcel
    const doc = getOrCreateFieldNoteDoc(parcelId);
    
    // Get notes data
    const notesData = getFieldNotesData(doc);
    
    // Encode the current state
    const update = encodeDocUpdate(doc);
    
    // Return the data and encoded state
    res.status(200).json({
      update,
      data: notesData
    });
  } catch (error) {
    console.error('Error getting field notes:', error);
    res.status(500).json({ message: 'Error getting field notes' });
  }
});

// Update field notes
router.put('/:parcelId/notes', async (req: Request, res: Response) => {
  try {
    const { parcelId } = req.params;
    const { update, note } = req.body;
    
    if (!parcelId) {
      return res.status(400).json({ message: 'Parcel ID is required' });
    }
    
    // Get or create the Yjs document for this parcel
    const doc = getOrCreateFieldNoteDoc(parcelId);
    
    if (update) {
      // If we have an update, apply it to the document
      const mergedUpdate = mergeUpdates(doc, update);
      
      // Return the merged state
      const notesData = getFieldNotesData(doc);
      
      return res.status(200).json({
        mergedUpdate,
        data: notesData
      });
    } else if (note) {
      // If we have a direct note update, apply it to the document
      updateFieldNoteData(doc, note);
      
      // Return the current state
      const notesData = getFieldNotesData(doc);
      const currentUpdate = encodeDocUpdate(doc);
      
      return res.status(200).json({
        mergedUpdate: currentUpdate,
        data: notesData
      });
    } else {
      return res.status(400).json({ message: 'Update or note data is required' });
    }
  } catch (error) {
    console.error('Error updating field notes:', error);
    res.status(500).json({ message: 'Error updating field notes' });
  }
});

// Sync field notes (for CRDT-based clients)
router.post('/:parcelId/sync', async (req: Request, res: Response) => {
  try {
    const { parcelId } = req.params;
    const { update } = req.body;
    
    if (!parcelId) {
      return res.status(400).json({ message: 'Parcel ID is required' });
    }
    
    if (!update) {
      return res.status(400).json({ message: 'Update data is required' });
    }
    
    // Get or create the Yjs document for this parcel
    const doc = getOrCreateFieldNoteDoc(parcelId);
    
    // Apply the received update to our document
    const mergedState = mergeUpdates(doc, update);
    
    // Return the merged state to the client
    const notesData = getFieldNotesData(doc);
    
    res.status(200).json({
      state: mergedState,
      data: notesData
    });
  } catch (error) {
    console.error('Error syncing field notes:', error);
    res.status(500).json({ message: 'Error syncing field notes' });
  }
});

// Delete a field note
router.delete('/:parcelId/notes/:noteId', async (req: Request, res: Response) => {
  try {
    const { parcelId, noteId } = req.params;
    
    if (!parcelId || !noteId) {
      return res.status(400).json({ message: 'Parcel ID and Note ID are required' });
    }
    
    // Get the Yjs document
    const doc = getOrCreateFieldNoteDoc(parcelId);
    const notesArray = doc.getArray('notes');
    
    // Find the note to delete
    const notes = notesArray.toArray();
    const index = notes.findIndex((note: any) => note.id === noteId);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Delete the note
    notesArray.delete(index, 1);
    
    // Return the updated data
    const notesData = getFieldNotesData(doc);
    const currentUpdate = encodeDocUpdate(doc);
    
    res.status(200).json({
      mergedUpdate: currentUpdate,
      data: notesData
    });
  } catch (error) {
    console.error('Error deleting field note:', error);
    res.status(500).json({ message: 'Error deleting field note' });
  }
});

export default router;