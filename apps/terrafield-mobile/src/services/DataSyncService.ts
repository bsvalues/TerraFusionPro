/**
 * DataSyncService for handling data synchronization
 * between the mobile app and server in the TerraField Mobile application
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { ApiService } from './ApiService';
import { NotificationService, NotificationType } from './NotificationService';
import { ConflictResolutionService, ConflictType } from './ConflictResolutionService';
import { Base64 } from 'js-base64';

// Define Field Note interface
interface FieldNote {
  id?: string;
  parcelId: string;
  text: string;
  createdAt?: string;
  createdBy: string;
  userId: number;
}

// DataSyncService using the singleton pattern
export class DataSyncService {
  private static instance: DataSyncService;
  private apiService: ApiService;
  private notificationService: NotificationService;
  private conflictService: ConflictResolutionService;
  private syncQueue: Map<string, Function> = new Map();
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  
  // Private constructor to prevent direct instantiation
  private constructor() {
    this.apiService = ApiService.getInstance();
    this.notificationService = NotificationService.getInstance();
    this.conflictService = ConflictResolutionService.getInstance();
    
    // Initialize network connectivity listener
    this.setupNetworkListener();
    
    // Start periodic sync (every 5 minutes)
    this.startPeriodicSync(5 * 60 * 1000);
  }
  
  // Get singleton instance
  public static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }
  
  // Set up network connectivity listener
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected === true && state.isInternetReachable !== false;
      
      // If we just came back online, attempt to sync
      if (!wasOnline && this.isOnline) {
        this.syncPendingData();
      }
    });
  }
  
  // Start periodic sync
  private startPeriodicSync(interval: number): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingData();
      }
    }, interval);
  }
  
  // Stop periodic sync
  public stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  // Save data to local storage
  private async saveToLocalStorage(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to local storage [${key}]:`, error);
    }
  }
  
  // Load data from local storage
  private async loadFromLocalStorage(key: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error loading from local storage [${key}]:`, error);
      return null;
    }
  }
  
  // Sync pending data
  public async syncPendingData(): Promise<boolean> {
    if (this.syncInProgress || !this.isOnline) {
      return false;
    }
    
    this.syncInProgress = true;
    let success = true;
    
    try {
      this.notificationService.sendNotification(
        1, // Use current user ID in real app
        NotificationType.SYNC_STARTED,
        'Sync Started',
        'Synchronizing your data with the server...'
      );
      
      // Execute all pending sync operations in the queue
      for (const [key, syncOperation] of this.syncQueue.entries()) {
        try {
          await syncOperation();
          this.syncQueue.delete(key);
        } catch (error) {
          console.error(`Error syncing [${key}]:`, error);
          success = false;
        }
      }
      
      // Sync field notes
      await this.syncAllFieldNotes();
      
      // Add more sync operations for other data types
      
      if (success) {
        this.notificationService.sendNotification(
          1, // Use current user ID in real app
          NotificationType.SYNC_COMPLETED,
          'Sync Completed',
          'All your data has been synchronized with the server.'
        );
      } else {
        this.notificationService.sendNotification(
          1, // Use current user ID in real app
          NotificationType.SYNC_FAILED,
          'Sync Incomplete',
          'Some data couldn\'t be synchronized. Will retry later.'
        );
      }
    } catch (error) {
      console.error('Error during sync:', error);
      success = false;
      
      this.notificationService.sendNotification(
        1, // Use current user ID in real app
        NotificationType.SYNC_FAILED,
        'Sync Failed',
        'Failed to synchronize data with the server. Will retry later.'
      );
    } finally {
      this.syncInProgress = false;
    }
    
    return success;
  }
  
  // Sync all field notes
  private async syncAllFieldNotes(): Promise<void> {
    if (!this.isOnline) return;
    
    try {
      // Get all local parcel IDs with field notes
      const parcelIdsString = await AsyncStorage.getItem('parcel_ids_with_notes');
      const parcelIds = parcelIdsString ? JSON.parse(parcelIdsString) : [];
      
      // Sync each parcel's field notes
      for (const parcelId of parcelIds) {
        await this.syncFieldNotes(parcelId);
      }
    } catch (error) {
      console.error('Error syncing all field notes:', error);
      throw error;
    }
  }
  
  // Sync field notes for a specific parcel
  private async syncFieldNotes(parcelId: string): Promise<boolean> {
    if (!this.isOnline) {
      this.addToSyncQueue(`field_notes_${parcelId}`, () => this.syncFieldNotes(parcelId));
      return false;
    }
    
    try {
      // Get local field notes
      const localNotes = await this.getLocalFieldNotes(parcelId);
      
      // Get the last update we've received from the server
      const lastUpdateKey = `field_notes_last_update_${parcelId}`;
      const lastUpdate = await this.loadFromLocalStorage(lastUpdateKey) || '';
      
      // Send sync request to server with last update
      const response = await this.apiService.post(`/field-notes/${parcelId}/sync`, {
        lastUpdate
      });
      
      if (response && response.update) {
        // Apply server update to local data
        await this.applyServerUpdate(parcelId, response.update);
        
        // Save the new last update
        await this.saveToLocalStorage(lastUpdateKey, response.update);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error syncing field notes for parcel ${parcelId}:`, error);
      
      // Add to sync queue for retry later
      this.addToSyncQueue(`field_notes_${parcelId}`, () => this.syncFieldNotes(parcelId));
      
      // Create conflict record
      this.conflictService.addConflict(
        ConflictType.FIELD_NOTE,
        parcelId,
        `Failed to sync field notes for parcel ${parcelId}`
      );
      
      // Send notification about conflict
      this.notificationService.sendNotification(
        1, // Use current user ID in real app
        NotificationType.CONFLICT_DETECTED,
        'Sync Conflict',
        `Couldn't sync field notes for parcel ${parcelId}. Changes saved locally.`
      );
      
      return false;
    }
  }
  
  // Apply server update to local data
  private async applyServerUpdate(parcelId: string, encodedUpdate: string): Promise<void> {
    try {
      // In a real implementation, this would apply the CRDT update
      // For now, we'll just fetch the notes directly
      
      const response = await this.apiService.get(`/field-notes/${parcelId}/notes`);
      
      if (response) {
        const notesKey = `field_notes_${parcelId}`;
        await this.saveToLocalStorage(notesKey, response.notes || []);
      }
    } catch (error) {
      console.error(`Error applying server update for parcel ${parcelId}:`, error);
      throw error;
    }
  }
  
  // Add operation to sync queue
  private addToSyncQueue(key: string, operation: Function): void {
    this.syncQueue.set(key, operation);
  }
  
  // Get field notes
  public async getFieldNotes(parcelId: string): Promise<FieldNote[]> {
    try {
      // Try to get notes from local storage first
      const localNotes = await this.getLocalFieldNotes(parcelId);
      
      // If online, try to sync with server
      if (this.isOnline) {
        try {
          const response = await this.apiService.get(`/field-notes/${parcelId}/notes`);
          
          if (response && response.notes) {
            // Update local storage
            const notesKey = `field_notes_${parcelId}`;
            await this.saveToLocalStorage(notesKey, response.notes);
            
            return response.notes;
          }
        } catch (error) {
          console.error(`Error fetching field notes for parcel ${parcelId} from server:`, error);
          // Fall back to local notes
        }
      }
      
      return localNotes;
    } catch (error) {
      console.error(`Error getting field notes for parcel ${parcelId}:`, error);
      return [];
    }
  }
  
  // Get local field notes
  private async getLocalFieldNotes(parcelId: string): Promise<FieldNote[]> {
    try {
      const notesKey = `field_notes_${parcelId}`;
      const notes = await this.loadFromLocalStorage(notesKey);
      return notes || [];
    } catch (error) {
      console.error(`Error getting local field notes for parcel ${parcelId}:`, error);
      return [];
    }
  }
  
  // Add field note
  public async addFieldNote(note: FieldNote): Promise<boolean> {
    try {
      const parcelId = note.parcelId;
      
      // Set created time if not provided
      if (!note.createdAt) {
        note.createdAt = new Date().toISOString();
      }
      
      // Add note to local storage
      const localNotes = await this.getLocalFieldNotes(parcelId);
      const noteWithId = {
        ...note,
        id: note.id || `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      };
      
      const updatedNotes = [...localNotes, noteWithId];
      
      // Update local storage
      const notesKey = `field_notes_${parcelId}`;
      await this.saveToLocalStorage(notesKey, updatedNotes);
      
      // Update list of parcels with notes
      await this.addParcelIdWithNotes(parcelId);
      
      // If online, send to server immediately
      if (this.isOnline) {
        try {
          await this.apiService.put(`/field-notes/${parcelId}/notes`, {
            note: noteWithId
          });
          
          // Notification for successful add
          this.notificationService.sendNotification(
            1, // Use current user ID in real app
            NotificationType.FIELD_NOTE_ADDED,
            'Note Added',
            'Your field note has been saved and synced.'
          );
          
          return true;
        } catch (error) {
          console.error(`Error sending field note to server for parcel ${parcelId}:`, error);
          
          // Add to sync queue for retry later
          this.addToSyncQueue(`add_note_${noteWithId.id}`, 
            () => this.syncFieldNotes(parcelId));
          
          // Notification for offline add
          this.notificationService.sendNotification(
            1, // Use current user ID in real app
            NotificationType.FIELD_NOTE_ADDED,
            'Note Saved Locally',
            'Your field note has been saved locally and will sync when online.'
          );
        }
      } else {
        // Add to sync queue for when we're back online
        this.addToSyncQueue(`add_note_${noteWithId.id}`, 
          () => this.syncFieldNotes(parcelId));
        
        // Notification for offline add
        this.notificationService.sendNotification(
          1, // Use current user ID in real app
          NotificationType.FIELD_NOTE_ADDED,
          'Note Saved Locally',
          'Your field note has been saved locally and will sync when online.'
        );
      }
      
      return true;
    } catch (error) {
      console.error(`Error adding field note for parcel ${note.parcelId}:`, error);
      return false;
    }
  }
  
  // Delete field note
  public async deleteFieldNote(parcelId: string, noteId: string): Promise<boolean> {
    try {
      // Remove note from local storage
      const localNotes = await this.getLocalFieldNotes(parcelId);
      const updatedNotes = localNotes.filter(note => note.id !== noteId);
      
      // Update local storage
      const notesKey = `field_notes_${parcelId}`;
      await this.saveToLocalStorage(notesKey, updatedNotes);
      
      // If there are no more notes, remove parcel ID from list
      if (updatedNotes.length === 0) {
        await this.removeParcelIdWithNotes(parcelId);
      }
      
      // If online, send delete to server immediately
      if (this.isOnline) {
        try {
          await this.apiService.delete(`/field-notes/${parcelId}/notes/${noteId}`);
          
          // Notification for successful delete
          this.notificationService.sendNotification(
            1, // Use current user ID in real app
            NotificationType.FIELD_NOTE_DELETED,
            'Note Deleted',
            'Your field note has been deleted and synced.'
          );
          
          return true;
        } catch (error) {
          console.error(`Error deleting field note from server for parcel ${parcelId}:`, error);
          
          // Add to sync queue for retry later
          this.addToSyncQueue(`delete_note_${noteId}`, 
            () => this.syncFieldNotes(parcelId));
          
          // Notification for offline delete
          this.notificationService.sendNotification(
            1, // Use current user ID in real app
            NotificationType.FIELD_NOTE_DELETED,
            'Note Deleted Locally',
            'Your field note has been deleted locally and will sync when online.'
          );
        }
      } else {
        // Add to sync queue for when we're back online
        this.addToSyncQueue(`delete_note_${noteId}`, 
          () => this.syncFieldNotes(parcelId));
        
        // Notification for offline delete
        this.notificationService.sendNotification(
          1, // Use current user ID in real app
          NotificationType.FIELD_NOTE_DELETED,
          'Note Deleted Locally',
          'Your field note has been deleted locally and will sync when online.'
        );
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting field note ${noteId} for parcel ${parcelId}:`, error);
      return false;
    }
  }
  
  // Add parcel ID to list of parcels with notes
  private async addParcelIdWithNotes(parcelId: string): Promise<void> {
    try {
      const parcelIdsString = await AsyncStorage.getItem('parcel_ids_with_notes');
      const parcelIds = parcelIdsString ? JSON.parse(parcelIdsString) : [];
      
      if (!parcelIds.includes(parcelId)) {
        parcelIds.push(parcelId);
        await AsyncStorage.setItem('parcel_ids_with_notes', JSON.stringify(parcelIds));
      }
    } catch (error) {
      console.error(`Error adding parcel ID ${parcelId} to notes list:`, error);
    }
  }
  
  // Remove parcel ID from list of parcels with notes
  private async removeParcelIdWithNotes(parcelId: string): Promise<void> {
    try {
      const parcelIdsString = await AsyncStorage.getItem('parcel_ids_with_notes');
      const parcelIds = parcelIdsString ? JSON.parse(parcelIdsString) : [];
      
      const updatedParcelIds = parcelIds.filter(id => id !== parcelId);
      await AsyncStorage.setItem('parcel_ids_with_notes', JSON.stringify(updatedParcelIds));
    } catch (error) {
      console.error(`Error removing parcel ID ${parcelId} from notes list:`, error);
    }
  }
}