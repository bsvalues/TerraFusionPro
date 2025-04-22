/**
 * Import Service
 * 
 * Coordinates the process of importing appraisal reports and work files,
 * extracting data, and storing it in the database.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { storage } from '../storage';
import { parseAppraisalFile } from './file-parsers';
import { EntityMappings, FileImportResult, FileUploadResult } from './types';

// Base directory for temporary file storage
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'tmp', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Handle file upload
 */
export async function handleFileUpload(
  file: Express.Multer.File
): Promise<FileUploadResult> {
  try {
    // Generate a unique ID for this upload
    const uploadId = crypto.randomUUID();
    
    // Create upload directory if it doesn't exist
    const uploadPath = path.join(UPLOAD_DIR, uploadId);
    fs.mkdirSync(uploadPath, { recursive: true });
    
    // Save file to disk
    const filePath = path.join(uploadPath, file.originalname);
    fs.writeFileSync(filePath, file.buffer);
    
    // Return upload result
    return {
      uploadId,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadDate: new Date(),
      status: 'uploaded'
    };
  } catch (error) {
    console.error(`Error handling file upload: ${error}`);
    throw new Error(`File upload failed: ${error.message}`);
  }
}

/**
 * Process imported file
 */
export async function processImportedFile(
  uploadId: string
): Promise<FileImportResult> {
  try {
    console.log(`Processing imported file with ID: ${uploadId}`);
    
    // Find the uploaded file
    const uploadPath = path.join(UPLOAD_DIR, uploadId);
    if (!fs.existsSync(uploadPath)) {
      throw new Error(`Upload directory not found: ${uploadPath}`);
    }
    
    // Get the file in the upload directory
    const files = fs.readdirSync(uploadPath);
    if (files.length === 0) {
      throw new Error('No files found in upload directory');
    }
    
    // Use the first file (should be only one)
    const fileName = files[0];
    const filePath = path.join(uploadPath, fileName);
    
    // Read file content
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determine file type (use file extension if mimetype not available)
    let fileType = '';
    if (fileName.endsWith('.pdf')) {
      fileType = 'application/pdf';
    } else if (fileName.endsWith('.xml')) {
      fileType = 'application/xml';
    } else if (fileName.endsWith('.csv')) {
      fileType = 'text/csv';
    } else if (fileName.endsWith('.json')) {
      fileType = 'application/json';
    } else {
      fileType = 'application/octet-stream';
    }
    
    // Parse the file
    console.log(`Parsing file: ${fileName} (${fileType})`);
    const parseResult = await parseAppraisalFile(fileBuffer, fileName, fileType);
    
    // Save extracted data to database
    console.log(`Saving extracted data to database...`);
    const importResult = await saveExtractedData(parseResult, uploadId, fileName);
    
    // Clean up temporary files
    try {
      fs.rmSync(uploadPath, { recursive: true, force: true });
    } catch (cleanupError) {
      console.warn(`Warning: Error cleaning up temporary files: ${cleanupError}`);
    }
    
    return importResult;
  } catch (error) {
    console.error(`Error processing imported file: ${error}`);
    
    // Create an error result
    return {
      id: crypto.randomUUID(),
      fileId: uploadId,
      fileName: 'Unknown',
      format: 'Unknown',
      dateProcessed: new Date(),
      importedEntities: {
        properties: 0,
        comparables: 0,
        reports: 0
      },
      status: 'failed',
      errors: [`Failed to process file: ${error.message || 'Unknown error'}`]
    };
  }
}

/**
 * Save extracted data to database
 */
async function saveExtractedData(
  parseResult: {
    properties: any[];
    comparables: any[];
    reports: any[];
    errors: string[];
    warnings: string[];
    format: string;
  },
  uploadId: string,
  fileName: string
): Promise<FileImportResult> {
  try {
    // Create a mapping to keep track of IDs
    const mappings: EntityMappings = {
      propertyIdMap: new Map<number, number>(),
      reportIdMap: new Map<number, number>(),
      comparableIdMap: new Map<number, number>()
    };
    
    // Save properties
    for (const propData of parseResult.properties) {
      try {
        // Set default user ID if not present
        if (!propData.userId) {
          propData.userId = 1;
        }
        
        // Check if property already exists (by address)
        let existingProp = null;
        if (propData.address && propData.city && propData.state) {
          const similarProps = await storage.getPropertiesByAddress(
            propData.address, 
            propData.city,
            propData.state
          );
          
          if (similarProps.length > 0) {
            existingProp = similarProps[0];
          }
        }
        
        if (existingProp) {
          // Use existing property ID
          mappings.propertyIdMap.set(0, existingProp.id);
          parseResult.warnings.push(`Property already exists: ${propData.address}, ${propData.city}, ${propData.state}`);
        } else {
          // Create new property
          const newProp = await storage.createProperty(propData);
          mappings.propertyIdMap.set(0, newProp.id);
        }
      } catch (error) {
        console.error(`Error saving property: ${error}`);
        parseResult.errors.push(`Failed to save property: ${error.message}`);
      }
    }
    
    // Save reports
    for (const reportData of parseResult.reports) {
      try {
        // Set default user ID if not present
        if (!reportData.userId) {
          reportData.userId = 1;
        }
        
        // Set property ID from mapping
        if (mappings.propertyIdMap.has(0)) {
          reportData.propertyId = mappings.propertyIdMap.get(0)!;
        } else if (parseResult.properties.length > 0) {
          // If we have property data but failed to save it, skip this report
          parseResult.warnings.push('Skipping report because property could not be saved');
          continue;
        } else {
          // If we don't have property data, we can't save the report
          parseResult.warnings.push('Skipping report because no property data was found');
          continue;
        }
        
        // Create new report
        const newReport = await storage.createAppraisalReport(reportData);
        mappings.reportIdMap.set(0, newReport.id);
      } catch (error) {
        console.error(`Error saving report: ${error}`);
        parseResult.errors.push(`Failed to save report: ${error.message}`);
      }
    }
    
    // Save comparables
    for (const compData of parseResult.comparables) {
      try {
        // Set report ID from mapping
        if (mappings.reportIdMap.has(0)) {
          compData.reportId = mappings.reportIdMap.get(0)!;
        } else if (parseResult.reports.length > 0) {
          // If we have report data but failed to save it, skip this comparable
          parseResult.warnings.push('Skipping comparable because report could not be saved');
          continue;
        } else {
          // If we don't have report data, we can't save the comparable
          parseResult.warnings.push('Skipping comparable because no report data was found');
          continue;
        }
        
        // Create new comparable
        const newComp = await storage.createComparable(compData);
        mappings.comparableIdMap.set(0, newComp.id);
      } catch (error) {
        console.error(`Error saving comparable: ${error}`);
        parseResult.errors.push(`Failed to save comparable: ${error.message}`);
      }
    }
    
    // Determine status based on errors and warnings
    let status: 'success' | 'partial' | 'failed' = 'success';
    if (parseResult.errors.length > 0) {
      status = parseResult.properties.length > 0 || parseResult.reports.length > 0 || parseResult.comparables.length > 0 
        ? 'partial' 
        : 'failed';
    }
    
    // Create import result
    const importResult: FileImportResult = {
      id: crypto.randomUUID(),
      fileId: uploadId,
      fileName,
      format: parseResult.format,
      dateProcessed: new Date(),
      importedEntities: {
        properties: mappings.propertyIdMap.size,
        reports: mappings.reportIdMap.size,
        comparables: mappings.comparableIdMap.size
      },
      status,
      errors: parseResult.errors.length > 0 ? parseResult.errors : undefined,
      warnings: parseResult.warnings.length > 0 ? parseResult.warnings : undefined
    };
    
    // Save import result to database for record-keeping
    await storage.saveImportResult(importResult);
    
    return importResult;
  } catch (error) {
    console.error(`Error saving extracted data: ${error}`);
    
    return {
      id: crypto.randomUUID(),
      fileId: uploadId,
      fileName,
      format: parseResult.format,
      dateProcessed: new Date(),
      importedEntities: {
        properties: 0,
        comparables: 0,
        reports: 0
      },
      status: 'failed',
      errors: [`Failed to save extracted data: ${error.message || 'Unknown error'}`]
    };
  }
}