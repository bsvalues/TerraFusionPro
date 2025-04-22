/**
 * Import Service
 * 
 * Handles the import of appraisal files in various formats and processes them
 * for data extraction and storage in the database.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../storage';
import { FileUploadMetadata, ImportResult } from './types';
import { identifyAppraisalData } from './file-parsers';

/**
 * Process an uploaded file for data extraction
 */
export async function processFile(fileMetadata: FileUploadMetadata): Promise<ImportResult> {
  try {
    console.log(`Processing file: ${fileMetadata.originalName}`);

    // Read the file from disk
    const filePath = fileMetadata.path;
    const fileBuffer = await fs.readFile(filePath);
    
    // Extract data from the file based on format
    const { 
      properties, 
      comparables, 
      reports, 
      adjustments = [], 
      errors, 
      warnings, 
      format 
    } = await identifyAppraisalData(fileBuffer, fileMetadata.originalName, fileMetadata.mimeType);

    // Initialize the import result
    const importResult: ImportResult = {
      fileId: fileMetadata.id,
      fileName: fileMetadata.originalName,
      format,
      status: 'success',
      dateProcessed: new Date(),
      importedEntities: {
        properties: [],
        comparables: [],
        reports: [],
        adjustments: []
      },
      errors,
      warnings
    };

    // Determine status based on errors
    if (errors.length > 0) {
      importResult.status = properties.length > 0 || comparables.length > 0 ? 'partial' : 'failed';
    }

    // Save extracted properties to the database
    for (const propertyData of properties) {
      try {
        // Assign userId (should be provided by authentication in production)
        propertyData.userId = propertyData.userId || 1; // Default user ID
        
        // Create the property
        const property = await storage.createProperty(propertyData);
        
        // Save the property ID
        if (property?.id) {
          importResult.importedEntities.properties.push(property.id);
        }
      } catch (error) {
        console.error('Error importing property:', error);
        importResult.errors.push(`Failed to import property: ${error.message || 'Unknown error'}`);
      }
    }

    // Save extracted reports to the database
    for (const reportData of reports) {
      try {
        // Assign userId and propertyId
        reportData.userId = reportData.userId || 1; // Default user ID
        
        // Link to an imported property if available
        if (importResult.importedEntities.properties.length > 0) {
          reportData.propertyId = importResult.importedEntities.properties[0];
        }
        
        // Ensure required fields
        reportData.status = reportData.status || 'imported';
        
        // Create the report
        const report = await storage.createAppraisalReport(reportData);
        
        // Save the report ID
        if (report?.id) {
          importResult.importedEntities.reports.push(report.id);
        }
      } catch (error) {
        console.error('Error importing report:', error);
        importResult.errors.push(`Failed to import report: ${error.message || 'Unknown error'}`);
      }
    }

    // Save extracted comparables to the database
    for (const comparableData of comparables) {
      try {
        // Ensure required fields
        comparableData.compType = comparableData.compType || 'comparable';
        
        // Link to a report if available
        if (importResult.importedEntities.reports.length > 0) {
          comparableData.reportId = importResult.importedEntities.reports[0];
        }
        
        // Create the comparable
        const comparable = await storage.createComparable(comparableData);
        
        // Save the comparable ID
        if (comparable?.id) {
          importResult.importedEntities.comparables.push(comparable.id);
        }
      } catch (error) {
        console.error('Error importing comparable:', error);
        importResult.errors.push(`Failed to import comparable: ${error.message || 'Unknown error'}`);
      }
    }

    // Save extracted adjustments to the database
    for (const adjustmentData of adjustments) {
      try {
        // Link to a report and comparable if available
        if (importResult.importedEntities.reports.length > 0) {
          adjustmentData.reportId = importResult.importedEntities.reports[0];
        }
        
        if (importResult.importedEntities.comparables.length > 0) {
          adjustmentData.comparableId = importResult.importedEntities.comparables[0];
        }
        
        // Create the adjustment
        const adjustment = await storage.createAdjustment(adjustmentData);
        
        // Save the adjustment ID
        if (adjustment?.id) {
          importResult.importedEntities.adjustments.push(adjustment.id);
        }
      } catch (error) {
        console.error('Error importing adjustment:', error);
        importResult.errors.push(`Failed to import adjustment: ${error.message || 'Unknown error'}`);
      }
    }

    // Save import results to the database
    const result = await storage.createFileImportResult({
      id: uuidv4(),
      fileId: importResult.fileId,
      fileName: importResult.fileName,
      format: importResult.format,
      dateProcessed: importResult.dateProcessed,
      importedEntities: importResult.importedEntities,
      status: importResult.status,
      errors: importResult.errors,
      warnings: importResult.warnings
    });

    console.log(`File processing complete: ${fileMetadata.originalName}`);
    return importResult;

  } catch (error) {
    console.error(`Error processing file: ${error}`);
    
    // Return failed import result
    return {
      fileId: fileMetadata.id,
      fileName: fileMetadata.originalName,
      format: 'unknown',
      status: 'failed',
      dateProcessed: new Date(),
      importedEntities: {
        properties: [],
        comparables: [],
        reports: [],
        adjustments: []
      },
      errors: [`File processing failed: ${error.message || 'Unknown error'}`],
      warnings: []
    };
  }
}

/**
 * Save an uploaded file to disk and return metadata
 */
export async function saveUploadedFile(file: Express.Multer.File): Promise<FileUploadMetadata> {
  // Generate unique ID for the file
  const fileId = uuidv4();
  
  // Create upload directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'uploads');
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error(`Error creating upload directory: ${error}`);
  }
  
  // Save the file to disk
  const fileExtension = path.extname(file.originalname);
  const fileName = `${fileId}${fileExtension}`;
  const filePath = path.join(uploadDir, fileName);
  
  await fs.writeFile(filePath, file.buffer);
  
  // Return the file metadata
  return {
    id: fileId,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    path: filePath,
    createdAt: new Date()
  };
}

/**
 * Get a list of import results
 */
export async function getImportResults(limit: number = 10, offset: number = 0): Promise<any[]> {
  return storage.getFileImportResults(limit, offset);
}

/**
 * Get a specific import result
 */
export async function getImportResult(id: string): Promise<any> {
  return storage.getFileImportResult(id);
}