/**
 * CRDT Service
 * 
 * This service provides utilities for managing Yjs CRDT documents for synchronized form state.
 * It handles updating form data, retrieving form state, and creating snapshots.
 */

import * as Y from 'yjs';

// Store all active documents in memory - for a production app, you'd want to persist these
// documents to a database or file system, and handle document expiry, etc.
const formDocs = new Map<string, Y.Doc>();

/**
 * Get or create a CRDT document for a form
 * @param formId The ID of the form
 */
function getOrCreateFormDoc(formId: string): Y.Doc {
  if (!formDocs.has(formId)) {
    const doc = new Y.Doc();
    formDocs.set(formId, doc);
    
    // Create initial form structure if it doesn't exist
    const formData = doc.getMap('formData');
    if (formData.size === 0) {
      formData.set('meta', {
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        snapshots: []
      });
    }
  }
  
  return formDocs.get(formId)!;
}

/**
 * Update a form's CRDT document with new values
 * @param formId The ID of the form to update
 * @param updates Object containing field updates
 */
export async function updateCRDTForm(formId: string, updates: Record<string, any>): Promise<void> {
  const doc = getOrCreateFormDoc(formId);
  
  // Get the form data map
  const formData = doc.getMap('formData');
  
  // Apply the updates
  doc.transact(() => {
    // Update each field
    for (const [field, value] of Object.entries(updates)) {
      formData.set(field, value);
    }
    
    // Update the last updated timestamp
    const meta = formData.get('meta') as Record<string, any> || {};
    meta.lastUpdated = new Date().toISOString();
    formData.set('meta', meta);
  });
}

/**
 * Get the current state of a form from the CRDT document
 * @param formId The ID of the form to retrieve
 */
export async function getCRDTFormState(formId: string): Promise<Record<string, any>> {
  const doc = getOrCreateFormDoc(formId);
  
  // Get the form data map
  const formData = doc.getMap('formData');
  
  // Convert the map to a plain object
  const state: Record<string, any> = {};
  formData.forEach((value, key) => {
    state[key] = value;
  });
  
  return state;
}

/**
 * Take a snapshot of the current form state
 * @param formId The ID of the form
 */
export async function takeFormSnapshot(formId: string): Promise<string> {
  const doc = getOrCreateFormDoc(formId);
  
  // Get the form data map
  const formData = doc.getMap('formData');
  
  // Create a snapshot object
  const snapshot = {
    id: `snapshot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    data: {} as Record<string, any>
  };
  
  // Add all form data to the snapshot
  formData.forEach((value, key) => {
    if (key !== 'meta') {
      snapshot.data[key] = value;
    }
  });
  
  // Add the snapshot to the meta information
  const meta = formData.get('meta') as Record<string, any> || {};
  const snapshots = meta.snapshots || [];
  snapshots.push(snapshot);
  meta.snapshots = snapshots;
  formData.set('meta', meta);
  
  return snapshot.id;
}

/**
 * Get all snapshots for a form
 * @param formId The ID of the form
 */
export async function getFormSnapshots(formId: string): Promise<any[]> {
  const doc = getOrCreateFormDoc(formId);
  
  // Get the form data map
  const formData = doc.getMap('formData');
  
  // Get the snapshots from the meta information
  const meta = formData.get('meta') as Record<string, any> || {};
  return meta.snapshots || [];
}

/**
 * Restore a form to a previous snapshot state
 * @param formId The ID of the form
 * @param snapshotId The ID of the snapshot to restore
 */
export async function restoreFormSnapshot(formId: string, snapshotId: string): Promise<boolean> {
  const doc = getOrCreateFormDoc(formId);
  
  // Get the form data map
  const formData = doc.getMap('formData');
  
  // Get the snapshots from the meta information
  const meta = formData.get('meta') as Record<string, any> || {};
  const snapshots = meta.snapshots || [];
  
  // Find the requested snapshot
  const snapshot = snapshots.find((s: any) => s.id === snapshotId);
  
  if (!snapshot) {
    return false;
  }
  
  // Restore the form state to the snapshot
  doc.transact(() => {
    // First, clear existing fields (except meta)
    formData.forEach((_value, key) => {
      if (key !== 'meta') {
        formData.delete(key);
      }
    });
    
    // Then, set fields from the snapshot
    for (const [field, value] of Object.entries(snapshot.data)) {
      formData.set(field, value);
    }
    
    // Update the last updated timestamp
    meta.lastUpdated = new Date().toISOString();
    meta.restoredFromSnapshot = snapshotId;
    formData.set('meta', meta);
  });
  
  return true;
}