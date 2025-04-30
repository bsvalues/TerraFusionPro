/**
 * Types for comparable property data and snapshot management
 */

/**
 * Represents a snapshot of a property's data at a point in time
 */
export interface ComparableSnapshot {
  id: string;
  propertyId: string;
  source: string;
  createdAt: string;
  fields: Record<string, any>;
}

/**
 * Represents an added or removed field in a snapshot comparison
 */
export interface FieldChange {
  field: string;
  value: any;
}

/**
 * Represents a changed field between two snapshots
 */
export interface FieldValueChange {
  field: string;
  fromValue: any;
  toValue: any;
}

/**
 * Represents the difference between two snapshots
 */
export interface SnapshotDifference {
  added: FieldChange[];
  removed: FieldChange[];
  changed: FieldValueChange[];
}

/**
 * Maps snapshot fields to form fields
 */
export interface FieldMapping {
  formId: string;
  snapshotId: string;
  fieldMappings: Record<string, string>;
}