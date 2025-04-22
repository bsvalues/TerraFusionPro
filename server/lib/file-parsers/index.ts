/**
 * File Parsers
 * 
 * This module contains file parsers for different appraisal report formats:
 * - PDF
 * - XML (MISMO)
 * - CSV
 * - JSON
 * - Work files
 * 
 * Each parser extracts structured data from different file formats and
 * normalizes it to match our database schema.
 */

import { extractFromPDF } from './pdf-parser';
import { extractFromMismoXML } from './mismo-xml-parser';
import { extractFromCSV } from './csv-parser';
import { extractFromJSON } from './json-parser';
import { extractFromWorkFile } from './work-file-parser';

// Supported file types
export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/xml',
  'text/xml',
  'text/csv',
  'application/vnd.ms-excel',
  'application/json',
  'application/octet-stream', // For various work file formats
];

// Main parser function that routes to the appropriate format-specific parser
export async function parseAppraisalFile(
  fileBuffer: Buffer, 
  fileName: string, 
  fileType: string
): Promise<{
  properties: any[],
  comparables: any[],
  reports: any[],
  errors: string[],
  warnings: string[],
  format: string
}> {
  try {
    console.log(`Parsing file: ${fileName} (${fileType})`);
    
    // Determine file format and route to appropriate parser
    if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      return await extractFromPDF(fileBuffer, fileName);
    }
    else if (
      fileType === 'application/xml' || 
      fileType === 'text/xml' || 
      fileName.toLowerCase().endsWith('.xml')
    ) {
      // Check if it's a MISMO XML format
      return await extractFromMismoXML(fileBuffer, fileName);
    }
    else if (
      fileType === 'text/csv' || 
      fileType === 'application/vnd.ms-excel' || 
      fileName.toLowerCase().endsWith('.csv')
    ) {
      return await extractFromCSV(fileBuffer, fileName);
    }
    else if (
      fileType === 'application/json' || 
      fileName.toLowerCase().endsWith('.json')
    ) {
      return await extractFromJSON(fileBuffer, fileName);
    }
    else if (
      // Check for various work file extensions
      fileName.toLowerCase().endsWith('.aci') ||
      fileName.toLowerCase().endsWith('.zap') ||
      fileName.toLowerCase().endsWith('.env') ||
      fileName.toLowerCase().endsWith('.xml') ||
      fileName.toLowerCase().endsWith('.alamode') ||
      fileName.toLowerCase().endsWith('.formnet')
    ) {
      return await extractFromWorkFile(fileBuffer, fileName);
    }
    else {
      throw new Error(`Unsupported file format: ${fileType}`);
    }
  } catch (error) {
    console.error(`Error parsing file: ${error}`);
    return {
      properties: [],
      comparables: [],
      reports: [],
      errors: [`Failed to parse file: ${error.message || 'Unknown error'}`],
      warnings: [],
      format: fileType
    };
  }
}

// Utility function to identify appraisal-related data in unstructured text
export function identifyAppraisalData(text: string): {
  addresses: string[],
  propertyTypes: string[],
  valuations: number[],
  dates: string[]
} {
  const addresses: string[] = [];
  const propertyTypes: string[] = [];
  const valuations: number[] = [];
  const dates: string[] = [];

  // Address detection - look for patterns like street numbers followed by street names
  // and city, state, zip combinations
  const addressRegex = /\b\d+\s+[A-Za-z0-9\s\.,]+(?:Road|Rd|Street|St|Avenue|Ave|Lane|Ln|Drive|Dr|Circle|Cir|Boulevard|Blvd|Highway|Hwy|Court|Ct|Place|Pl|Terrace|Ter|Way)[,\s]+[A-Za-z\s]+[,\s]+[A-Z]{2}[,\s]+\d{5}(?:-\d{4})?\b/gi;
  const addressMatches = text.match(addressRegex) || [];
  addresses.push(...addressMatches);

  // Property type detection
  const propertyTypeRegex = /\b(?:Single Family|Condominium|Condo|Townhouse|Multi-Family|Duplex|Triplex|Fourplex|PUD|Manufactured Home|Mobile Home|Vacant Land)\b/gi;
  const propertyTypeMatches = text.match(propertyTypeRegex) || [];
  propertyTypes.push(...propertyTypeMatches);

  // Valuation detection - look for dollar amounts, especially in contexts like "appraised value", "market value", etc.
  const valuationRegex = /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
  const valuationMatches = text.match(valuationRegex) || [];
  valuationMatches.forEach(match => {
    // Clean up and convert to number
    const value = Number(match.replace(/[$,]/g, ''));
    if (!isNaN(value) && value > 10000) { // Filter out small dollar amounts
      valuations.push(value);
    }
  });

  // Date detection
  const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/gi;
  const dateMatches = text.match(dateRegex) || [];
  dates.push(...dateMatches);

  return {
    addresses,
    propertyTypes,
    valuations,
    dates
  };
}

// Export all parsers for direct access if needed
export {
  extractFromPDF,
  extractFromMismoXML,
  extractFromCSV,
  extractFromJSON,
  extractFromWorkFile
};