import * as Y from 'yjs';
import { PhotoSyncManager, createPhotoSyncManager, PhotoMetadata } from './photo-sync';

export { PhotoSyncManager, createPhotoSyncManager, PhotoMetadata };

// Direct Yjs approach instead of syncedStore for better TypeScript compatibility
export interface ParcelNote {
  notes: string;
  author: string;
  lastModified: string;
}

/**
 * Creates a CRDT-enabled document for a parcel
 * @param parcelId The unique identifier for the parcel
 * @returns A Yjs document for parcel notes
 */
export function createParcelDoc(parcelId: string): Y.Doc {
  const doc = new Y.Doc();
  
  // Set a deterministic client ID for consistent conflict resolution
  doc.clientID = generateClientId(parcelId);
  
  // Initialize the note text
  const notesText = doc.getText('notes');
  
  // Initialize metadata as a Y.Map
  const metadata = doc.getMap('metadata');
  metadata.set('author', 'unknown');
  metadata.set('lastModified', new Date().toISOString());
  
  return doc;
}

/**
 * Generates a deterministic client ID based on parcel ID
 * This helps with consistent conflict resolution
 */
function generateClientId(parcelId: string): number {
  let hash = 0;
  for (let i = 0; i < parcelId.length; i++) {
    const char = parcelId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Gets the current parcel note data from a Yjs document
 * @param doc The Yjs document
 * @returns The current parcel note data
 */
export function getParcelNoteData(doc: Y.Doc): ParcelNote {
  const notesText = doc.getText('notes');
  const metadata = doc.getMap('metadata');
  
  return {
    notes: notesText.toString(),
    author: metadata.get('author') as string || 'unknown',
    lastModified: metadata.get('lastModified') as string || new Date().toISOString()
  };
}

/**
 * Updates the parcel note data in a Yjs document
 * @param doc The Yjs document to update
 * @param data The parcel note data
 */
export function updateParcelNoteData(doc: Y.Doc, data: Partial<ParcelNote>): void {
  // Update notes if provided
  if (data.notes !== undefined) {
    const notesText = doc.getText('notes');
    notesText.delete(0, notesText.length);
    notesText.insert(0, data.notes);
  }
  
  // Update metadata if provided
  const metadata = doc.getMap('metadata');
  if (data.author !== undefined) {
    metadata.set('author', data.author);
  }
  if (data.lastModified !== undefined) {
    metadata.set('lastModified', data.lastModified);
  } else {
    // Always update lastModified when the document is modified
    metadata.set('lastModified', new Date().toISOString());
  }
}

/**
 * Encodes a Yjs document update as a Base64 string
 * @param doc The Yjs document
 * @returns Base64 encoded update
 */
export function encodeDocUpdate(doc: Y.Doc): string {
  const update = Y.encodeStateAsUpdate(doc);
  return Buffer.from(update).toString('base64');
}

/**
 * Decodes a Base64 encoded update and applies it to a Yjs document
 * @param doc The target Yjs document
 * @param base64Update The Base64 encoded update
 */
export function applyEncodedUpdate(doc: Y.Doc, base64Update: string): void {
  const update = Buffer.from(base64Update, 'base64');
  Y.applyUpdate(doc, update);
}

/**
 * Merges an encoded update into a document and returns the new state
 * @param doc The target Yjs document
 * @param base64Update The Base64 encoded update to merge
 * @returns The Base64 encoded state after merge
 */
export function mergeUpdates(doc: Y.Doc, base64Update: string): string {
  applyEncodedUpdate(doc, base64Update);
  return encodeDocUpdate(doc);
}