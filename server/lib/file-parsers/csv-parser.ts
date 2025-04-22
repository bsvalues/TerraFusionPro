/**
 * CSV Parser
 * 
 * Extracts data from CSV files containing appraisal data, comparable sales,
 * or property information.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as papa from 'papaparse';
import { Partial as PartialType } from 'utility-types';
import { Property, InsertProperty, Report, InsertReport, Comparable, InsertComparable } from '../types';

/**
 * Extract data from CSV files
 */
export async function extractFromCSV(
  fileBuffer: Buffer,
  fileName: string
): Promise<{
  properties: PartialType<InsertProperty>[],
  comparables: PartialType<InsertComparable>[],
  reports: PartialType<InsertReport>[],
  errors: string[],
  warnings: string[],
  format: string
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const properties: PartialType<InsertProperty>[] = [];
  const comparables: PartialType<InsertComparable>[] = [];
  const reports: PartialType<InsertReport>[] = [];
  
  try {
    console.log(`Extracting data from CSV: ${fileName}`);
    
    // Parse CSV content
    const csvString = fileBuffer.toString('utf-8');
    const result = papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim()
    });
    
    if (result.errors && result.errors.length > 0) {
      for (const error of result.errors) {
        warnings.push(`CSV parse warning: ${error.message} at row ${error.row}`);
      }
    }
    
    // Get the parsed data
    const rows = result.data as any[];
    
    if (rows.length === 0) {
      warnings.push('CSV file has no data rows');
      return {
        properties,
        comparables,
        reports,
        errors,
        warnings,
        format: 'CSV'
      };
    }
    
    console.log(`Parsed ${rows.length} rows from CSV`);
    
    // Determine CSV type based on headers
    const headers = Object.keys(rows[0]);
    const csvType = determineCsvType(headers);
    console.log(`CSV type detected: ${csvType}`);
    
    // Process CSV based on detected type
    switch (csvType) {
      case 'properties':
        extractPropertiesFromCSV(rows, properties);
        break;
      case 'comparables':
        extractComparablesFromCSV(rows, comparables);
        break;
      case 'reports':
        extractReportsFromCSV(rows, properties, reports);
        break;
      case 'mixed':
        extractMixedDataFromCSV(rows, properties, comparables, reports);
        break;
      default:
        errors.push('Unable to determine CSV format from headers');
    }
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: `CSV - ${csvType}`
    };
  } catch (error) {
    console.error(`Error extracting data from CSV: ${error}`);
    errors.push(`CSV extraction failed: ${error.message || 'Unknown error'}`);
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: 'CSV'
    };
  }
}

/**
 * Determine CSV type based on headers
 */
function determineCsvType(headers: string[]): 'properties' | 'comparables' | 'reports' | 'mixed' | 'unknown' {
  // Normalize headers for case-insensitive comparison
  const normalizedHeaders = headers.map(h => h.toLowerCase());
  
  // Check for property-specific headers
  const propertyHeaders = [
    'address', 'property address', 'street', 'street address',
    'city', 'state', 'zip', 'zipcode', 'zip code',
    'bedrooms', 'bathrooms', 'sqft', 'square feet', 'year built'
  ];
  
  // Check for comparable-specific headers
  const comparableHeaders = [
    'comp', 'comparable', 'sale price', 'saleprice', 'sale date', 'saledate',
    'distance', 'proximity', 'adjustment', 'adjusted price'
  ];
  
  // Check for report-specific headers
  const reportHeaders = [
    'report id', 'reportid', 'form type', 'formtype', 'appraiser',
    'appraisal date', 'effective date', 'market value', 'marketvalue'
  ];
  
  // Count matches for each type
  const propertyMatches = normalizedHeaders.filter(h => 
    propertyHeaders.some(ph => h.includes(ph))
  ).length;
  
  const comparableMatches = normalizedHeaders.filter(h => 
    comparableHeaders.some(ch => h.includes(ch))
  ).length;
  
  const reportMatches = normalizedHeaders.filter(h => 
    reportHeaders.some(rh => h.includes(rh))
  ).length;
  
  // Determine type based on highest match count
  if (propertyMatches > 0 && comparableMatches > 0 && reportMatches > 0) {
    return 'mixed';
  } else if (propertyMatches > comparableMatches && propertyMatches > reportMatches) {
    return 'properties';
  } else if (comparableMatches > propertyMatches && comparableMatches > reportMatches) {
    return 'comparables';
  } else if (reportMatches > propertyMatches && reportMatches > comparableMatches) {
    return 'reports';
  } else if (propertyMatches > 0) {
    return 'properties';
  } else if (comparableMatches > 0) {
    return 'comparables';
  } else if (reportMatches > 0) {
    return 'reports';
  }
  
  return 'unknown';
}

/**
 * Extract property data from CSV rows
 */
function extractPropertiesFromCSV(
  rows: any[],
  properties: PartialType<InsertProperty>[]
): void {
  for (const row of rows) {
    // Try multiple possible header names for each field
    const address = findFirstValue(row, [
      'Address', 'Property Address', 'Street', 'Street Address', 'Property Street'
    ]);
    
    const city = findFirstValue(row, [
      'City', 'Property City', 'Municipality'
    ]);
    
    const state = findFirstValue(row, [
      'State', 'Property State', 'St', 'Province'
    ]);
    
    const zipCode = findFirstValue(row, [
      'Zip', 'ZipCode', 'Zip Code', 'Postal Code', 'PostalCode'
    ]);
    
    const propertyType = findFirstValue(row, [
      'Property Type', 'PropertyType', 'Type', 'Style'
    ]) || 'Unknown';
    
    const yearBuilt = extractNumberField(row, [
      'Year Built', 'YearBuilt', 'Year', 'Construction Year'
    ]);
    
    const grossLivingArea = extractNumberField(row, [
      'Square Feet', 'SquareFeet', 'Sq Ft', 'SqFt', 'GLA', 'Gross Living Area',
      'Living Area', 'Building Size'
    ]);
    
    const lotSize = extractNumberField(row, [
      'Lot Size', 'LotSize', 'Lot Area', 'Land Area', 'Acres', 'Lot Size SF'
    ]);
    
    const bedrooms = extractNumberField(row, [
      'Bedrooms', 'Beds', 'Bed', 'BR', 'Bedroom Count'
    ]);
    
    const bathrooms = extractNumberField(row, [
      'Bathrooms', 'Baths', 'Bath', 'BA', 'Bathroom Count', 'Full Baths', 'FullBaths'
    ]);
    
    // Create property object if we have at least address or city+state
    if (address || (city && state)) {
      properties.push({
        userId: 1, // Default user ID
        address: address || '',
        city: city || '',
        state: state || '',
        zipCode: zipCode || '',
        propertyType,
        yearBuilt,
        grossLivingArea,
        lotSize,
        bedrooms,
        bathrooms
      });
    }
  }
}

/**
 * Extract comparable data from CSV rows
 */
function extractComparablesFromCSV(
  rows: any[],
  comparables: PartialType<InsertComparable>[]
): void {
  for (const row of rows) {
    // Try multiple possible header names for each field
    const address = findFirstValue(row, [
      'Address', 'Comp Address', 'Comparable Address', 'Street', 'Street Address'
    ]);
    
    const city = findFirstValue(row, [
      'City', 'Comp City', 'Comparable City', 'Municipality'
    ]);
    
    const state = findFirstValue(row, [
      'State', 'Comp State', 'Comparable State', 'St', 'Province'
    ]);
    
    const zipCode = findFirstValue(row, [
      'Zip', 'ZipCode', 'Zip Code', 'Postal Code', 'PostalCode'
    ]);
    
    const compType = findFirstValue(row, [
      'Type', 'Comp Type', 'Comparable Type', 'Sale Type'
    ]) || 'sale';
    
    const salePrice = extractNumberField(row, [
      'Sale Price', 'SalePrice', 'Price', 'Amount', 'Transaction Amount'
    ]);
    
    // Try to extract sale date
    let saleDate: Date | undefined;
    const saleDateStr = findFirstValue(row, [
      'Sale Date', 'SaleDate', 'Date', 'Transaction Date', 'Closing Date'
    ]);
    
    if (saleDateStr) {
      try {
        saleDate = new Date(saleDateStr);
      } catch (e) {
        // Invalid date format, ignore
      }
    }
    
    const proximityToSubject = findFirstValue(row, [
      'Proximity', 'Distance', 'Distance to Subject', 'Prox', 'Miles'
    ]);
    
    // Create comparable object if we have at least address or city+state
    if (address || (city && state)) {
      comparables.push({
        reportId: 0, // Will be set later when linked to a report
        compType: compType as 'sale' | 'listing' | 'pending',
        address: address || '',
        city: city || '',
        state: state || '',
        zipCode: zipCode || '',
        proximityToSubject,
        salePrice,
        saleDate,
        // Add other fields as needed
        grossLivingArea: extractNumberField(row, ['Square Feet', 'SquareFeet', 'Sq Ft', 'SqFt', 'GLA']),
        bedrooms: extractNumberField(row, ['Bedrooms', 'Beds', 'Bed', 'BR']),
        bathrooms: extractNumberField(row, ['Bathrooms', 'Baths', 'Bath', 'BA']),
        yearBuilt: extractNumberField(row, ['Year Built', 'YearBuilt', 'Year'])
      });
    }
  }
}

/**
 * Extract report data from CSV rows
 */
function extractReportsFromCSV(
  rows: any[],
  properties: PartialType<InsertProperty>[],
  reports: PartialType<InsertReport>[]
): void {
  for (const row of rows) {
    // Extract property information first
    const address = findFirstValue(row, [
      'Address', 'Property Address', 'Subject Address'
    ]);
    
    const city = findFirstValue(row, [
      'City', 'Property City', 'Subject City'
    ]);
    
    const state = findFirstValue(row, [
      'State', 'Property State', 'Subject State'
    ]);
    
    const zipCode = findFirstValue(row, [
      'Zip', 'ZipCode', 'Zip Code', 'Postal Code'
    ]);
    
    // Create property only if we have address information
    if (address || (city && state)) {
      properties.push({
        userId: 1, // Default user ID
        address: address || '',
        city: city || '',
        state: state || '',
        zipCode: zipCode || '',
        propertyType: findFirstValue(row, ['Property Type', 'PropertyType', 'Type']) || 'Unknown'
      });
      
      // Now extract report information
      const reportType = findFirstValue(row, [
        'Report Type', 'ReportType', 'Appraisal Type'
      ]) || 'Appraisal Report';
      
      const formType = findFirstValue(row, [
        'Form Type', 'FormType', 'Form', 'Appraisal Form'
      ]) || 'URAR';
      
      const purpose = findFirstValue(row, [
        'Purpose', 'Appraisal Purpose', 'Value Purpose'
      ]) || 'Market Value';
      
      // Try to extract effective date
      let effectiveDate: Date | undefined;
      const effectiveDateStr = findFirstValue(row, [
        'Effective Date', 'EffectiveDate', 'Valuation Date', 'ValueDate'
      ]);
      
      if (effectiveDateStr) {
        try {
          effectiveDate = new Date(effectiveDateStr);
        } catch (e) {
          // Invalid date format, ignore
        }
      }
      
      // Try to extract report date
      let reportDate: Date | undefined;
      const reportDateStr = findFirstValue(row, [
        'Report Date', 'ReportDate', 'Appraisal Date', 'AppraisalDate'
      ]);
      
      if (reportDateStr) {
        try {
          reportDate = new Date(reportDateStr);
        } catch (e) {
          // Invalid date format, ignore
        }
      }
      
      const marketValue = extractNumberField(row, [
        'Market Value', 'MarketValue', 'Appraised Value', 'Value', 'Final Value'
      ]);
      
      reports.push({
        userId: 1, // Default user ID
        propertyId: 0, // Will be set after property is inserted
        reportType,
        formType,
        status: 'completed',
        purpose,
        effectiveDate,
        reportDate,
        marketValue
      });
    }
  }
}

/**
 * Extract mixed data from CSV rows (properties, reports, and comparables)
 */
function extractMixedDataFromCSV(
  rows: any[],
  properties: PartialType<InsertProperty>[],
  comparables: PartialType<InsertComparable>[],
  reports: PartialType<InsertReport>[]
): void {
  // First, try to identify the subject property and appraisal report information
  // We'll assume the first row contains the subject property information
  if (rows.length > 0) {
    const subjectRow = rows[0];
    
    // Extract property information
    const address = findFirstValue(subjectRow, [
      'Subject Address', 'Property Address', 'Address'
    ]);
    
    const city = findFirstValue(subjectRow, [
      'Subject City', 'Property City', 'City'
    ]);
    
    const state = findFirstValue(subjectRow, [
      'Subject State', 'Property State', 'State'
    ]);
    
    const zipCode = findFirstValue(subjectRow, [
      'Subject Zip', 'Property Zip', 'Zip', 'ZipCode'
    ]);
    
    // Create property if we have address information
    if (address || (city && state)) {
      properties.push({
        userId: 1, // Default user ID
        address: address || '',
        city: city || '',
        state: state || '',
        zipCode: zipCode || '',
        propertyType: findFirstValue(subjectRow, ['Property Type', 'Type']) || 'Unknown',
        yearBuilt: extractNumberField(subjectRow, ['Year Built', 'YearBuilt']),
        grossLivingArea: extractNumberField(subjectRow, ['Square Feet', 'SquareFeet', 'GLA']),
        lotSize: extractNumberField(subjectRow, ['Lot Size', 'LotSize']),
        bedrooms: extractNumberField(subjectRow, ['Bedrooms', 'Beds']),
        bathrooms: extractNumberField(subjectRow, ['Bathrooms', 'Baths'])
      });
      
      // Extract report information
      const marketValue = extractNumberField(subjectRow, [
        'Market Value', 'Value', 'Appraised Value'
      ]);
      
      let effectiveDate: Date | undefined;
      const effectiveDateStr = findFirstValue(subjectRow, [
        'Effective Date', 'ValueDate'
      ]);
      
      if (effectiveDateStr) {
        try {
          effectiveDate = new Date(effectiveDateStr);
        } catch (e) {
          // Invalid date format, ignore
        }
      }
      
      reports.push({
        userId: 1, // Default user ID
        propertyId: 0, // Will be set after property is inserted
        reportType: 'Appraisal Report',
        formType: findFirstValue(subjectRow, ['Form Type', 'Form']) || 'URAR',
        status: 'completed',
        purpose: 'Market Value',
        effectiveDate,
        marketValue
      });
      
      // Process remaining rows as comparables
      for (let i = 1; i < rows.length; i++) {
        const compRow = rows[i];
        
        // Check if this row is marked as a comparable
        const isComparable = findFirstValue(compRow, ['Type', 'Record Type']) === 'Comparable' ||
                            findFirstValue(compRow, ['Comp', 'Comparable']) === 'Yes';
        
        // Skip if explicitly not a comparable
        if (findFirstValue(compRow, ['Type', 'Record Type']) === 'Subject') {
          continue;
        }
        
        // Process as comparable if marked as such or has sale price
        const hasSalePrice = extractNumberField(compRow, ['Sale Price', 'SalePrice', 'Price']) > 0;
        
        if (isComparable || hasSalePrice || i > 0) { // Assume rows after first are comps
          const compAddress = findFirstValue(compRow, [
            'Address', 'Comp Address', 'Comparable Address'
          ]);
          
          const compCity = findFirstValue(compRow, [
            'City', 'Comp City', 'Comparable City'
          ]);
          
          const compState = findFirstValue(compRow, [
            'State', 'Comp State', 'Comparable State'
          ]);
          
          const compZip = findFirstValue(compRow, [
            'Zip', 'Comp Zip', 'Comparable Zip', 'ZipCode'
          ]);
          
          if (compAddress || (compCity && compState)) {
            comparables.push({
              reportId: 0, // Will be set after report is inserted
              compType: 'sale',
              address: compAddress || '',
              city: compCity || '',
              state: compState || '',
              zipCode: compZip || '',
              proximityToSubject: findFirstValue(compRow, ['Proximity', 'Distance']),
              salePrice: extractNumberField(compRow, ['Sale Price', 'SalePrice', 'Price']),
              saleDate: parseDateField(compRow, ['Sale Date', 'SaleDate', 'Date']),
              grossLivingArea: extractNumberField(compRow, ['Square Feet', 'SquareFeet', 'GLA']),
              bedrooms: extractNumberField(compRow, ['Bedrooms', 'Beds']),
              bathrooms: extractNumberField(compRow, ['Bathrooms', 'Baths']),
              yearBuilt: extractNumberField(compRow, ['Year Built', 'YearBuilt'])
            });
          }
        }
      }
    }
  }
}

/**
 * Helper function to extract number field from an object with multiple possible field names
 */
function extractNumberField(obj: any, fieldNames: string[]): number {
  if (!obj) {
    return 0;
  }
  
  for (const fieldName of fieldNames) {
    // Check both exact field name and normalized (lowercase) version
    let value = obj[fieldName];
    if (value === undefined) {
      // Try case-insensitive match
      const normalizedFieldName = fieldName.toLowerCase();
      const matchingKey = Object.keys(obj).find(
        key => key.toLowerCase() === normalizedFieldName
      );
      
      if (matchingKey) {
        value = obj[matchingKey];
      }
    }
    
    if (value !== undefined && value !== null && value !== '') {
      // Handle both numeric values and string representations
      if (typeof value === 'number') {
        return value;
      } else if (typeof value === 'string') {
        // Remove any non-numeric characters (except decimal point)
        const cleanValue = value.replace(/[$,]/g, '');
        const numericValue = Number(cleanValue);
        if (!isNaN(numericValue)) {
          return numericValue;
        }
      }
    }
  }
  
  return 0;
}

/**
 * Helper function to find first non-empty value from multiple possible field names
 */
function findFirstValue(obj: any, fieldNames: string[]): string | undefined {
  if (!obj) {
    return undefined;
  }
  
  for (const fieldName of fieldNames) {
    // Check both exact field name and normalized (lowercase) version
    let value = obj[fieldName];
    if (value === undefined) {
      // Try case-insensitive match
      const normalizedFieldName = fieldName.toLowerCase();
      const matchingKey = Object.keys(obj).find(
        key => key.toLowerCase() === normalizedFieldName
      );
      
      if (matchingKey) {
        value = obj[matchingKey];
      }
    }
    
    if (value !== undefined && value !== null && value !== '') {
      return value.toString();
    }
  }
  
  return undefined;
}

/**
 * Helper function to parse date field from multiple possible field names
 */
function parseDateField(obj: any, fieldNames: string[]): Date | undefined {
  const dateStr = findFirstValue(obj, fieldNames);
  
  if (dateStr) {
    try {
      return new Date(dateStr);
    } catch (e) {
      // Invalid date format, ignore
    }
  }
  
  return undefined;
}