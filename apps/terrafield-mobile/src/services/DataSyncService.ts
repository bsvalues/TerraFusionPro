import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Y from 'yjs';
import { fromUint8Array, toUint8Array } from 'js-base64';
import { ApiService } from './ApiService';
import { NotificationService } from './NotificationService';
import { ConflictResolutionService, ConflictType } from './ConflictResolutionService';
import { v4 as uuidv4 } from 'uuid';

const SYNC_STATE_KEY_PREFIX = 'sync_state_';
const LOCAL_DOC_PREFIX = 'local_doc_';
const VECTOR_CLOCK_PREFIX = 'vector_clock_';

// Sync state interface
interface SyncState {
  lastSyncTime: number;
  pendingChanges: boolean;
  syncVersion: number;
  docId: string;
}

/**
 * Service to handle data synchronization with CRDT support
 */
export class DataSyncService {
  private static instance: DataSyncService;
  private apiService: ApiService;
  private notificationService: NotificationService;
  private conflictService: ConflictResolutionService;
  private activeDocs: Map<string, Y.Doc> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private syncIntervalTime = 30000; // 30 seconds

  /**
   * Private constructor to implement singleton pattern
   */
  private constructor() {
    this.apiService = ApiService.getInstance();
    this.notificationService = NotificationService.getInstance();
    this.conflictService = ConflictResolutionService.getInstance();
    this.startSyncInterval();
  }

  /**
   * Get instance of DataSyncService (Singleton)
   */
  public static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  /**
   * Start the sync interval
   */
  private startSyncInterval(): void {
    // Clear any existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Set up new sync interval
    this.syncInterval = setInterval(() => {
      this.syncAllDocs();
    }, this.syncIntervalTime);
  }

  /**
   * Stop the sync interval
   */
  public stopSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Change the sync interval time
   */
  public setSyncIntervalTime(milliseconds: number): void {
    this.syncIntervalTime = milliseconds;
    this.startSyncInterval();
  }

  /**
   * Sync all active documents
   */
  public async syncAllDocs(): Promise<void> {
    // Get all local document IDs
    try {
      const keys = await AsyncStorage.getAllKeys();
      const docKeys = keys.filter(key => key.startsWith(LOCAL_DOC_PREFIX));
      
      for (const key of docKeys) {
        const docId = key.replace(LOCAL_DOC_PREFIX, '');
        await this.syncDoc(docId);
      }
    } catch (error) {
      console.error('Error syncing all docs:', error);
    }
  }

  /**
   * Get or create a document
   */
  public async getDoc(docId: string, parcelId: string): Promise<Y.Doc> {
    // Check if the doc is already active
    if (this.activeDocs.has(docId)) {
      return this.activeDocs.get(docId)!;
    }
    
    // Create a new document
    const doc = new Y.Doc();
    
    // Initialize the document with data (from local storage or server)
    await this.initializeDoc(doc, docId, parcelId);
    
    // Store in active docs map
    this.activeDocs.set(docId, doc);
    
    return doc;
  }

  /**
   * Initialize a document
   */
  private async initializeDoc(doc: Y.Doc, docId: string, parcelId: string): Promise<void> {
    try {
      // Try to load from local storage first
      const localData = await this.loadLocalDoc(docId);
      
      if (localData) {
        // Apply local updates
        const update = toUint8Array(localData);
        Y.applyUpdate(doc, update);
        console.log(`Document ${docId} loaded from local storage`);
      } else {
        // No local data, try to load from server
        try {
          const data = await this.apiService.get(`/api/field-notes/${parcelId}/notes`);
          
          if (data && data.notes) {
            // Initialize from server data
            const notesArray = doc.getArray('notes');
            
            for (const note of data.notes) {
              notesArray.push([note]);
            }
            
            // Save initial state locally
            await this.saveLocalDoc(docId, doc);
            await this.saveSyncState(docId, {
              lastSyncTime: Date.now(),
              pendingChanges: false,
              syncVersion: 1,
              docId,
            });
            
            console.log(`Document ${docId} loaded from server`);
          }
        } catch (error) {
          // If server fetch fails, create a new empty doc
          console.log(`Could not load document ${docId} from server, creating new`);
          
          // Initialize with empty data
          doc.getArray('notes');
          
          // Save empty state locally
          await this.saveLocalDoc(docId, doc);
          await this.saveSyncState(docId, {
            lastSyncTime: Date.now(),
            pendingChanges: false,
            syncVersion: 1,
            docId,
          });
        }
      }
      
      // Setup change tracking
      this.trackDocChanges(doc, docId, parcelId);
      
    } catch (error) {
      console.error(`Error initializing document ${docId}:`, error);
    }
  }

  /**
   * Track changes to a document
   */
  private trackDocChanges(doc: Y.Doc, docId: string, parcelId: string): void {
    doc.on('update', async (update: Uint8Array, origin: any) => {
      // When document is updated, save locally
      await this.saveLocalDoc(docId, doc);
      
      // Update sync state to mark that we have pending changes
      const syncState = await this.getSyncState(docId);
      await this.saveSyncState(docId, {
        ...syncState,
        pendingChanges: true,
        lastSyncTime: syncState.lastSyncTime,
      });
      
      // Try immediate sync
      this.syncDoc(docId, parcelId);
    });
  }

  /**
   * Load local document from storage
   */
  private async loadLocalDoc(docId: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(`${LOCAL_DOC_PREFIX}${docId}`);
    } catch (error) {
      console.error(`Error loading local doc ${docId}:`, error);
      return null;
    }
  }

  /**
   * Save local document to storage
   */
  private async saveLocalDoc(docId: string, doc: Y.Doc): Promise<void> {
    try {
      const update = Y.encodeStateAsUpdate(doc);
      const base64Update = fromUint8Array(update);
      await AsyncStorage.setItem(`${LOCAL_DOC_PREFIX}${docId}`, base64Update);
      
      // Update vector clock
      const vectorClock = this.getVectorClock(doc);
      await this.saveVectorClock(docId, vectorClock);
    } catch (error) {
      console.error(`Error saving local doc ${docId}:`, error);
    }
  }

  /**
   * Get sync state for a document
   */
  private async getSyncState(docId: string): Promise<SyncState> {
    try {
      const json = await AsyncStorage.getItem(`${SYNC_STATE_KEY_PREFIX}${docId}`);
      if (json) {
        return JSON.parse(json);
      }
    } catch (error) {
      console.error(`Error getting sync state for ${docId}:`, error);
    }
    
    // Default state if not found
    return {
      lastSyncTime: 0,
      pendingChanges: false,
      syncVersion: 0,
      docId,
    };
  }

  /**
   * Save sync state for a document
   */
  private async saveSyncState(docId: string, state: SyncState): Promise<void> {
    try {
      await AsyncStorage.setItem(`${SYNC_STATE_KEY_PREFIX}${docId}`, JSON.stringify(state));
    } catch (error) {
      console.error(`Error saving sync state for ${docId}:`, error);
    }
  }

  /**
   * Get vector clock for a document
   */
  private getVectorClock(doc: Y.Doc): Record<string, number> {
    // Simplified vector clock - in a production system, would use proper vector clocks
    // or leverage Yjs's built-in CRDT state vectors
    return {
      clientId: doc.clientID,
      timestamp: Date.now(),
    };
  }

  /**
   * Save vector clock for a document
   */
  private async saveVectorClock(docId: string, vectorClock: Record<string, number>): Promise<void> {
    try {
      await AsyncStorage.setItem(`${VECTOR_CLOCK_PREFIX}${docId}`, JSON.stringify(vectorClock));
    } catch (error) {
      console.error(`Error saving vector clock for ${docId}:`, error);
    }
  }

  /**
   * Load vector clock for a document
   */
  private async loadVectorClock(docId: string): Promise<Record<string, number> | null> {
    try {
      const json = await AsyncStorage.getItem(`${VECTOR_CLOCK_PREFIX}${docId}`);
      if (json) {
        return JSON.parse(json);
      }
    } catch (error) {
      console.error(`Error loading vector clock for ${docId}:`, error);
    }
    return null;
  }

  /**
   * Sync a document with the server
   */
  public async syncDoc(docId: string, parcelId?: string): Promise<boolean> {
    try {
      // Check if we have pending changes and if we're online
      const syncState = await this.getSyncState(docId);
      
      if (!syncState.pendingChanges) {
        return true; // Nothing to sync
      }
      
      // Check if we have the doc ID
      if (!parcelId) {
        // Try to get parcelId from the docId (assuming they're the same in this case)
        parcelId = docId;
      }
      
      // Get the document
      const doc = this.activeDocs.get(docId);
      
      if (!doc) {
        console.error(`Cannot sync - document ${docId} not active`);
        return false;
      }
      
      // Encode current state
      const update = Y.encodeStateAsUpdate(doc);
      const base64Update = fromUint8Array(update);
      
      // Get local vector clock
      const vectorClockLocal = await this.loadVectorClock(docId) || {};
      
      try {
        // Send to server
        const result = await this.apiService.post(`/api/field-notes/${parcelId}/sync`, {
          update: base64Update,
          vectorClock: vectorClockLocal,
        });
        
        if (result && result.state) {
          // Check for conflicts
          if (result.vectorClock) {
            const vectorClockRemote = result.vectorClock;
            
            const conflictType = this.conflictService.detectConflicts(
              doc,
              result.data,
              vectorClockLocal,
              vectorClockRemote
            );
            
            if (conflictType) {
              // Handle conflict
              await this.handleConflict(doc, docId, conflictType, result.data);
            } else {
              // No conflict, apply server updates
              const serverUpdate = toUint8Array(result.state);
              Y.applyUpdate(doc, serverUpdate);
              
              // Save the updated document
              await this.saveLocalDoc(docId, doc);
            }
          }
          
          // Update sync state
          await this.saveSyncState(docId, {
            lastSyncTime: Date.now(),
            pendingChanges: false,
            syncVersion: syncState.syncVersion + 1,
            docId,
          });
          
          // Send success notification
          await this.notificationService.sendSyncSuccessNotification(
            parcelId,
            1 // Number of changes, simplified for now
          );
          
          return true;
        }
      } catch (error) {
        console.error(`Error syncing document ${docId}:`, error);
        
        // Send error notification
        await this.notificationService.sendSyncErrorNotification(
          parcelId,
          1 // Number of pending changes, simplified for now
        );
      }
      
      return false;
    } catch (error) {
      console.error(`Error in syncDoc for ${docId}:`, error);
      return false;
    }
  }

  /**
   * Handle conflict between local and remote versions
   */
  private async handleConflict(
    doc: Y.Doc,
    docId: string,
    conflictType: ConflictType,
    remoteData: any
  ): Promise<void> {
    // Register the conflict
    const conflict = await this.conflictService.registerConflict(
      docId,
      conflictType,
      this.getLocalData(doc),
      remoteData
    );
    
    // Default resolution strategy (can be changed by user later)
    await this.conflictService.resolveConflict(
      conflict.id,
      'merged',
      this.mergeData(doc, remoteData)
    );
    
    // Apply the resolution
    this.conflictService.applyResolution(doc, conflict);
    
    // Save resolved document
    await this.saveLocalDoc(docId, doc);
  }

  /**
   * Extract local data from document
   */
  private getLocalData(doc: Y.Doc): any {
    const notesArray = doc.getArray('notes');
    return {
      notes: notesArray.toArray(),
    };
  }

  /**
   * Merge local and remote data
   */
  private mergeData(doc: Y.Doc, remoteData: any): any {
    // Simple merge logic - in a real application, this would use
    // a more sophisticated merge strategy taking advantage of CRDT properties
    const localData = this.getLocalData(doc);
    
    const combinedNotes = [...localData.notes];
    
    // Add remote notes that don't exist locally
    if (remoteData.notes) {
      for (const remoteNote of remoteData.notes) {
        const exists = combinedNotes.some(note => note.id === remoteNote.id);
        if (!exists) {
          combinedNotes.push(remoteNote);
        }
      }
    }
    
    return {
      notes: combinedNotes,
    };
  }

  /**
   * Add a field note to a document
   */
  public async addFieldNote(
    docId: string, 
    parcelId: string, 
    text: string,
    userId: number,
    userName: string
  ): Promise<string> {
    const doc = await this.getDoc(docId, parcelId);
    const notesArray = doc.getArray('notes');
    
    const noteId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const note = {
      id: noteId,
      parcelId,
      text,
      userId,
      createdAt: timestamp,
      createdBy: userName
    };
    
    notesArray.push([note]);
    
    // No need to manually save as the document update event will trigger saving
    
    return noteId;
  }

  /**
   * Update a field note in a document
   */
  public async updateFieldNote(
    docId: string,
    parcelId: string,
    noteId: string,
    text: string
  ): Promise<boolean> {
    const doc = await this.getDoc(docId, parcelId);
    const notesArray = doc.getArray('notes');
    const notes = notesArray.toArray();
    
    const index = notes.findIndex(note => note.id === noteId);
    
    if (index === -1) {
      return false;
    }
    
    const note = notes[index];
    
    // Update the note
    const updatedNote = {
      ...note,
      text,
    };
    
    // Replace the note in the array
    doc.transact(() => {
      notesArray.delete(index, 1);
      notesArray.insert(index, [updatedNote]);
    });
    
    return true;
  }

  /**
   * Delete a field note from a document
   */
  public async deleteFieldNote(
    docId: string,
    parcelId: string,
    noteId: string
  ): Promise<boolean> {
    const doc = await this.getDoc(docId, parcelId);
    const notesArray = doc.getArray('notes');
    const notes = notesArray.toArray();
    
    const index = notes.findIndex(note => note.id === noteId);
    
    if (index === -1) {
      return false;
    }
    
    // Delete the note
    notesArray.delete(index, 1);
    
    return true;
  }

  /**
   * Get all field notes from a document
   */
  public async getFieldNotes(
    docId: string,
    parcelId: string
  ): Promise<any[]> {
    const doc = await this.getDoc(docId, parcelId);
    const notesArray = doc.getArray('notes');
    return notesArray.toArray();
  }
}