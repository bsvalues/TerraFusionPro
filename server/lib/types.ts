/**
 * Type definitions for file import module
 */

import { Partial as PartialType } from 'utility-types';
import { 
  User, InsertUser,
  Property, InsertProperty, 
  AppraisalReport, InsertAppraisalReport, 
  Comparable, InsertComparable,
  Adjustment, InsertAdjustment
} from '@shared/schema';

export {
  User, InsertUser,
  Property, InsertProperty,
  AppraisalReport as Report, InsertAppraisalReport as InsertReport,
  Comparable, InsertComparable,
  Adjustment, InsertAdjustment
};

/**
 * File upload results
 */
export interface FileUploadResult {
  uploadId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: Date;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
}

/**
 * File import processing results
 */
export interface FileImportResult {
  id: string;
  fileId: string;
  fileName: string;
  format: string;
  dateProcessed: Date;
  importedEntities: {
    properties: number;
    comparables: number;
    reports: number;
  };
  status: 'success' | 'partial' | 'failed';
  errors?: string[];
  warnings?: string[];
}

/**
 * Mapping for processed entities
 */
export interface EntityMappings {
  propertyIdMap: Map<number, number>; // Temporary ID -> Database ID
  reportIdMap: Map<number, number>; // Temporary ID -> Database ID
  comparableIdMap: Map<number, number>; // Temporary ID -> Database ID
}