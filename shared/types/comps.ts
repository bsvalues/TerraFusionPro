/**
 * Type definitions for comparable properties and snapshots
 */

/**
 * A record of fields and their values for a comparable property
 * This is flexible to accommodate different property types and data sources
 */
export interface ComparableFields {
  [key: string]: any;
}

/**
 * Represents a comparable property snapshot at a point in time
 */
export interface ComparableSnapshot {
  /**
   * Unique identifier for the snapshot
   */
  id: string;
  
  /**
   * The property ID this snapshot belongs to
   */
  propertyId: string;
  
  /**
   * Version number of the snapshot (if applicable)
   */
  version?: number;
  
  /**
   * Source of the snapshot (e.g., "MLS Import", "Manual Edit", "Form Push", "API Update")
   */
  source: string;
  
  /**
   * ISO string timestamp when the snapshot was created
   */
  createdAt: string;
  
  /**
   * Property fields and their values at this point in time
   */
  fields: ComparableFields;
}

/**
 * Request to push snapshot data to a form
 */
export interface PushSnapshotRequest {
  /**
   * ID of the snapshot to push
   */
  snapshotId: string;
  
  /**
   * ID of the form to push to
   */
  formId: string;
  
  /**
   * Mapping of form field IDs to snapshot field names
   */
  fieldMappings: Record<string, string>;
}

/**
 * Response from pushing a snapshot to a form
 */
export interface PushSnapshotResponse {
  /**
   * Whether the push was successful
   */
  success: boolean;
  
  /**
   * Optional error message if the push failed
   */
  error?: string;
  
  /**
   * New snapshot created as a result of the push
   */
  newSnapshot?: ComparableSnapshot;
}