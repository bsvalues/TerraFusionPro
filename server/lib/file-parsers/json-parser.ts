/**
 * JSON Parser
 * 
 * Extracts data from JSON files containing appraisal report data, comparable sales,
 * or property information.
 */

import { Partial as PartialType } from 'utility-types';
import { Property, InsertProperty, Report, InsertReport, Comparable, InsertComparable } from '../types';

/**
 * Extract data from JSON appraisal files
 */
export async function extractFromJSON(
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
    console.log(`Extracting data from JSON: ${fileName}`);
    
    // Parse JSON content
    const jsonString = fileBuffer.toString('utf-8');
    const data = JSON.parse(jsonString);
    
    // Determine JSON format
    const jsonFormat = determineJsonFormat(data);
    console.log(`JSON format detected: ${jsonFormat}`);
    
    // Process JSON based on detected format
    switch (jsonFormat) {
      case 'appraisal_report':
        extractFromAppraisalReport(data, properties, comparables, reports);
        break;
      case 'properties_list':
        extractFromPropertiesList(data, properties);
        break;
      case 'comparables_list':
        extractFromComparablesList(data, comparables);
        break;
      case 'mixed_data':
        extractFromMixedData(data, properties, comparables, reports);
        break;
      default:
        errors.push('Unable to determine JSON format structure');
    }
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: `JSON - ${jsonFormat}`
    };
  } catch (error) {
    console.error(`Error extracting data from JSON: ${error}`);
    errors.push(`JSON extraction failed: ${error.message || 'Unknown error'}`);
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: 'JSON'
    };
  }
}

/**
 * Determine JSON format based on structure
 */
function determineJsonFormat(data: any): 'appraisal_report' | 'properties_list' | 'comparables_list' | 'mixed_data' | 'unknown' {
  // Check if data is an array
  if (Array.isArray(data)) {
    // Check first few items to determine type
    if (data.length > 0) {
      const sample = data[0];
      
      // Check for property-specific fields
      if (hasPropertyFields(sample)) {
        return 'properties_list';
      }
      
      // Check for comparable-specific fields
      if (hasComparableFields(sample)) {
        return 'comparables_list';
      }
      
      // Check for mixed data
      if (hasPropertyFields(sample) && hasComparableFields(sample)) {
        return 'mixed_data';
      }
    }
    
    // Default to unknown for empty arrays
    return 'unknown';
  } else {
    // For objects, check for typical appraisal report structure
    if (data.property || data.subject || data.subjectProperty) {
      return 'appraisal_report';
    }
    
    // Check for properties collection
    if (data.properties && Array.isArray(data.properties)) {
      return 'properties_list';
    }
    
    // Check for comparables collection
    if (data.comparables && Array.isArray(data.comparables)) {
      return 'comparables_list';
    }
    
    // Check for combined data
    if ((data.property || data.subject) && (data.comparables && Array.isArray(data.comparables))) {
      return 'appraisal_report';
    }
    
    // Check for appraisal fields
    if (hasAppraisalFields(data)) {
      return 'appraisal_report';
    }
  }
  
  return 'unknown';
}

/**
 * Check if object has property fields
 */
function hasPropertyFields(obj: any): boolean {
  const propertyFields = [
    'address', 'city', 'state', 'zip', 'zipCode',
    'bedrooms', 'bathrooms', 'squareFeet', 'grossLivingArea',
    'lotSize', 'yearBuilt', 'propertyType'
  ];
  
  return hasAnyFields(obj, propertyFields);
}

/**
 * Check if object has comparable fields
 */
function hasComparableFields(obj: any): boolean {
  const comparableFields = [
    'salePrice', 'saleDate', 'proximity', 'distance',
    'adjustments', 'comparableType', 'compType'
  ];
  
  return hasAnyFields(obj, comparableFields);
}

/**
 * Check if object has appraisal report fields
 */
function hasAppraisalFields(obj: any): boolean {
  const appraisalFields = [
    'marketValue', 'appraisedValue', 'effectiveDate',
    'reportDate', 'appraisalDate', 'formType', 'reportType'
  ];
  
  return hasAnyFields(obj, appraisalFields);
}

/**
 * Check if object has any of the specified fields
 */
function hasAnyFields(obj: any, fields: string[]): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const keys = Object.keys(obj).map(k => k.toLowerCase());
  
  return fields.some(field => 
    keys.includes(field.toLowerCase()) || 
    keys.some(k => k.includes(field.toLowerCase()))
  );
}

/**
 * Extract data from appraisal report JSON
 */
function extractFromAppraisalReport(
  data: any,
  properties: PartialType<InsertProperty>[],
  comparables: PartialType<InsertComparable>[],
  reports: PartialType<InsertReport>[]
): void {
  // Find the subject property data
  const subjectData = data.property || data.subject || data.subjectProperty || data;
  
  // Extract property information
  if (subjectData) {
    // Find address information - it might be nested
    const addressData = subjectData.address || subjectData;
    
    const address = findValue(addressData, ['address', 'street', 'streetAddress']);
    const city = findValue(addressData, ['city', 'cityName', 'municipality']);
    const state = findValue(addressData, ['state', 'stateCode', 'province']);
    const zipCode = findValue(addressData, ['zip', 'zipCode', 'postalCode']);
    
    // Find property details
    const propertyType = findValue(subjectData, ['propertyType', 'type', 'style']);
    const yearBuilt = extractNumberValue(subjectData, ['yearBuilt', 'year', 'constructionYear']);
    const grossLivingArea = extractNumberValue(subjectData, [
      'grossLivingArea', 'squareFeet', 'gla', 'livingArea', 'buildingSize'
    ]);
    const lotSize = extractNumberValue(subjectData, ['lotSize', 'lot', 'landArea']);
    const bedrooms = extractNumberValue(subjectData, ['bedrooms', 'beds', 'bedroomCount']);
    const bathrooms = extractNumberValue(subjectData, ['bathrooms', 'baths', 'bathroomCount']);
    
    // Create property if we have sufficient information
    if (address || (city && state)) {
      properties.push({
        userId: 1, // Default user ID
        address: address || '',
        city: city || '',
        state: state || '',
        zipCode: zipCode || '',
        propertyType: propertyType || 'Unknown',
        yearBuilt,
        grossLivingArea,
        lotSize,
        bedrooms,
        bathrooms
      });
      
      // Extract valuation information
      const valuationData = data.valuation || data.appraisal || data;
      
      // Extract market value
      const marketValue = extractNumberValue(valuationData, [
        'marketValue', 'value', 'appraisedValue', 'estimatedValue'
      ]);
      
      // Extract report information
      const reportType = findValue(valuationData, ['reportType', 'type', 'appraisalType']) || 'Appraisal Report';
      const formType = findValue(valuationData, ['formType', 'form', 'appraisalForm']) || 'URAR';
      const purpose = findValue(valuationData, ['purpose', 'appraisalPurpose']) || 'Market Value';
      
      // Extract dates
      const effectiveDate = parseDate(valuationData, ['effectiveDate', 'valueDate', 'asOfDate']);
      const reportDate = parseDate(valuationData, ['reportDate', 'appraisalDate', 'dateOfReport']);
      
      // Create report
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
      
      // Extract comparables
      const comparablesData = data.comparables || data.comps || [];
      
      for (const comp of comparablesData) {
        // Extract comparable address
        const compAddressData = comp.address || comp;
        
        const compAddress = findValue(compAddressData, ['address', 'street', 'streetAddress']);
        const compCity = findValue(compAddressData, ['city', 'cityName', 'municipality']);
        const compState = findValue(compAddressData, ['state', 'stateCode', 'province']);
        const compZip = findValue(compAddressData, ['zip', 'zipCode', 'postalCode']);
        
        // Extract comparable details
        const compType = findValue(comp, ['type', 'compType', 'comparableType', 'saleType']) || 'sale';
        const salePrice = extractNumberValue(comp, ['salePrice', 'price', 'value', 'amount']);
        const saleDate = parseDate(comp, ['saleDate', 'date', 'transactionDate']);
        const proximityToSubject = findValue(comp, ['proximityToSubject', 'proximity', 'distance']);
        
        // Create comparable if we have sufficient information
        if ((compAddress || (compCity && compState)) && salePrice > 0) {
          comparables.push({
            reportId: 0, // Will be set after report is inserted
            compType: compType as 'sale' | 'listing' | 'pending',
            address: compAddress || '',
            city: compCity || '',
            state: compState || '',
            zipCode: compZip || '',
            proximityToSubject,
            salePrice,
            saleDate,
            grossLivingArea: extractNumberValue(comp, ['grossLivingArea', 'squareFeet', 'gla']),
            bedrooms: extractNumberValue(comp, ['bedrooms', 'beds', 'bedroomCount']),
            bathrooms: extractNumberValue(comp, ['bathrooms', 'baths', 'bathroomCount']),
            yearBuilt: extractNumberValue(comp, ['yearBuilt', 'year', 'constructionYear'])
          });
        }
      }
    }
  }
}

/**
 * Extract data from properties list JSON
 */
function extractFromPropertiesList(
  data: any,
  properties: PartialType<InsertProperty>[]
): void {
  // Handle array of properties
  const propertiesList = Array.isArray(data) ? data : (data.properties || []);
  
  for (const prop of propertiesList) {
    // Extract address information
    const addressData = prop.address || prop;
    
    const address = findValue(addressData, ['address', 'street', 'streetAddress']);
    const city = findValue(addressData, ['city', 'cityName', 'municipality']);
    const state = findValue(addressData, ['state', 'stateCode', 'province']);
    const zipCode = findValue(addressData, ['zip', 'zipCode', 'postalCode']);
    
    // Extract property details
    const propertyType = findValue(prop, ['propertyType', 'type', 'style']);
    const yearBuilt = extractNumberValue(prop, ['yearBuilt', 'year', 'constructionYear']);
    const grossLivingArea = extractNumberValue(prop, [
      'grossLivingArea', 'squareFeet', 'gla', 'livingArea', 'buildingSize'
    ]);
    const lotSize = extractNumberValue(prop, ['lotSize', 'lot', 'landArea']);
    const bedrooms = extractNumberValue(prop, ['bedrooms', 'beds', 'bedroomCount']);
    const bathrooms = extractNumberValue(prop, ['bathrooms', 'baths', 'bathroomCount']);
    
    // Create property if we have sufficient information
    if (address || (city && state)) {
      properties.push({
        userId: 1, // Default user ID
        address: address || '',
        city: city || '',
        state: state || '',
        zipCode: zipCode || '',
        propertyType: propertyType || 'Unknown',
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
 * Extract data from comparables list JSON
 */
function extractFromComparablesList(
  data: any,
  comparables: PartialType<InsertComparable>[]
): void {
  // Handle array of comparables
  const comparablesList = Array.isArray(data) ? data : (data.comparables || []);
  
  for (const comp of comparablesList) {
    // Extract address information
    const addressData = comp.address || comp;
    
    const address = findValue(addressData, ['address', 'street', 'streetAddress']);
    const city = findValue(addressData, ['city', 'cityName', 'municipality']);
    const state = findValue(addressData, ['state', 'stateCode', 'province']);
    const zipCode = findValue(addressData, ['zip', 'zipCode', 'postalCode']);
    
    // Extract comparable details
    const compType = findValue(comp, ['type', 'compType', 'comparableType', 'saleType']) || 'sale';
    const salePrice = extractNumberValue(comp, ['salePrice', 'price', 'value', 'amount']);
    const saleDate = parseDate(comp, ['saleDate', 'date', 'transactionDate']);
    const proximityToSubject = findValue(comp, ['proximityToSubject', 'proximity', 'distance']);
    
    // Create comparable if we have sufficient information
    if ((address || (city && state)) && salePrice > 0) {
      comparables.push({
        reportId: 0, // Will be set after report is inserted
        compType: compType as 'sale' | 'listing' | 'pending',
        address: address || '',
        city: city || '',
        state: state || '',
        zipCode: zipCode || '',
        proximityToSubject,
        salePrice,
        saleDate,
        grossLivingArea: extractNumberValue(comp, ['grossLivingArea', 'squareFeet', 'gla']),
        bedrooms: extractNumberValue(comp, ['bedrooms', 'beds', 'bedroomCount']),
        bathrooms: extractNumberValue(comp, ['bathrooms', 'baths', 'bathroomCount']),
        yearBuilt: extractNumberValue(comp, ['yearBuilt', 'year', 'constructionYear'])
      });
    }
  }
}

/**
 * Extract data from mixed data JSON
 */
function extractFromMixedData(
  data: any,
  properties: PartialType<InsertProperty>[],
  comparables: PartialType<InsertComparable>[],
  reports: PartialType<InsertReport>[]
): void {
  // Process properties
  if (data.properties && Array.isArray(data.properties)) {
    extractFromPropertiesList(data.properties, properties);
  } else if (data.property || data.subject) {
    const property = data.property || data.subject;
    extractFromPropertiesList([property], properties);
  }
  
  // Process comparables
  if (data.comparables && Array.isArray(data.comparables)) {
    extractFromComparablesList(data.comparables, comparables);
  }
  
  // Process report information
  if (data.report || data.appraisal || hasAppraisalFields(data)) {
    const reportData = data.report || data.appraisal || data;
    
    // Extract market value
    const marketValue = extractNumberValue(reportData, [
      'marketValue', 'value', 'appraisedValue', 'estimatedValue'
    ]);
    
    // Extract report information
    const reportType = findValue(reportData, ['reportType', 'type', 'appraisalType']) || 'Appraisal Report';
    const formType = findValue(reportData, ['formType', 'form', 'appraisalForm']) || 'URAR';
    const purpose = findValue(reportData, ['purpose', 'appraisalPurpose']) || 'Market Value';
    
    // Extract dates
    const effectiveDate = parseDate(reportData, ['effectiveDate', 'valueDate', 'asOfDate']);
    const reportDate = parseDate(reportData, ['reportDate', 'appraisalDate', 'dateOfReport']);
    
    // Create report if we have properties
    if (properties.length > 0) {
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
 * Helper function to find value with multiple possible field names
 */
function findValue(obj: any, fieldNames: string[]): string | undefined {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }
  
  for (const fieldName of fieldNames) {
    // Check for exact field name
    if (obj[fieldName] !== undefined && obj[fieldName] !== null && obj[fieldName] !== '') {
      return obj[fieldName].toString();
    }
    
    // Check for case-insensitive match
    const normalizedFieldName = fieldName.toLowerCase();
    const keys = Object.keys(obj);
    for (const key of keys) {
      if (key.toLowerCase() === normalizedFieldName && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
        return obj[key].toString();
      }
    }
    
    // Check for partial match
    for (const key of keys) {
      if (key.toLowerCase().includes(normalizedFieldName) && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
        return obj[key].toString();
      }
    }
  }
  
  return undefined;
}

/**
 * Helper function to extract numeric value
 */
function extractNumberValue(obj: any, fieldNames: string[]): number {
  if (!obj || typeof obj !== 'object') {
    return 0;
  }
  
  const value = findValue(obj, fieldNames);
  
  if (value !== undefined) {
    // Handle different number formats
    if (typeof value === 'string') {
      // Remove non-numeric characters (except decimal point)
      const cleanValue = value.replace(/[$,]/g, '');
      const numericValue = Number(cleanValue);
      if (!isNaN(numericValue)) {
        return numericValue;
      }
    } else if (typeof value === 'number') {
      return value;
    }
  }
  
  return 0;
}

/**
 * Helper function to parse date
 */
function parseDate(obj: any, fieldNames: string[]): Date | undefined {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }
  
  const dateStr = findValue(obj, fieldNames);
  
  if (dateStr) {
    try {
      return new Date(dateStr);
    } catch (e) {
      // Invalid date format, ignore
    }
  }
  
  return undefined;
}