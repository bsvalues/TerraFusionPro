/**
 * ConflictResolutionService
 * 
 * This service handles conflict resolution for offline-first synchronization
 * using CRDT (Conflict-free Replicated Data Types).
 */

import { NotificationService, NotificationType } from './NotificationService';

// Conflict types
export enum ConflictType {
  PROPERTY_UPDATE = 'property_update',
  REPORT_UPDATE = 'report_update',
  PHOTO_METADATA = 'photo_metadata',
  FIELD_NOTE = 'field_note',
  COMPARABLE_DATA = 'comparable_data',
  ADJUSTMENT_DATA = 'adjustment_data',
  MEASUREMENT_DATA = 'measurement_data',
}

// Conflict resolution strategies
export enum ResolutionStrategy {
  SERVER_WINS = 'server_wins',
  CLIENT_WINS = 'client_wins',
  MANUAL_MERGE = 'manual_merge',
  LATEST_TIMESTAMP_WINS = 'latest_timestamp_wins',
  MERGE_ARRAYS = 'merge_arrays',
  PROPERTY_BY_PROPERTY = 'property_by_property',
}

// Conflict interface
export interface Conflict {
  id: string;
  type: ConflictType;
  serverData: any;
  clientData: any;
  resolution?: ResolutionStrategy;
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  path?: string;
}

// Property conflict record
export interface PropertyConflict {
  property: string;
  serverValue: any;
  clientValue: any;
  resolved: boolean;
  resolution?: ResolutionStrategy;
}

export class ConflictResolutionService {
  private static instance: ConflictResolutionService;
  private notificationService: NotificationService;
  private conflicts: Map<string, Conflict> = new Map();
  
  private constructor() {
    this.notificationService = NotificationService.getInstance();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ConflictResolutionService {
    if (!ConflictResolutionService.instance) {
      ConflictResolutionService.instance = new ConflictResolutionService();
    }
    return ConflictResolutionService.instance;
  }
  
  /**
   * Register a conflict for later resolution
   */
  public registerConflict(
    type: ConflictType,
    serverData: any,
    clientData: any,
    path?: string
  ): string {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    const conflict: Conflict = {
      id,
      type,
      serverData,
      clientData,
      resolved: false,
      createdAt: new Date().toISOString(),
      path
    };
    
    this.conflicts.set(id, conflict);
    
    // Notify about the conflict
    this.notificationService.sendNotification(
      1, // TODO: Get actual user ID
      NotificationType.SYSTEM_MESSAGE,
      'Data Conflict Detected',
      `A conflict was detected in ${type} data. Please review and resolve the conflict.`,
      { conflictId: id, type }
    );
    
    return id;
  }
  
  /**
   * Resolve a conflict using the specified strategy
   */
  public resolveConflict(
    conflictId: string,
    strategy: ResolutionStrategy,
    manualData?: any
  ): any {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict with ID ${conflictId} not found`);
    }
    
    let resolvedData: any;
    
    switch (strategy) {
      case ResolutionStrategy.SERVER_WINS:
        resolvedData = conflict.serverData;
        break;
        
      case ResolutionStrategy.CLIENT_WINS:
        resolvedData = conflict.clientData;
        break;
        
      case ResolutionStrategy.MANUAL_MERGE:
        if (!manualData) {
          throw new Error('Manual data is required for MANUAL_MERGE strategy');
        }
        resolvedData = manualData;
        break;
        
      case ResolutionStrategy.LATEST_TIMESTAMP_WINS:
        resolvedData = this.resolveByTimestamp(conflict);
        break;
        
      case ResolutionStrategy.MERGE_ARRAYS:
        resolvedData = this.mergeArrays(conflict);
        break;
        
      case ResolutionStrategy.PROPERTY_BY_PROPERTY:
        resolvedData = this.resolvePropertyByProperty(conflict);
        break;
        
      default:
        throw new Error(`Unknown resolution strategy: ${strategy}`);
    }
    
    // Update the conflict record
    conflict.resolution = strategy;
    conflict.resolved = true;
    conflict.resolvedAt = new Date().toISOString();
    
    this.conflicts.set(conflictId, conflict);
    
    // Notify about the resolution
    this.notificationService.sendNotification(
      1, // TODO: Get actual user ID
      NotificationType.SYSTEM_MESSAGE,
      'Conflict Resolved',
      `The conflict in ${conflict.type} data has been resolved using ${strategy}.`,
      { conflictId, type: conflict.type }
    );
    
    return resolvedData;
  }
  
  /**
   * Get all conflicts
   */
  public getAllConflicts(): Conflict[] {
    return Array.from(this.conflicts.values());
  }
  
  /**
   * Get unresolved conflicts
   */
  public getUnresolvedConflicts(): Conflict[] {
    return Array.from(this.conflicts.values())
      .filter(conflict => !conflict.resolved);
  }
  
  /**
   * Get a specific conflict
   */
  public getConflict(id: string): Conflict | undefined {
    return this.conflicts.get(id);
  }
  
  /**
   * Auto-resolve conflicts based on predefined strategies
   * Returns the number of conflicts automatically resolved
   */
  public autoResolveConflicts(): number {
    let resolvedCount = 0;
    
    const unresolvedConflicts = this.getUnresolvedConflicts();
    
    for (const conflict of unresolvedConflicts) {
      try {
        // Determine the best strategy based on conflict type
        let strategy: ResolutionStrategy;
        
        switch (conflict.type) {
          case ConflictType.FIELD_NOTE:
            // For field notes, merge arrays to avoid losing data
            strategy = ResolutionStrategy.MERGE_ARRAYS;
            break;
            
          case ConflictType.PHOTO_METADATA:
            // For photo metadata, server usually has the most up-to-date info
            strategy = ResolutionStrategy.SERVER_WINS;
            break;
            
          case ConflictType.MEASUREMENT_DATA:
            // For measurements, use property-by-property resolution
            strategy = ResolutionStrategy.PROPERTY_BY_PROPERTY;
            break;
            
          default:
            // For other types, use latest timestamp
            strategy = ResolutionStrategy.LATEST_TIMESTAMP_WINS;
        }
        
        this.resolveConflict(conflict.id, strategy);
        resolvedCount++;
      } catch (error) {
        console.error(`Error auto-resolving conflict ${conflict.id}:`, error);
      }
    }
    
    return resolvedCount;
  }
  
  /**
   * Clear all resolved conflicts
   */
  public clearResolvedConflicts(): void {
    const unresolvedConflicts = new Map<string, Conflict>();
    
    for (const [id, conflict] of this.conflicts.entries()) {
      if (!conflict.resolved) {
        unresolvedConflicts.set(id, conflict);
      }
    }
    
    this.conflicts = unresolvedConflicts;
  }
  
  /**
   * Resolve by comparing timestamps
   */
  private resolveByTimestamp(conflict: Conflict): any {
    const serverTimestamp = this.extractTimestamp(conflict.serverData);
    const clientTimestamp = this.extractTimestamp(conflict.clientData);
    
    if (serverTimestamp > clientTimestamp) {
      return conflict.serverData;
    } else {
      return conflict.clientData;
    }
  }
  
  /**
   * Extract timestamp from data
   */
  private extractTimestamp(data: any): number {
    // Try to find a timestamp field in the data
    if (data.updatedAt) {
      return new Date(data.updatedAt).getTime();
    } else if (data.lastModified) {
      return new Date(data.lastModified).getTime();
    } else if (data.timestamp) {
      return new Date(data.timestamp).getTime();
    } else if (data.createdAt) {
      return new Date(data.createdAt).getTime();
    }
    
    // Default to current time if no timestamp found
    return Date.now();
  }
  
  /**
   * Merge arrays from client and server
   */
  private mergeArrays(conflict: Conflict): any[] {
    let serverArray: any[] = [];
    let clientArray: any[] = [];
    
    // Ensure we're working with arrays
    if (Array.isArray(conflict.serverData)) {
      serverArray = conflict.serverData;
    } else if (conflict.serverData && conflict.serverData.items && Array.isArray(conflict.serverData.items)) {
      serverArray = conflict.serverData.items;
    }
    
    if (Array.isArray(conflict.clientData)) {
      clientArray = conflict.clientData;
    } else if (conflict.clientData && conflict.clientData.items && Array.isArray(conflict.clientData.items)) {
      clientArray = conflict.clientData.items;
    }
    
    // Determine unique identifier field
    let idField = 'id';
    if (serverArray.length > 0) {
      if (serverArray[0].uuid) idField = 'uuid';
      else if (serverArray[0].uid) idField = 'uid';
    }
    
    // Create a map of server items by ID
    const serverItemsMap = new Map<string, any>();
    serverArray.forEach(item => {
      if (item[idField]) {
        serverItemsMap.set(item[idField], item);
      }
    });
    
    // Merge client items that don't exist on server
    const mergedArray = [...serverArray];
    
    clientArray.forEach(clientItem => {
      if (clientItem[idField]) {
        if (!serverItemsMap.has(clientItem[idField])) {
          // Add client item that doesn't exist on server
          mergedArray.push(clientItem);
        } else {
          // For items that exist in both, use server version
          // (server wins for individual items)
        }
      } else {
        // Items without IDs are added (could be new local items)
        mergedArray.push(clientItem);
      }
    });
    
    return mergedArray;
  }
  
  /**
   * Resolve conflicts property by property
   */
  private resolvePropertyByProperty(conflict: Conflict): any {
    // Start with a copy of server data
    const result = { ...conflict.serverData };
    
    // Find all conflicting properties
    const propertyConflicts: PropertyConflict[] = [];
    
    // Check each property in client data
    for (const [key, clientValue] of Object.entries(conflict.clientData)) {
      const serverValue = conflict.serverData[key];
      
      // If property exists in both and is different
      if (
        key in conflict.serverData && 
        !this.areValuesEqual(clientValue, serverValue)
      ) {
        propertyConflicts.push({
          property: key,
          serverValue,
          clientValue,
          resolved: false
        });
      } 
      // If property only exists in client
      else if (!(key in conflict.serverData)) {
        // Add client-only properties to result
        result[key] = clientValue;
      }
    }
    
    // Auto-resolve property conflicts
    for (const propConflict of propertyConflicts) {
      // Default strategy: server wins, unless it's a "lastUpdated" field
      let value = propConflict.serverValue;
      
      // For timestamp fields, take the newer one
      if (
        propConflict.property.includes('time') || 
        propConflict.property.includes('date') ||
        propConflict.property.includes('updated') ||
        propConflict.property.includes('modified')
      ) {
        const clientDate = new Date(propConflict.clientValue).getTime();
        const serverDate = new Date(propConflict.serverValue).getTime();
        
        value = clientDate > serverDate ? 
          propConflict.clientValue : propConflict.serverValue;
      }
      
      // For arrays, merge them
      if (
        Array.isArray(propConflict.clientValue) && 
        Array.isArray(propConflict.serverValue)
      ) {
        value = [...new Set([...propConflict.serverValue, ...propConflict.clientValue])];
      }
      
      result[propConflict.property] = value;
      propConflict.resolved = true;
      propConflict.resolution = ResolutionStrategy.PROPERTY_BY_PROPERTY;
    }
    
    return result;
  }
  
  /**
   * Compare values for equality
   */
  private areValuesEqual(a: any, b: any): boolean {
    // Handle dates
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }
    
    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      
      for (let i = 0; i < a.length; i++) {
        if (!this.areValuesEqual(a[i], b[i])) return false;
      }
      
      return true;
    }
    
    // Handle objects
    if (
      typeof a === 'object' && a !== null &&
      typeof b === 'object' && b !== null
    ) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.areValuesEqual(a[key], b[key])) return false;
      }
      
      return true;
    }
    
    // Handle primitives
    return a === b;
  }
}