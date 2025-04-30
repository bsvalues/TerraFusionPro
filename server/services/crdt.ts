/**
 * Collaborative Real-time Data Types (CRDT) Service
 * 
 * This service handles interactions with the CRDT documents that power
 * collaborative editing in TerraFusionPro forms.
 */

import * as Y from 'yjs';

// Simple in-memory storage of Y.Doc instances for this example
// In production, you would use y-websocket and y-indexeddb for persistence
const docStore: Map<string, Y.Doc> = new Map();

/**
 * Get or create a Y.Doc for a form
 */
export async function getYDoc(formId: string): Promise<Y.Doc> {
  if (!docStore.has(formId)) {
    const doc = new Y.Doc();
    // Initialize with default structure
    doc.getMap('form'); // Create the form map if it doesn't exist
    docStore.set(formId, doc);
  }
  return docStore.get(formId)!;
}

/**
 * Update form fields in a CRDT document
 * @param formId The ID of the form to update
 * @param updates Map of field IDs to new values
 */
export async function updateCRDTForm(formId: string, updates: Record<string, any>): Promise<void> {
  const ydoc = await getYDoc(formId);
  const formMap = ydoc.getMap('form');
  
  // Wrap updates in a transaction for atomicity
  ydoc.transact(() => {
    for (const [fieldId, value] of Object.entries(updates)) {
      formMap.set(fieldId, value);
    }
  });
  
  // In a real implementation, you would:
  // 1. Update any awareness state
  // 2. Broadcast the update to all connected clients
  // 3. Possibly persist the update to a database
  
  return;
}

/**
 * Get the current state of a form from CRDT
 * @param formId The ID of the form to retrieve
 */
export async function getCRDTFormState(formId: string): Promise<Record<string, any>> {
  const ydoc = await getYDoc(formId);
  const formMap = ydoc.getMap('form');
  
  // Convert Y.Map to plain object
  const formState: Record<string, any> = {};
  
  for (const [key, value] of formMap.entries()) {
    formState[key] = value;
  }
  
  return formState;
}

/**
 * Take a snapshot of a form's state
 * @param formId The ID of the form to snapshot
 */
export async function takeFormSnapshot(formId: string): Promise<Uint8Array> {
  const ydoc = await getYDoc(formId);
  return Y.encodeStateAsUpdate(ydoc);
}

/**
 * Apply a snapshot to a form
 * @param formId The ID of the form to update
 * @param snapshot The encoded snapshot to apply
 */
export async function applyFormSnapshot(formId: string, snapshot: Uint8Array): Promise<void> {
  const ydoc = await getYDoc(formId);
  Y.applyUpdate(ydoc, snapshot);
}