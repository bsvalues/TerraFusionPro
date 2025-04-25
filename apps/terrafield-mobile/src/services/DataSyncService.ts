import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import * as Y from 'yjs';
import { ApiService } from './ApiService';

/**
 * Data structure for a sync queue item
 */
interface SyncQueueItem {
  id: string;
  documentId: string;
  documentType: 'fieldNotes' | 'propertyDetails' | 'report';
  updates: string; // Encoded updates
  timestamp: number;
  retries: number;
}

/**
 * DataSyncService handles the synchronization of CRDT documents
 * between the client and server, with offline support.
 */
export class DataSyncService {
  private static instance: DataSyncService;
  private apiService: ApiService;
  private syncQueue: SyncQueueItem[] = [];
  private isConnected: boolean = true;
  private documents: Map<string, Y.Doc> = new Map();
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private maxRetries = 5;
  private syncIntervalMs = 30000; // 30 seconds
  private isProcessing = false;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.apiService = ApiService.getInstance();
    this.loadSyncQueue();
    this.setupNetworkListeners();
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
   * Set up network connectivity listeners
   */
  private setupNetworkListeners(): void {
    NetInfo.addEventListener(state => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected ?? false;

      // If connectivity was restored, try to sync
      if (!wasConnected && this.isConnected) {
        this.processQueue();
      }
    });
  }

  /**
   * Start the sync interval
   */
  private startSyncInterval(): void {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isConnected && this.syncQueue.length > 0) {
        this.processQueue();
      }
    }, this.syncIntervalMs);
  }

  /**
   * Register a Y.js document with the sync service
   * 
   * @param docId Unique identifier for the document
   * @param doc Y.js document to register
   * @param docType Type of document (fieldNotes, propertyDetails, etc.)
   */
  public registerDocument(docId: string, doc: Y.Doc, docType: 'fieldNotes' | 'propertyDetails' | 'report'): void {
    // Store document in the map
    this.documents.set(docId, doc);

    // Set up observer to track changes
    doc.on('update', (update: Uint8Array) => {
      // Encode update as base64 string
      const updateBase64 = Buffer.from(update).toString('base64');
      
      // Create a queue item
      const queueItem: SyncQueueItem = {
        id: `${docId}-${Date.now()}`,
        documentId: docId,
        documentType: docType,
        updates: updateBase64,
        timestamp: Date.now(),
        retries: 0,
      };
      
      // Add to queue
      this.syncQueue.push(queueItem);
      this.saveSyncQueue();
      
      // Try to sync immediately if connected
      if (this.isConnected) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the sync queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process all items in the queue
      const itemsToProcess = [...this.syncQueue];
      const successfulItems: string[] = [];
      const failedItems: SyncQueueItem[] = [];

      for (const item of itemsToProcess) {
        try {
          await this.syncItem(item);
          successfulItems.push(item.id);
        } catch (error) {
          if (item.retries >= this.maxRetries) {
            // Remove from queue if max retries reached
            successfulItems.push(item.id);
            console.warn(`Max retries reached for sync item ${item.id}, removing from queue`);
          } else {
            // Increment retry count
            item.retries++;
            failedItems.push(item);
          }
        }
      }

      // Remove successful items from queue
      this.syncQueue = this.syncQueue.filter(item => !successfulItems.includes(item.id));
      
      // Save updated queue
      this.saveSyncQueue();
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Sync a specific item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    // Decode updates from base64
    const updates = Buffer.from(item.updates, 'base64');
    
    // Determine endpoint based on document type
    let endpoint = '';
    switch (item.documentType) {
      case 'fieldNotes':
        endpoint = `/api/parcels/${item.documentId}/sync`;
        break;
      case 'propertyDetails':
        endpoint = `/api/properties/${item.documentId}/sync`;
        break;
      case 'report':
        endpoint = `/api/reports/${item.documentId}/sync`;
        break;
    }

    // Send updates to server
    await this.apiService.post(endpoint, {
      updates: item.updates, // Send as base64
      timestamp: item.timestamp,
    });
  }

  /**
   * Apply remote updates to a local document
   * 
   * @param docId Document ID
   * @param updates Base64-encoded updates
   * @returns True if update was applied, false if document not found
   */
  public applyRemoteUpdates(docId: string, updates: string): boolean {
    const doc = this.documents.get(docId);
    if (!doc) {
      return false;
    }

    try {
      // Decode updates from base64
      const updateData = Buffer.from(updates, 'base64');
      
      // Apply updates to document
      Y.applyUpdate(doc, updateData);
      return true;
    } catch (error) {
      console.error('Error applying remote updates:', error);
      return false;
    }
  }

  /**
   * Load sync queue from persistent storage
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('syncQueue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  }

  /**
   * Save sync queue to persistent storage
   */
  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  /**
   * Get sync status for a document
   * 
   * @param docId Document ID
   * @returns Status object with pending updates count and last sync time
   */
  public getSyncStatus(docId: string): { pendingUpdates: number; lastSyncTime: number | null } {
    const pendingItems = this.syncQueue.filter(item => item.documentId === docId);
    const pendingUpdates = pendingItems.length;
    
    // Find the most recent successful sync (not in the queue)
    const lastSyncTimeStr = localStorage.getItem(`lastSync_${docId}`);
    const lastSyncTime = lastSyncTimeStr ? parseInt(lastSyncTimeStr, 10) : null;
    
    return {
      pendingUpdates,
      lastSyncTime,
    };
  }

  /**
   * Force sync for a specific document
   * 
   * @param docId Document ID
   * @returns True if sync was triggered, false if offline
   */
  public forceSyncDocument(docId: string): boolean {
    if (!this.isConnected) {
      return false;
    }
    
    const pendingItems = this.syncQueue.filter(item => item.documentId === docId);
    if (pendingItems.length > 0) {
      this.processQueue();
    }
    
    return true;
  }

  /**
   * Cleanup on service shutdown
   */
  public dispose(): void {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    // Save current queue state
    this.saveSyncQueue();
    
    // Clear document references
    this.documents.clear();
  }
}