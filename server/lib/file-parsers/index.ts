/**
 * File Parser Index
 * 
 * This module provides a central interface for parsing different file formats.
 * It identifies the file type and delegates to the appropriate parser.
 */

import { ParseResult, FileParser } from '../types';

/**
 * Collection of file parsers
 */
const parsers: FileParser[] = [];

/**
 * Identifies the format of the file and delegates to the appropriate parser
 */
export async function identifyAppraisalData(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = ''
): Promise<ParseResult> {
  // If no mime type is provided, try to infer from filename
  if (!mimeType) {
    mimeType = inferMimeType(fileName);
  }

  console.log(`Identifying file type: ${fileName} (${mimeType})`);
  
  // Check if we have a parser that can handle this file
  for (const parser of parsers) {
    if (parser.canParse(fileName, mimeType)) {
      try {
        // Parse using the appropriate parser
        console.log(`Using parser for file: ${fileName}`);
        return await parser.parse(fileBuffer, fileName);
      } catch (error) {
        console.error(`Error in parser: ${error}`);
        return createErrorResult(`Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`, fileName, mimeType);
      }
    }
  }

  // No suitable parser found
  console.warn(`No suitable parser found for file: ${fileName} (${mimeType})`);
  return createErrorResult(`Unsupported file format: ${mimeType || 'unknown'}`, fileName, mimeType);
}

/**
 * Creates an error result when parsing fails
 */
function createErrorResult(errorMessage: string, fileName: string, mimeType: string): ParseResult {
  return {
    properties: [],
    comparables: [],
    reports: [],
    adjustments: [],
    errors: [errorMessage],
    warnings: [],
    format: getFormatFromMime(mimeType) || 'unknown'
  };
}

/**
 * Convert mime type to friendly format name
 */
function getFormatFromMime(mimeType: string): string {
  if (!mimeType) return 'unknown';
  
  const mimeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'text/xml': 'XML',
    'application/xml': 'XML',
    'text/csv': 'CSV',
    'application/json': 'JSON',
    'application/vnd.mismo.residential-v2': 'MISMO XML',
    'application/octet-stream': 'Binary'
  };
  
  return mimeMap[mimeType] || mimeType;
}

/**
 * Infer mime type from file extension
 */
function inferMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  const extensionMap: Record<string, string> = {
    'pdf': 'application/pdf',
    'xml': 'application/xml',
    'csv': 'text/csv',
    'json': 'application/json',
    'txt': 'text/plain',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'alf': 'application/octet-stream', // ACI appraisal file
    'zap': 'application/octet-stream', // a.la.mode appraisal file
  };
  
  return extensionMap[extension] || 'application/octet-stream';
}

/**
 * Register all parser modules. Each parser should provide:
 * - canParse: function to determine if the parser can handle the file
 * - parse: function to extract data from the file
 */
export function registerParser(parser: FileParser): void {
  parsers.push(parser);
}

/**
 * Extract comparable sales data from text
 * This is a helper function used by multiple parsers
 */
export function extractComparableSales(
  text: string,
  comparables: any[]
): void {
  // Implementation will depend on the specific format being parsed
  // This will be expanded as parsers are developed
}

// Register built-in parsers
// These lines will be uncommented and the parsers will be implemented as development progresses
// 
// import { pdfParser } from './pdf-parser';
// import { xmlParser } from './mismo-xml-parser';
// import { csvParser } from './csv-parser';
// import { jsonParser } from './json-parser';
// import { workFileParser } from './work-file-parser';
// 
// registerParser(pdfParser);
// registerParser(xmlParser);
// registerParser(csvParser);
// registerParser(jsonParser);
// registerParser(workFileParser);