import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';
import { v4 as uuidv4 } from 'uuid';
import { ApiService } from './ApiService';
import { NotificationService } from './NotificationService';
import { ConflictResolutionService } from './ConflictResolutionService';

// Field note interface
export interface FieldNote {
  id: string;
  parcelId: string;
  text: string;
  createdAt: string;
  createdBy: string;
  userId: number;
}

// Client state interface (for user presence awareness)
interface ClientState {
  userId: number;
  name: string;
  color: string;
  status: 'online' | 'idle' | 'offline';
  lastActive: number;
}

// WebSocket server details
const WS_SERVER_URL = process.env.WS_SERVER_URL || 'wss://api.terrafield.example.com/ws';

/**
 * Service to handle data synchronization with CRDT support
 */
export class DataSyncService {
  private static instance: DataSyncService;
  private docs: Map<string, Y.Doc> = new Map();
  private providers: Map<string, WebsocketProvider> = new Map();
  private persistences: Map<string, IndexeddbPersistence> = new Map();
  private apiService: ApiService;
  private notificationService: NotificationService;
  private conflictResolutionService: ConflictResolutionService;
  private isOnline: boolean = false;
  private clientState: ClientState | null = null;
  private syncQueue: Set<string> = new Set();
  private syncInProgress: boolean = false;

  /**
   * Private constructor to implement singleton pattern
   */
  private constructor() {
    this.apiService = ApiService.getInstance();
    this.notificationService = NotificationService.getInstance();
    this.conflictResolutionService = ConflictResolutionService.getInstance();
    this.isOnline = this.apiService.isConnected();
    this.initializeService();
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
   * Initialize service
   */
  private async initializeService(): Promise<void> {
    // Load queued docs for syncing
    const syncQueueJson = await AsyncStorage.getItem('terrafield_sync_queue');
    if (syncQueueJson) {
      const syncQueueArray = JSON.parse(syncQueueJson);
      this.syncQueue = new Set(syncQueueArray);
    }

    // Try to sync if online
    if (this.isOnline) {
      this.processDocumentSyncQueue();
    }
  }

  /**
   * Set current user client state for awareness
   */
  public setClientState(userId: number, name: string): void {
    const colors = [
      '#4C6AFF', // primary
      '#FF753A', // secondary
      '#00C689', // tertiary
      '#FFAA00', // warning
      '#0095FF', // info
      '#FF3D71', // error
    ];

    // Generate a consistent color based on userId
    const colorIndex = userId % colors.length;
    const color = colors[colorIndex];

    this.clientState = {
      userId,
      name,
      color,
      status: 'online',
      lastActive: Date.now(),
    };

    // Update awareness in all active providers
    this.providers.forEach(provider => {
      if (provider.awareness) {
        provider.awareness.setLocalState(this.clientState);
      }
    });
  }

  /**
   * Get a Y.js document
   */
  private async getDoc(docId: string): Promise<Y.Doc> {
    // If document already exists, return it
    if (this.docs.has(docId)) {
      return this.docs.get(docId)!;
    }

    // Create a new Y.js document
    const doc = new Y.Doc();
    this.docs.set(docId, doc);

    // Set up persistence
    const persistence = new IndexeddbPersistence(docId, doc);
    this.persistences.set(docId, persistence);

    await new Promise<void>((resolve) => {
      persistence.once('synced', () => {
        console.log(`Document ${docId} loaded from IndexedDB`);
        resolve();
      });
    });

    // If online, set up WebSocket provider
    if (this.isOnline) {
      try {
        const provider = new WebsocketProvider(WS_SERVER_URL, docId, doc, {
          connect: true,
        });

        // Set awareness state if available
        if (this.clientState && provider.awareness) {
          provider.awareness.setLocalState(this.clientState);
        }

        this.providers.set(docId, provider);
        
        // Listen for connection changes
        provider.on('status', (event: { status: string }) => {
          if (event.status === 'connected') {
            console.log(`WebSocket connection established for ${docId}`);
          } else {
            console.log(`WebSocket connection status for ${docId}: ${event.status}`);
          }
        });
      } catch (error) {
        console.error(`Error setting up WebSocket provider for ${docId}:`, error);
      }
    }

    return doc;
  }

  /**
   * Add a field note
   */
  public async addFieldNote(
    docId: string,
    parcelId: string,
    text: string,
    userId: number,
    createdBy: string
  ): Promise<FieldNote> {
    const doc = await this.getDoc(docId);
    const fieldNotes = doc.getArray<any>('fieldNotes');

    // Create the field note
    const fieldNote: FieldNote = {
      id: uuidv4(),
      parcelId,
      text,
      createdAt: new Date().toISOString(),
      createdBy,
      userId,
    };

    // Add to the Y.js document
    fieldNotes.push([fieldNote]);

    // Queue for syncing if WebSocket is not connected
    if (!this.isProvider(docId) || !this.isProviderConnected(docId)) {
      this.queueDocForSync(docId);
    }

    // If online but no WebSocket, try to sync immediately
    if (this.isOnline && !this.isProviderConnected(docId)) {
      this.syncDoc(docId, parcelId).catch(error => {
        console.error(`Error syncing document ${docId}:`, error);
      });
    }

    return fieldNote;
  }

  /**
   * Get all field notes
   */
  public async getFieldNotes(docId: string, parcelId: string): Promise<FieldNote[]> {
    const doc = await this.getDoc(docId);
    const fieldNotes = doc.getArray<any>('fieldNotes');
    
    // Convert to array
    const notesArray: FieldNote[] = [];
    fieldNotes.forEach(note => {
      if (note.parcelId === parcelId) {
        notesArray.push(note);
      }
    });
    
    return notesArray;
  }

  /**
   * Queue a document for synchronization
   */
  private queueDocForSync(docId: string): void {
    this.syncQueue.add(docId);
    this.saveSyncQueue();
  }

  /**
   * Save the sync queue to AsyncStorage
   */
  private async saveSyncQueue(): Promise<void> {
    try {
      const syncQueueArray = Array.from(this.syncQueue);
      await AsyncStorage.setItem('terrafield_sync_queue', JSON.stringify(syncQueueArray));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  /**
   * Process the document sync queue
   */
  private async processDocumentSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.size === 0) {
      return;
    }

    try {
      this.syncInProgress = true;
      const syncQueueArray = Array.from(this.syncQueue);

      for (const docId of syncQueueArray) {
        try {
          await this.syncDoc(docId);
          this.syncQueue.delete(docId);
        } catch (error) {
          console.error(`Error syncing document ${docId}:`, error);
        }
      }

      await this.saveSyncQueue();
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Check if a WebSocket provider exists for a document
   */
  private isProvider(docId: string): boolean {
    return this.providers.has(docId);
  }

  /**
   * Check if a WebSocket provider is connected
   */
  private isProviderConnected(docId: string): boolean {
    const provider = this.providers.get(docId);
    if (!provider) return false;
    return provider.wsconnected;
  }

  /**
   * Synchronize a document with the server
   */
  public async syncDoc(docId: string, parcelId?: string): Promise<boolean> {
    if (!this.isOnline) {
      this.queueDocForSync(docId);
      return false;
    }

    try {
      const doc = await this.getDoc(docId);
      
      // If WebSocket provider is connected, we're synced
      if (this.isProviderConnected(docId)) {
        return true;
      }
      
      // Get the updates as Uint8Array
      const update = Y.encodeStateAsUpdate(doc);
      
      // Convert to base64 for API transmission
      const updateBase64 = Buffer.from(update).toString('base64');
      
      // Send to server
      const response = await this.apiService.post(`/api/sync/${docId}`, {
        update: updateBase64,
      });
      
      // If server sent back updates, apply them
      if (response && response.updates) {
        for (const updateBase64 of response.updates) {
          const updateBinary = Buffer.from(updateBase64, 'base64');
          Y.applyUpdate(doc, new Uint8Array(updateBinary));
        }
      }
      
      // If there are conflicts, resolve them
      if (response && response.conflicts && response.conflicts.length > 0) {
        await this.resolveConflicts(docId, response.conflicts);
      }
      
      // Notify if requested
      if (parcelId && response && response.updates && response.updates.length > 0) {
        this.notificationService.sendSyncSuccessNotification(
          parcelId,
          response.updates.length,
        );
      }
      
      return true;
    } catch (error) {
      console.error(`Error syncing document ${docId} with server:`, error);
      
      // Queue for retry
      this.queueDocForSync(docId);
      
      // Notify if requested
      if (parcelId) {
        this.notificationService.sendSyncErrorNotification(
          parcelId,
          1, // Just one document failed
        );
      }
      
      return false;
    }
  }

  /**
   * Resolve conflicts between local and server changes
   */
  private async resolveConflicts(docId: string, conflicts: any[]): Promise<void> {
    try {
      const doc = await this.getDoc(docId);
      const fieldNotes = doc.getArray<any>('fieldNotes');
      
      // Use the conflict resolution service
      const resolvedConflicts = await this.conflictResolutionService.resolveFieldNoteConflicts(
        Array.from(fieldNotes),
        conflicts,
      );
      
      // Apply resolved conflicts to the document
      if (resolvedConflicts && resolvedConflicts.length > 0) {
        // Clear the array
        fieldNotes.delete(0, fieldNotes.length);
        
        // Insert resolved notes
        fieldNotes.insert(0, resolvedConflicts);
      }
    } catch (error) {
      console.error(`Error resolving conflicts for document ${docId}:`, error);
    }
  }

  /**
   * Disconnect and cleanup
   */
  public async disconnect(): Promise<void> {
    // Save all documents
    for (const [docId, doc] of this.docs.entries()) {
      const persistence = this.persistences.get(docId);
      if (persistence) {
        await persistence.whenSynced;
      }
    }
    
    // Disconnect all WebSocket providers
    for (const provider of this.providers.values()) {
      provider.disconnect();
    }
    
    // Clear the maps
    this.providers.clear();
    this.docs.clear();
    this.persistences.clear();
  }
}