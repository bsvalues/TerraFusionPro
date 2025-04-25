import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { ApiService } from './ApiService';
import { NotificationService } from './NotificationService';
import { ConflictResolutionService } from './ConflictResolutionService';

/**
 * Interface for a field note
 */
export interface FieldNote {
  id: string;
  text: string;
  userId: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for user presence
 */
export interface UserPresence {
  userId: number;
  name: string;
  color: string;
  status: 'online' | 'idle' | 'offline';
  lastActive: number;
}

/**
 * Service to handle data synchronization with CRDT
 */
export class DataSyncService {
  private static instance: DataSyncService;
  private documents: Map<string, Y.Doc> = new Map();
  private providers: Map<string, WebsocketProvider> = new Map();
  private persistences: Map<string, IndexeddbPersistence> = new Map();
  private activeUsers: Map<string, UserPresence[]> = new Map();
  private clientId: string;
  private clientState: { userId: number; name: string } | null = null;
  private offlineChanges: Map<string, any[]> = new Map();
  private apiService: ApiService;
  private notificationService: NotificationService;
  private conflictResolutionService: ConflictResolutionService;
  private wsServerUrl: string;
  private colors = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#33A8FF',
    '#A833FF', '#FF8333', '#33FFC1', '#C133FF', '#FFDA33',
  ];
  
  /**
   * Private constructor to implement singleton pattern
   */
  private constructor() {
    this.clientId = uuidv4();
    this.apiService = ApiService.getInstance();
    this.notificationService = NotificationService.getInstance();
    this.conflictResolutionService = ConflictResolutionService.getInstance();
    this.wsServerUrl = process.env.WS_SERVER_URL || 'wss://sync.terrafield.example.com';
    
    // Load offline changes
    this.loadOfflineChanges();
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
   * Set client state
   */
  public setClientState(userId: number, name: string): void {
    this.clientState = { userId, name };
  }
  
  /**
   * Get a Y.js document
   */
  private getDocument(docId: string): Y.Doc {
    if (!this.documents.has(docId)) {
      const doc = new Y.Doc();
      this.documents.set(docId, doc);
      
      // Setup persistence
      this.setupPersistence(docId, doc);
      
      // Try to connect to WebSocket if online
      if (this.apiService.isConnected()) {
        this.setupProvider(docId, doc);
      }
    }
    
    return this.documents.get(docId)!;
  }
  
  /**
   * Set up IndexedDB persistence
   */
  private setupPersistence(docId: string, doc: Y.Doc): void {
    try {
      const persistence = new IndexeddbPersistence(`terrafield_${docId}`, doc);
      
      persistence.on('synced', () => {
        console.log(`[DataSyncService] Document ${docId} synced from IndexedDB`);
      });
      
      this.persistences.set(docId, persistence);
    } catch (error) {
      console.error(`[DataSyncService] Error setting up persistence for ${docId}:`, error);
    }
  }
  
  /**
   * Set up WebSocket provider
   */
  private setupProvider(docId: string, doc: Y.Doc): void {
    try {
      // If a provider already exists, disconnect it first
      if (this.providers.has(docId)) {
        this.providers.get(docId)!.disconnect();
        this.providers.delete(docId);
      }
      
      const provider = new WebsocketProvider(this.wsServerUrl, docId, doc, {
        connect: true,
        params: {
          client_id: this.clientId,
          user_id: this.clientState?.userId || 0,
          user_name: this.clientState?.name || 'Anonymous',
        },
      });
      
      provider.on('status', (event: { status: string }) => {
        console.log(`[DataSyncService] WebSocket status for ${docId}:`, event.status);
        
        if (event.status === 'connected') {
          // When connected, check for offline changes
          this.applyOfflineChanges(docId);
        }
      });
      
      provider.awareness.on('change', () => {
        this.updateActiveUsers(docId, provider);
      });
      
      // Set local state
      if (this.clientState) {
        provider.awareness.setLocalState({
          user: {
            id: this.clientState.userId,
            name: this.clientState.name,
            color: this.getRandomColor(),
          },
          cursor: {},
        });
      }
      
      this.providers.set(docId, provider);
    } catch (error) {
      console.error(`[DataSyncService] Error setting up WebSocket provider for ${docId}:`, error);
    }
  }
  
  /**
   * Get a random color for user representation
   */
  private getRandomColor(): string {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }
  
  /**
   * Update active users
   */
  private updateActiveUsers(docId: string, provider: WebsocketProvider): void {
    const states = provider.awareness.getStates();
    const users: UserPresence[] = [];
    
    states.forEach((state, clientId) => {
      if (state.user) {
        users.push({
          userId: state.user.id,
          name: state.user.name,
          color: state.user.color,
          status: 'online',
          lastActive: Date.now(),
        });
      }
    });
    
    this.activeUsers.set(docId, users);
  }
  
  /**
   * Get active users
   */
  public getActiveUsers(docId: string): UserPresence[] {
    return this.activeUsers.get(docId) || [];
  }
  
  /**
   * Load offline changes from storage
   */
  private async loadOfflineChanges(): Promise<void> {
    try {
      const offlineChangesJson = await AsyncStorage.getItem('terrafield_offline_changes');
      if (offlineChangesJson) {
        const parsedChanges = JSON.parse(offlineChangesJson);
        Object.keys(parsedChanges).forEach(docId => {
          this.offlineChanges.set(docId, parsedChanges[docId]);
        });
      }
    } catch (error) {
      console.error('[DataSyncService] Error loading offline changes:', error);
    }
  }
  
  /**
   * Save offline changes to storage
   */
  private async saveOfflineChanges(): Promise<void> {
    try {
      const changes: Record<string, any[]> = {};
      this.offlineChanges.forEach((value, key) => {
        changes[key] = value;
      });
      
      await AsyncStorage.setItem('terrafield_offline_changes', JSON.stringify(changes));
    } catch (error) {
      console.error('[DataSyncService] Error saving offline changes:', error);
    }
  }
  
  /**
   * Apply offline changes to a document
   */
  private async applyOfflineChanges(docId: string): Promise<void> {
    if (!this.offlineChanges.has(docId)) {
      return;
    }
    
    const changes = this.offlineChanges.get(docId) || [];
    if (changes.length === 0) {
      return;
    }
    
    try {
      console.log(`[DataSyncService] Applying ${changes.length} offline changes to ${docId}`);
      
      // Apply changes to the Yjs document
      const doc = this.getDocument(docId);
      const fieldNotesArray = doc.getArray('fieldNotes');
      
      changes.forEach(change => {
        if (change.type === 'add_note') {
          // Add field note
          fieldNotesArray.push([change.note]);
        } else if (change.type === 'update_note') {
          // Update field note
          const index = fieldNotesArray.toArray().findIndex((note: any) => note.id === change.noteId);
          if (index !== -1) {
            fieldNotesArray.delete(index, 1);
            fieldNotesArray.insert(index, [change.note]);
          }
        } else if (change.type === 'delete_note') {
          // Delete field note
          const index = fieldNotesArray.toArray().findIndex((note: any) => note.id === change.noteId);
          if (index !== -1) {
            fieldNotesArray.delete(index, 1);
          }
        }
      });
      
      // Clear offline changes for this document
      this.offlineChanges.set(docId, []);
      await this.saveOfflineChanges();
      
      this.notificationService.sendSyncSuccessNotification(
        'field notes',
        changes.length
      );
    } catch (error) {
      console.error(`[DataSyncService] Error applying offline changes to ${docId}:`, error);
      
      this.notificationService.sendSyncErrorNotification(
        'field notes',
        'Failed to apply offline changes. Will try again later.'
      );
    }
  }
  
  /**
   * Add a field note
   */
  public async addFieldNote(
    docId: string,
    parcelId: string,
    text: string,
    userId: number,
    userName: string
  ): Promise<void> {
    if (!text.trim()) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    
    // Create field note object
    const note: FieldNote = {
      id: uuidv4(),
      text: text.trim(),
      userId,
      createdBy: userName,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    try {
      // Get document
      const doc = this.getDocument(docId);
      const fieldNotesArray = doc.getArray('fieldNotes');
      
      // Add note to the document
      fieldNotesArray.push([note]);
      
      // If offline, store the change for later sync
      if (!this.apiService.isConnected() || !this.providers.has(docId) || !this.providers.get(docId)!.wsconnected) {
        // Add to offline changes
        const changes = this.offlineChanges.get(docId) || [];
        changes.push({
          type: 'add_note',
          note,
          timestamp: Date.now(),
        });
        
        this.offlineChanges.set(docId, changes);
        await this.saveOfflineChanges();
      }
    } catch (error) {
      console.error(`[DataSyncService] Error adding field note to ${docId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get field notes from a document
   */
  public async getFieldNotes(docId: string, parcelId: string): Promise<FieldNote[]> {
    try {
      // Get document
      const doc = this.getDocument(docId);
      const fieldNotesArray = doc.getArray('fieldNotes');
      
      // Convert to array
      const notes = fieldNotesArray.toArray() as FieldNote[];
      
      // If we're connected, also try to fetch from API and merge
      if (this.apiService.isConnected()) {
        try {
          const apiNotes = await this.apiService.get<FieldNote[]>(`/api/properties/${parcelId}/notes`);
          
          // If we got notes from API, merge with local notes
          if (apiNotes && apiNotes.length > 0) {
            // Use conflict resolution service to merge notes
            const mergedNotes = await this.conflictResolutionService.resolveFieldNoteConflicts(
              notes,
              apiNotes
            );
            
            // Update the document with merged notes
            if (mergedNotes.length > 0) {
              fieldNotesArray.delete(0, fieldNotesArray.length);
              fieldNotesArray.push(mergedNotes);
            }
            
            return mergedNotes;
          }
        } catch (error) {
          console.error(`[DataSyncService] Error fetching field notes from API for ${parcelId}:`, error);
          // Continue with local notes
        }
      }
      
      return notes;
    } catch (error) {
      console.error(`[DataSyncService] Error getting field notes from ${docId}:`, error);
      return [];
    }
  }
  
  /**
   * Sync a document with the server
   */
  public async syncDoc(docId: string, parcelId: string): Promise<void> {
    if (!this.apiService.isConnected()) {
      throw new Error('Cannot sync while offline');
    }
    
    try {
      // Get document
      const doc = this.getDocument(docId);
      
      // If we have a WebSocket provider, make sure it's connected
      if (!this.providers.has(docId)) {
        this.setupProvider(docId, doc);
      } else if (!this.providers.get(docId)!.wsconnected) {
        this.providers.get(docId)!.disconnect();
        this.setupProvider(docId, doc);
      }
      
      // Apply any offline changes
      await this.applyOfflineChanges(docId);
      
      // Get field notes from document
      const fieldNotesArray = doc.getArray('fieldNotes');
      const notes = fieldNotesArray.toArray() as FieldNote[];
      
      // Sync with API
      if (notes.length > 0) {
        // For each note, make sure it's synced with the server
        for (const note of notes) {
          try {
            await this.apiService.post(`/api/properties/${parcelId}/notes`, note);
          } catch (error) {
            console.error(`[DataSyncService] Error syncing note ${note.id} to API:`, error);
            // Continue with next note
          }
        }
      }
      
      // Get notes from API and merge
      const apiNotes = await this.apiService.get<FieldNote[]>(`/api/properties/${parcelId}/notes`);
      
      // Merge notes using conflict resolution service
      const mergedNotes = await this.conflictResolutionService.resolveFieldNoteConflicts(
        notes,
        apiNotes
      );
      
      // Update the document with merged notes
      if (mergedNotes.length > 0) {
        fieldNotesArray.delete(0, fieldNotesArray.length);
        fieldNotesArray.push(mergedNotes);
      }
    } catch (error) {
      console.error(`[DataSyncService] Error syncing document ${docId}:`, error);
      throw error;
    }
  }
  
  /**
   * Disconnect all providers and persistence
   */
  public async disconnect(): Promise<void> {
    try {
      // Disconnect all providers
      this.providers.forEach(provider => {
        provider.disconnect();
      });
      
      this.providers.clear();
      
      // Close all persistences
      await Promise.all(
        Array.from(this.persistences.values()).map(persistence => persistence.destroy())
      );
      
      this.persistences.clear();
      this.documents.clear();
    } catch (error) {
      console.error('[DataSyncService] Error disconnecting:', error);
    }
  }
}