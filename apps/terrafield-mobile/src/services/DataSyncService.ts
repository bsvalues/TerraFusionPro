import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { fromUint8Array, toUint8Array } from 'js-base64';
import { OfflineQueueService, OperationType } from './OfflineQueueService';
import { ConflictResolutionService, ConflictType } from './ConflictResolutionService';
import { NotificationService, NotificationType } from './NotificationService';
import { ApiService } from './ApiService';
import * as Y from 'yjs';

// Types
interface SyncInfo {
  lastSynced: string;
  lastUpdateId: string;
}

interface FieldNote {
  id?: string;
  parcelId: string;
  text: string;
  createdAt?: string;
  createdBy: string;
  userId: number;
}

/**
 * This service handles synchronization of data between the mobile app and the server
 * using CRDT for conflict-free modifications
 */
export class DataSyncService {
  private static instance: DataSyncService;
  private offlineQueue: OfflineQueueService;
  private conflictService: ConflictResolutionService;
  private notificationService: NotificationService;
  private apiService: ApiService;
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  
  // In-memory store of active Yjs documents
  private documents: Map<string, Y.Doc> = new Map();

  private constructor() {
    this.offlineQueue = OfflineQueueService.getInstance();
    this.conflictService = ConflictResolutionService.getInstance();
    this.notificationService = NotificationService.getInstance();
    this.apiService = ApiService.getInstance();

    // Set up auto sync
    this.setupAutoSync();

    // Listen for network changes
    this.setupNetworkListener();
  }

  public static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  /**
   * Set up auto sync interval
   */
  private setupAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sync every 5 minutes
    this.syncInterval = setInterval(async () => {
      const isConnected = await this.isConnected();
      if (isConnected) {
        await this.syncAll();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Set up network change listener
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      // When we go from offline to online, attempt to sync
      if (state.isConnected) {
        this.syncAll();
      }
    });
  }

  /**
   * Check if device is connected to the internet
   */
  private async isConnected(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return !!netInfo.isConnected;
  }

  /**
   * Sync all data
   */
  public async syncAll(): Promise<void> {
    if (this.syncInProgress) return;

    this.syncInProgress = true;
    try {
      const isConnected = await this.isConnected();
      if (!isConnected) {
        console.log('Cannot sync: No internet connection');
        return;
      }

      // Get all parcel IDs that have local changes
      const parcelIds = await this.getLocallyModifiedParcelIds();
      
      // Sync each parcel
      for (const parcelId of parcelIds) {
        await this.syncParcelData(parcelId);
      }

      // Process offline queue
      await this.offlineQueue.processQueue();
    } catch (error) {
      console.error('Error syncing all data:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get all parcel IDs that have local changes
   */
  private async getLocallyModifiedParcelIds(): Promise<string[]> {
    try {
      // Get all keys from AsyncStorage that start with field notes prefix
      const keys = await AsyncStorage.getAllKeys();
      const fieldNoteKeys = keys.filter(key => key.startsWith('terrafield_fieldnotes_'));
      
      // Extract parcel IDs from keys
      return fieldNoteKeys.map(key => key.replace('terrafield_fieldnotes_', ''));
    } catch (error) {
      console.error('Error getting locally modified parcel IDs:', error);
      return [];
    }
  }

  /**
   * Sync field notes for a specific parcel
   */
  public async syncParcelData(parcelId: string): Promise<boolean> {
    if (!parcelId) return false;

    try {
      const isConnected = await this.isConnected();
      if (!isConnected) {
        console.log(`Cannot sync parcel ${parcelId}: No internet connection`);
        return false;
      }

      // Get or create document
      let doc = this.documents.get(parcelId);
      
      if (!doc) {
        // Try to load from local storage
        doc = new Y.Doc();
        this.documents.set(parcelId, doc);
        
        const localData = await AsyncStorage.getItem(`terrafield_fieldnotes_${parcelId}`);
        if (localData) {
          try {
            const parsedData = JSON.parse(localData);
            if (parsedData.update) {
              const update = toUint8Array(parsedData.update);
              Y.applyUpdate(doc, update);
            }
          } catch (parseError) {
            console.error('Error parsing local data:', parseError);
          }
        }
      }

      // Encode current document state
      const update = Y.encodeStateAsUpdate(doc);
      const base64Update = fromUint8Array(update);

      // Call the sync API
      const response = await this.apiService.post(`/api/field-notes/${parcelId}/sync`, {
        update: base64Update
      });

      if (response.state && response.data) {
        // Apply the merged state from server
        const serverUpdate = toUint8Array(response.state);
        Y.applyUpdate(doc, serverUpdate);

        // Save to local storage
        await this.saveToLocalStorage(parcelId, doc);

        // Update last synced time
        await this.updateLastSyncTime(parcelId);

        // Process any conflicts
        await this.resolveConflicts(parcelId);

        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error syncing parcel ${parcelId}:`, error);
      
      // Add to the conflict resolution queue for later handling
      this.conflictService.addConflict(
        ConflictType.FIELD_NOTE,
        `parcel_${parcelId}`,
        `Failed to sync field notes for parcel ${parcelId}`,
        { parcelId }
      );
      
      return false;
    }
  }

  /**
   * Save document to local storage
   */
  private async saveToLocalStorage(parcelId: string, doc: Y.Doc): Promise<void> {
    try {
      // Encode current document state
      const update = Y.encodeStateAsUpdate(doc);
      const base64Update = fromUint8Array(update);
      
      // Save to local storage
      const now = new Date().toISOString();
      const dataToSave = {
        update: base64Update,
        lastSynced: now
      };
      
      await AsyncStorage.setItem(
        `terrafield_fieldnotes_${parcelId}`,
        JSON.stringify(dataToSave)
      );
    } catch (error) {
      console.error(`Error saving parcel ${parcelId} to local storage:`, error);
    }
  }

  /**
   * Update last sync time
   */
  private async updateLastSyncTime(parcelId: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      const syncInfo: SyncInfo = {
        lastSynced: now,
        lastUpdateId: uuidv4()
      };
      
      await AsyncStorage.setItem(
        `terrafield_sync_${parcelId}`,
        JSON.stringify(syncInfo)
      );
    } catch (error) {
      console.error(`Error updating last sync time for parcel ${parcelId}:`, error);
    }
  }

  /**
   * Get last sync time for a parcel
   */
  public async getLastSyncTime(parcelId: string): Promise<SyncInfo | null> {
    try {
      const syncInfoJson = await AsyncStorage.getItem(`terrafield_sync_${parcelId}`);
      if (syncInfoJson) {
        return JSON.parse(syncInfoJson) as SyncInfo;
      }
      return null;
    } catch (error) {
      console.error(`Error getting last sync time for parcel ${parcelId}:`, error);
      return null;
    }
  }

  /**
   * Resolve any conflicts for this parcel
   */
  private async resolveConflicts(parcelId: string): Promise<void> {
    try {
      const conflicts = this.conflictService.getUnresolvedConflicts()
        .filter(conflict => 
          conflict.type === ConflictType.FIELD_NOTE && 
          conflict.entityId === `parcel_${parcelId}`
        );
      
      if (conflicts.length > 0) {
        // Auto-resolve conflicts
        const resolvedCount = this.conflictService.autoResolveConflicts();
        console.log(`Auto-resolved ${resolvedCount} conflicts for parcel ${parcelId}`);
        
        // Notify about any remaining conflicts
        const remainingConflicts = this.conflictService.getUnresolvedConflicts()
          .filter(conflict => 
            conflict.type === ConflictType.FIELD_NOTE && 
            conflict.entityId === `parcel_${parcelId}`
          );
        
        if (remainingConflicts.length > 0) {
          this.notificationService.sendNotification(
            1, // Default user ID (should come from auth)
            NotificationType.CONFLICT_DETECTED,
            'Sync Conflicts Detected',
            `There are ${remainingConflicts.length} unresolved conflicts for property ${parcelId}.`
          );
        }
      }
    } catch (error) {
      console.error(`Error resolving conflicts for parcel ${parcelId}:`, error);
    }
  }

  /**
   * Get field notes for a parcel
   */
  public async getFieldNotes(parcelId: string): Promise<FieldNote[]> {
    try {
      // Try to get from server first if online
      const isConnected = await this.isConnected();
      if (isConnected) {
        try {
          const response = await this.apiService.get(`/api/field-notes/${parcelId}/notes`);
          if (response && response.notes) {
            return response.notes;
          }
        } catch (error) {
          console.log('Failed to fetch field notes from server, using local data');
        }
      }
      
      // Fall back to local storage
      const doc = this.documents.get(parcelId);
      if (doc) {
        const notesArray = doc.getArray('notes');
        return notesArray.toArray();
      }
      
      // Try to load from local storage
      const localData = await AsyncStorage.getItem(`terrafield_fieldnotes_${parcelId}`);
      if (localData) {
        try {
          const parsedData = JSON.parse(localData);
          if (parsedData.update) {
            const newDoc = new Y.Doc();
            const update = toUint8Array(parsedData.update);
            Y.applyUpdate(newDoc, update);
            
            // Store for future use
            this.documents.set(parcelId, newDoc);
            
            // Get the notes
            const notesArray = newDoc.getArray('notes');
            return notesArray.toArray();
          }
        } catch (parseError) {
          console.error('Error parsing local data:', parseError);
        }
      }
      
      return [];
    } catch (error) {
      console.error(`Error getting field notes for parcel ${parcelId}:`, error);
      return [];
    }
  }

  /**
   * Add a field note
   */
  public async addFieldNote(note: FieldNote): Promise<boolean> {
    try {
      const { parcelId } = note;
      
      // Get or create document
      let doc = this.documents.get(parcelId);
      
      if (!doc) {
        // Create new document
        doc = new Y.Doc();
        this.documents.set(parcelId, doc);
      }
      
      // Add note ID if missing
      if (!note.id) {
        note.id = uuidv4();
      }
      
      // Add created at timestamp if missing
      if (!note.createdAt) {
        note.createdAt = new Date().toISOString();
      }
      
      // Add to the Yjs document
      const notesArray = doc.getArray('notes');
      notesArray.push([note]);
      
      // Save to local storage
      await this.saveToLocalStorage(parcelId, doc);
      
      // Try to sync if online
      const isConnected = await this.isConnected();
      if (isConnected) {
        try {
          await this.syncParcelData(parcelId);
        } catch (syncError) {
          console.error('Error syncing after adding note:', syncError);
          
          // Add to offline queue
          await this.offlineQueue.enqueue(
            OperationType.CREATE_NOTE,
            { note, parcelId },
            2 // Medium priority
          );
        }
      } else {
        // Add to offline queue
        await this.offlineQueue.enqueue(
          OperationType.CREATE_NOTE,
          { note, parcelId },
          2 // Medium priority
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error adding field note:', error);
      return false;
    }
  }

  /**
   * Delete a field note
   */
  public async deleteFieldNote(parcelId: string, noteId: string): Promise<boolean> {
    try {
      // Get document
      let doc = this.documents.get(parcelId);
      
      if (!doc) {
        // Try to load from local storage
        const localData = await AsyncStorage.getItem(`terrafield_fieldnotes_${parcelId}`);
        if (localData) {
          try {
            doc = new Y.Doc();
            this.documents.set(parcelId, doc);
            
            const parsedData = JSON.parse(localData);
            if (parsedData.update) {
              const update = toUint8Array(parsedData.update);
              Y.applyUpdate(doc, update);
            }
          } catch (parseError) {
            console.error('Error parsing local data:', parseError);
            return false;
          }
        } else {
          return false;
        }
      }
      
      // Find the note
      const notesArray = doc.getArray('notes');
      const notes = notesArray.toArray();
      const noteIndex = notes.findIndex(note => note.id === noteId);
      
      if (noteIndex === -1) {
        return false;
      }
      
      // Delete the note
      notesArray.delete(noteIndex, 1);
      
      // Save to local storage
      await this.saveToLocalStorage(parcelId, doc);
      
      // Try to sync if online
      const isConnected = await this.isConnected();
      if (isConnected) {
        try {
          // Try to delete on the server
          await this.apiService.delete(`/api/field-notes/${parcelId}/notes/${noteId}`);
          
          // Also sync the updated Yjs document
          await this.syncParcelData(parcelId);
        } catch (syncError) {
          console.error('Error syncing after deleting note:', syncError);
          
          // Add to offline queue
          await this.offlineQueue.enqueue(
            OperationType.DELETE_NOTE,
            { noteId, parcelId },
            2 // Medium priority
          );
        }
      } else {
        // Add to offline queue
        await this.offlineQueue.enqueue(
          OperationType.DELETE_NOTE,
          { noteId, parcelId },
          2 // Medium priority
        );
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting field note ${noteId} from parcel ${parcelId}:`, error);
      return false;
    }
  }
  
  /**
   * Get a property by ID
   */
  public async getProperty(propertyId: number): Promise<any> {
    try {
      return await this.apiService.get(`/api/properties/${propertyId}`);
    } catch (error) {
      console.error(`Error getting property ${propertyId}:`, error);
      return null;
    }
  }
}