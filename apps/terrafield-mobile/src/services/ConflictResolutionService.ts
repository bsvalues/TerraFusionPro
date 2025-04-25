/**
 * ConflictResolutionService for handling data conflicts
 * during synchronization in the TerraField Mobile application
 */

// Conflict Types
export enum ConflictType {
  FIELD_NOTE = 'field_note',
  PROPERTY_DATA = 'property_data',
  REPORT_DATA = 'report_data',
  PHOTO = 'photo',
  MEASUREMENT = 'measurement',
  SKETCH = 'sketch',
}

// Conflict interface
export interface Conflict {
  id: string;
  type: ConflictType;
  entityId: string;
  description: string;
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolution?: string;
  metadata?: any;
}

// ConflictResolutionService using the singleton pattern
export class ConflictResolutionService {
  private static instance: ConflictResolutionService;
  private conflicts: Map<string, Conflict> = new Map();

  // Private constructor to prevent direct instantiation
  private constructor() {}

  // Get singleton instance
  public static getInstance(): ConflictResolutionService {
    if (!ConflictResolutionService.instance) {
      ConflictResolutionService.instance = new ConflictResolutionService();
    }
    return ConflictResolutionService.instance;
  }

  // Add a new conflict
  public addConflict(
    type: ConflictType,
    entityId: string,
    description: string,
    metadata?: any
  ): Conflict {
    const id = `conflict_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const createdAt = new Date().toISOString();
    
    const conflict: Conflict = {
      id,
      type,
      entityId,
      description,
      createdAt,
      resolved: false,
      metadata,
    };
    
    this.conflicts.set(id, conflict);
    
    // Log the conflict
    console.log(`CONFLICT DETECTED: ${type} - ${description}`);
    
    return conflict;
  }

  // Get all conflicts
  public getAllConflicts(): Conflict[] {
    return Array.from(this.conflicts.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get unresolved conflicts
  public getUnresolvedConflicts(): Conflict[] {
    return this.getAllConflicts().filter(conflict => !conflict.resolved);
  }

  // Get conflicts by type
  public getConflictsByType(type: ConflictType): Conflict[] {
    return this.getAllConflicts().filter(conflict => conflict.type === type);
  }

  // Get conflicts by entity
  public getConflictsByEntity(entityId: string): Conflict[] {
    return this.getAllConflicts().filter(conflict => conflict.entityId === entityId);
  }

  // Resolve a conflict
  public resolveConflict(conflictId: string, resolution: string): boolean {
    const conflict = this.conflicts.get(conflictId);
    
    if (conflict && !conflict.resolved) {
      conflict.resolved = true;
      conflict.resolvedAt = new Date().toISOString();
      conflict.resolution = resolution;
      
      this.conflicts.set(conflictId, conflict);
      return true;
    }
    
    return false;
  }

  // Auto-resolve conflicts based on simple rules
  public autoResolveConflicts(): number {
    let resolvedCount = 0;
    
    // Get all unresolved conflicts
    const unresolvedConflicts = this.getUnresolvedConflicts();
    
    // Apply resolution rules
    for (const conflict of unresolvedConflicts) {
      // Simple resolution rule: prefer server data for field notes
      if (conflict.type === ConflictType.FIELD_NOTE) {
        const resolution = 'Automatically resolved: Server data takes precedence';
        if (this.resolveConflict(conflict.id, resolution)) {
          resolvedCount++;
        }
      }
      
      // Add more resolution rules for other conflict types as needed
    }
    
    return resolvedCount;
  }
}