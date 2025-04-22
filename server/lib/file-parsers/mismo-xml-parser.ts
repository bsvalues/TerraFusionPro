/**
 * MISMO XML Parser
 * 
 * Extracts data from MISMO (Mortgage Industry Standards Maintenance Organization) XML format.
 * This parser handles MISMO 2.6 and newer versions of the standard for appraisal data.
 */

import { XMLParser } from 'fast-xml-parser';
import { Partial as PartialType } from 'utility-types';
import { Property, InsertProperty, Report, InsertReport, Comparable, InsertComparable } from '../types';

/**
 * Extract data from MISMO XML appraisal reports
 */
export async function extractFromMismoXML(
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
    console.log(`Extracting data from MISMO XML: ${fileName}`);
    
    // Setup XMLParser with options for preserving attributes and handling arrays
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      isArray: (name, jpath) => {
        return name === 'PROPERTY' || 
               name === 'COMPARABLE_PROPERTY' || 
               name === 'CONTACT_DETAIL' ||
               name === 'ADJUSTMENT';
      }
    });
    
    // Parse XML content
    const xmlString = fileBuffer.toString('utf-8');
    const result = parser.parse(xmlString);
    
    // Determine MISMO version and extract data accordingly
    const mismoVersion = determineMismoVersion(result);
    console.log(`Detected MISMO version: ${mismoVersion}`);
    
    // Extract data based on MISMO version
    if (mismoVersion.startsWith('2.6')) {
      return extractFromMismo26(result, fileName);
    } else if (mismoVersion.startsWith('2.8')) {
      return extractFromMismo28(result, fileName);
    } else {
      // Default to a generic extraction based on common MISMO elements
      return extractFromGenericMismo(result, fileName);
    }
  } catch (error) {
    console.error(`Error extracting data from MISMO XML: ${error}`);
    errors.push(`MISMO XML extraction failed: ${error.message || 'Unknown error'}`);
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: 'XML - MISMO'
    };
  }
}

/**
 * Determine MISMO version from XML structure
 */
function determineMismoVersion(xmlData: any): string {
  // Check for version in DOCUMENT_SPECIFIC_DATA_SET
  if (xmlData.DOCUMENT_SPECIFIC_DATA_SET && 
      xmlData.DOCUMENT_SPECIFIC_DATA_SET['@_MISMOReferenceModelIdentifier']) {
    return xmlData.DOCUMENT_SPECIFIC_DATA_SET['@_MISMOReferenceModelIdentifier'];
  }
  
  // Check for version in MISMO_MESSAGE
  if (xmlData.MISMO_MESSAGE && 
      xmlData.MISMO_MESSAGE['@_MISMOReferenceModelIdentifier']) {
    return xmlData.MISMO_MESSAGE['@_MISMOReferenceModelIdentifier'];
  }
  
  // Check for version in VALUATION_RESPONSE
  if (xmlData.VALUATION_RESPONSE && 
      xmlData.VALUATION_RESPONSE['@_MISMOReferenceModelIdentifier']) {
    return xmlData.VALUATION_RESPONSE['@_MISMOReferenceModelIdentifier'];
  }
  
  // Default version if not found
  return 'unknown';
}

/**
 * Extract data from MISMO 2.6 format
 */
function extractFromMismo26(
  xmlData: any,
  fileName: string
): {
  properties: PartialType<InsertProperty>[],
  comparables: PartialType<InsertComparable>[],
  reports: PartialType<InsertReport>[],
  errors: string[],
  warnings: string[],
  format: string
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const properties: PartialType<InsertProperty>[] = [];
  const comparables: PartialType<InsertComparable>[] = [];
  const reports: PartialType<InsertReport>[] = [];
  
  try {
    // Navigate to the main property data
    const appraisalData = xmlData.DOCUMENT_SPECIFIC_DATA_SET?.VALUATION_RESPONSE || xmlData.VALUATION_RESPONSE;
    
    if (!appraisalData) {
      throw new Error('Could not find VALUATION_RESPONSE in MISMO XML');
    }
    
    // Extract property data
    const propertyData = appraisalData.PROPERTY || [];
    
    // The first property is the subject property
    if (propertyData.length > 0) {
      const subjectProperty = propertyData[0];
      
      // Extract address
      const propertyAddress = subjectProperty.PROPERTY_DETAIL?.ADDRESS || {};
      
      const address = propertyAddress.AddressLineText || '';
      const city = propertyAddress.CityName || '';
      const state = propertyAddress.StateCode || '';
      const zipCode = propertyAddress.PostalCode || '';
      
      // Extract property details
      const propertyDetail = subjectProperty.PROPERTY_DETAIL || {};
      
      const propertyType = propertyDetail.PropertyType || 'Unknown';
      const yearBuilt = propertyDetail.YearBuilt ? parseInt(propertyDetail.YearBuilt, 10) : 0;
      
      // Extract living area
      const grossLivingArea = propertyDetail.GrossLivingAreaSquareFeetCount ?
        parseInt(propertyDetail.GrossLivingAreaSquareFeetCount, 10) : 0;
      
      // Extract lot size
      let lotSize = 0;
      if (propertyDetail.LotSizeSquareFeetCount) {
        lotSize = parseInt(propertyDetail.LotSizeSquareFeetCount, 10);
      } else if (propertyDetail.LotSizeAcreCount) {
        lotSize = parseFloat(propertyDetail.LotSizeAcreCount) * 43560;
      }
      
      // Extract bedrooms and bathrooms
      const bedrooms = propertyDetail.RoomCount?.BedroomsCount ? 
        parseInt(propertyDetail.RoomCount.BedroomsCount, 10) : 0;
        
      const bathrooms = propertyDetail.RoomCount?.BathroomsCount ? 
        parseFloat(propertyDetail.RoomCount.BathroomsCount) : 0;
      
      // Create property object
      properties.push({
        userId: 1, // Default user ID
        address,
        city,
        state,
        zipCode,
        propertyType,
        yearBuilt,
        grossLivingArea,
        lotSize,
        bedrooms,
        bathrooms
      });
      
      // Extract valuation information
      const valuationData = appraisalData.VALUATION || {};
      
      // Extract market value
      let marketValue = 0;
      if (valuationData.PropertyValuationAmount) {
        marketValue = parseInt(valuationData.PropertyValuationAmount.replace(/[^\d.]/g, ''), 10);
      }
      
      // Extract effective date
      let effectiveDate: Date | undefined;
      if (valuationData.ValueEffectiveDate) {
        try {
          effectiveDate = new Date(valuationData.ValueEffectiveDate);
        } catch (e) {
          // Invalid date format, ignore
        }
      }
      
      // Create report object
      reports.push({
        userId: 1, // Default user ID
        propertyId: 0, // Will be set after property is inserted
        reportType: 'Appraisal Report',
        formType: valuationData.FormType || 'URAR',
        status: 'completed',
        purpose: valuationData.PropertyValuationPurposeType || 'Market Value',
        effectiveDate,
        marketValue
      });
      
      // Extract comparable sales
      const comparableData = appraisalData.COMPARABLE_PROPERTY || [];
      
      for (const comp of comparableData) {
        // Extract address
        const compAddress = comp.PROPERTY_DETAIL?.ADDRESS || {};
        
        const compStreet = compAddress.AddressLineText || '';
        const compCity = compAddress.CityName || '';
        const compState = compAddress.StateCode || '';
        const compZip = compAddress.PostalCode || '';
        
        // Extract sale price
        let salePrice = 0;
        if (comp.SALES_HISTORY && comp.SALES_HISTORY.SALES_TRANSACTION) {
          const transaction = comp.SALES_HISTORY.SALES_TRANSACTION;
          if (transaction.SaleAmount) {
            salePrice = parseInt(transaction.SaleAmount.replace(/[^\d.]/g, ''), 10);
          }
        }
        
        // Extract sale date
        let saleDate: Date | undefined;
        if (comp.SALES_HISTORY && comp.SALES_HISTORY.SALES_TRANSACTION) {
          const transaction = comp.SALES_HISTORY.SALES_TRANSACTION;
          if (transaction.SaleDate) {
            try {
              saleDate = new Date(transaction.SaleDate);
            } catch (e) {
              // Invalid date format, ignore
            }
          }
        }
        
        // Create comparable object
        comparables.push({
          reportId: 0, // Will be set after report is inserted
          compType: 'sale',
          address: compStreet,
          city: compCity,
          state: compState,
          zipCode: compZip,
          salePrice,
          saleDate
        });
      }
    } else {
      warnings.push('No property data found in MISMO XML');
    }
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: 'XML - MISMO 2.6'
    };
  } catch (error) {
    console.error(`Error extracting data from MISMO 2.6 XML: ${error}`);
    errors.push(`MISMO 2.6 extraction failed: ${error.message || 'Unknown error'}`);
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: 'XML - MISMO 2.6'
    };
  }
}

/**
 * Extract data from MISMO 2.8 format
 */
function extractFromMismo28(
  xmlData: any,
  fileName: string
): {
  properties: PartialType<InsertProperty>[],
  comparables: PartialType<InsertComparable>[],
  reports: PartialType<InsertReport>[],
  errors: string[],
  warnings: string[],
  format: string
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const properties: PartialType<InsertProperty>[] = [];
  const comparables: PartialType<InsertComparable>[] = [];
  const reports: PartialType<InsertReport>[] = [];
  
  try {
    // Navigate to the main property data
    const appraisalData = xmlData.MISMO_MESSAGE?.VALUATION_RESPONSE || xmlData.VALUATION_RESPONSE;
    
    if (!appraisalData) {
      throw new Error('Could not find VALUATION_RESPONSE in MISMO XML');
    }
    
    // Extract property data
    const propertyData = appraisalData.PROPERTY || [];
    
    // The first property is the subject property
    if (propertyData.length > 0) {
      const subjectProperty = propertyData[0];
      
      // Extract address
      const propertyAddress = subjectProperty.PROPERTY_DETAIL?.ADDRESS || {};
      
      const address = propertyAddress.AddressLineText || '';
      const city = propertyAddress.CityName || '';
      const state = propertyAddress.StateCode || '';
      const zipCode = propertyAddress.PostalCode || '';
      
      // Extract property details
      const propertyDetail = subjectProperty.PROPERTY_DETAIL || {};
      
      const propertyType = propertyDetail.PropertyType || 'Unknown';
      const yearBuilt = propertyDetail.YearBuilt ? parseInt(propertyDetail.YearBuilt, 10) : 0;
      
      // Extract living area
      const grossLivingArea = propertyDetail.GrossLivingAreaSquareFeetCount ?
        parseInt(propertyDetail.GrossLivingAreaSquareFeetCount, 10) : 0;
      
      // Extract lot size
      let lotSize = 0;
      if (propertyDetail.LotSizeSquareFeetCount) {
        lotSize = parseInt(propertyDetail.LotSizeSquareFeetCount, 10);
      } else if (propertyDetail.LotSizeAcreCount) {
        lotSize = parseFloat(propertyDetail.LotSizeAcreCount) * 43560;
      }
      
      // Extract bedrooms and bathrooms
      const bedrooms = propertyDetail.ROOMS_AND_BEDROOMS?.BedroomsCount ? 
        parseInt(propertyDetail.ROOMS_AND_BEDROOMS.BedroomsCount, 10) : 0;
        
      const bathrooms = propertyDetail.ROOMS_AND_BEDROOMS?.BathroomsCount ? 
        parseFloat(propertyDetail.ROOMS_AND_BEDROOMS.BathroomsCount) : 0;
      
      // Create property object
      properties.push({
        userId: 1, // Default user ID
        address,
        city,
        state,
        zipCode,
        propertyType,
        yearBuilt,
        grossLivingArea,
        lotSize,
        bedrooms,
        bathrooms
      });
      
      // Extract valuation information
      const valuationData = appraisalData.VALUATION || {};
      
      // Extract market value
      let marketValue = 0;
      if (valuationData.PropertyAppraisedValueAmount) {
        marketValue = parseInt(valuationData.PropertyAppraisedValueAmount.replace(/[^\d.]/g, ''), 10);
      }
      
      // Extract effective date
      let effectiveDate: Date | undefined;
      if (valuationData.AppraisalEffectiveDate) {
        try {
          effectiveDate = new Date(valuationData.AppraisalEffectiveDate);
        } catch (e) {
          // Invalid date format, ignore
        }
      }
      
      // Create report object
      reports.push({
        userId: 1, // Default user ID
        propertyId: 0, // Will be set after property is inserted
        reportType: 'Appraisal Report',
        formType: valuationData.AppraisalFormType || 'URAR',
        status: 'completed',
        purpose: valuationData.AppraisalPurposeType || 'Market Value',
        effectiveDate,
        marketValue
      });
      
      // Extract comparable sales
      const comparableData = appraisalData.COMPARABLE_PROPERTY || [];
      
      for (const comp of comparableData) {
        // Extract address
        const compAddress = comp.PROPERTY_DETAIL?.ADDRESS || {};
        
        const compStreet = compAddress.AddressLineText || '';
        const compCity = compAddress.CityName || '';
        const compState = compAddress.StateCode || '';
        const compZip = compAddress.PostalCode || '';
        
        // Extract sale price
        let salePrice = 0;
        if (comp.SALES_TRANSACTION) {
          const transaction = comp.SALES_TRANSACTION;
          if (transaction.SalePriceAmount) {
            salePrice = parseInt(transaction.SalePriceAmount.replace(/[^\d.]/g, ''), 10);
          }
        }
        
        // Extract sale date
        let saleDate: Date | undefined;
        if (comp.SALES_TRANSACTION) {
          const transaction = comp.SALES_TRANSACTION;
          if (transaction.SaleContractDate) {
            try {
              saleDate = new Date(transaction.SaleContractDate);
            } catch (e) {
              // Invalid date format, ignore
            }
          }
        }
        
        // Create comparable object
        comparables.push({
          reportId: 0, // Will be set after report is inserted
          compType: 'sale',
          address: compStreet,
          city: compCity,
          state: compState,
          zipCode: compZip,
          salePrice,
          saleDate
        });
      }
    } else {
      warnings.push('No property data found in MISMO XML');
    }
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: 'XML - MISMO 2.8'
    };
  } catch (error) {
    console.error(`Error extracting data from MISMO 2.8 XML: ${error}`);
    errors.push(`MISMO 2.8 extraction failed: ${error.message || 'Unknown error'}`);
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: 'XML - MISMO 2.8'
    };
  }
}

/**
 * Extract data from generic MISMO format
 * This is a fallback for unrecognized or custom MISMO versions
 */
function extractFromGenericMismo(
  xmlData: any,
  fileName: string
): {
  properties: PartialType<InsertProperty>[],
  comparables: PartialType<InsertComparable>[],
  reports: PartialType<InsertReport>[],
  errors: string[],
  warnings: string[],
  format: string
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const properties: PartialType<InsertProperty>[] = [];
  const comparables: PartialType<InsertComparable>[] = [];
  const reports: PartialType<InsertReport>[] = [];
  
  try {
    // Try to locate key MISMO elements regardless of exact structure
    // Look for VALUATION_RESPONSE at multiple possible locations
    const appraisalData = xmlData.DOCUMENT_SPECIFIC_DATA_SET?.VALUATION_RESPONSE || 
                         xmlData.MISMO_MESSAGE?.VALUATION_RESPONSE || 
                         xmlData.VALUATION_RESPONSE;
    
    if (!appraisalData) {
      throw new Error('Could not find VALUATION_RESPONSE in MISMO XML');
    }
    
    // Look for property data
    const propertyData = appraisalData.PROPERTY || [];
    
    if (propertyData.length > 0) {
      const subjectProperty = propertyData[0];
      
      // Try to find address - look in multiple possible locations
      let propertyAddress = subjectProperty.PROPERTY_DETAIL?.ADDRESS || 
                           subjectProperty.ADDRESS || 
                           {};
      
      // Sometimes ADDRESS might be an array
      if (Array.isArray(propertyAddress)) {
        propertyAddress = propertyAddress[0] || {};
      }
      
      const address = propertyAddress.AddressLineText || propertyAddress.StreetAddress || '';
      const city = propertyAddress.CityName || propertyAddress.City || '';
      const state = propertyAddress.StateCode || propertyAddress.State || '';
      const zipCode = propertyAddress.PostalCode || propertyAddress.ZipCode || '';
      
      // Find property details - look in multiple possible locations
      const propertyDetail = subjectProperty.PROPERTY_DETAIL || subjectProperty;
      
      // Try to extract property type with multiple possible field names
      const propertyType = propertyDetail.PropertyType || 
                          propertyDetail.PropertyTypeDescription || 
                          'Unknown';
      
      // Try to extract year built with multiple possible field names
      const yearBuilt = extractNumberField(propertyDetail, ['YearBuilt', 'YearConstructed']);
      
      // Try to extract gross living area with multiple possible field names
      const grossLivingArea = extractNumberField(propertyDetail, [
        'GrossLivingAreaSquareFeetCount',
        'GrossLivingArea',
        'AboveGradeLivingAreaSquareFeet'
      ]);
      
      // Try to extract lot size with multiple possible field names
      let lotSize = extractNumberField(propertyDetail, [
        'LotSizeSquareFeetCount',
        'LotSizeSquareFeet'
      ]);
      
      // If lot size is in acres, convert to square feet
      if (lotSize === 0) {
        const lotSizeAcres = extractNumberField(propertyDetail, [
          'LotSizeAcreCount',
          'LotSizeAcres'
        ]);
        
        if (lotSizeAcres > 0) {
          lotSize = lotSizeAcres * 43560;
        }
      }
      
      // Try to extract bedrooms with multiple possible field names
      const bedrooms = extractNumberField(
        propertyDetail.ROOMS_AND_BEDROOMS || propertyDetail.RoomCount || propertyDetail,
        ['BedroomsCount', 'Bedrooms', 'NumberOfBedrooms']
      );
      
      // Try to extract bathrooms with multiple possible field names
      const bathrooms = extractNumberField(
        propertyDetail.ROOMS_AND_BEDROOMS || propertyDetail.RoomCount || propertyDetail,
        ['BathroomsCount', 'Bathrooms', 'NumberOfBathrooms']
      );
      
      // Create property object if we have at least an address
      if (address || (city && state)) {
        properties.push({
          userId: 1, // Default user ID
          address,
          city,
          state,
          zipCode,
          propertyType,
          yearBuilt,
          grossLivingArea,
          lotSize,
          bedrooms,
          bathrooms
        });
        
        // Try to find valuation data
        const valuationData = appraisalData.VALUATION || {};
        
        // Try to extract market value with multiple possible field names
        let marketValue = extractNumberField(valuationData, [
          'PropertyAppraisedValueAmount',
          'PropertyValuationAmount',
          'AppraisedValue',
          'MarketValue'
        ]);
        
        // Try to extract effective date with multiple possible field names
        let effectiveDate: Date | undefined;
        const effectiveDateStr = findFirstValue(valuationData, [
          'AppraisalEffectiveDate',
          'ValueEffectiveDate',
          'EffectiveDate'
        ]);
        
        if (effectiveDateStr) {
          try {
            effectiveDate = new Date(effectiveDateStr);
          } catch (e) {
            // Invalid date format, ignore
          }
        }
        
        // Try to extract form type with multiple possible field names
        const formType = findFirstValue(valuationData, [
          'AppraisalFormType',
          'FormType',
          'ReportForm'
        ]) || 'Unknown';
        
        // Create report object
        reports.push({
          userId: 1, // Default user ID
          propertyId: 0, // Will be set after property is inserted
          reportType: 'Appraisal Report',
          formType,
          status: 'completed',
          effectiveDate,
          marketValue
        });
        
        // Try to find comparable data
        const comparableData = appraisalData.COMPARABLE_PROPERTY || [];
        
        for (const comp of comparableData) {
          // Try to find address - look in multiple possible locations
          let compAddress = comp.PROPERTY_DETAIL?.ADDRESS || 
                           comp.ADDRESS || 
                           {};
          
          // Sometimes ADDRESS might be an array
          if (Array.isArray(compAddress)) {
            compAddress = compAddress[0] || {};
          }
          
          const compStreet = compAddress.AddressLineText || compAddress.StreetAddress || '';
          const compCity = compAddress.CityName || compAddress.City || '';
          const compState = compAddress.StateCode || compAddress.State || '';
          const compZip = compAddress.PostalCode || compAddress.ZipCode || '';
          
          // Try to find sale transaction data
          const transaction = comp.SALES_TRANSACTION || 
                             comp.SALES_HISTORY?.SALES_TRANSACTION || 
                             comp;
          
          // Try to extract sale price with multiple possible field names
          let salePrice = extractNumberField(transaction, [
            'SalePriceAmount',
            'SaleAmount',
            'SalePrice'
          ]);
          
          // Try to extract sale date with multiple possible field names
          let saleDate: Date | undefined;
          const saleDateStr = findFirstValue(transaction, [
            'SaleContractDate',
            'SaleDate',
            'ContractDate'
          ]);
          
          if (saleDateStr) {
            try {
              saleDate = new Date(saleDateStr);
            } catch (e) {
              // Invalid date format, ignore
            }
          }
          
          // Create comparable object if we have at least an address and sale price
          if ((compStreet || (compCity && compState)) && salePrice > 0) {
            comparables.push({
              reportId: 0, // Will be set after report is inserted
              compType: 'sale',
              address: compStreet,
              city: compCity,
              state: compState,
              zipCode: compZip,
              salePrice,
              saleDate
            });
          }
        }
      } else {
        warnings.push('Could not find property address in MISMO XML');
      }
    } else {
      warnings.push('No property data found in MISMO XML');
    }
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: 'XML - MISMO (Generic)'
    };
  } catch (error) {
    console.error(`Error extracting data from generic MISMO XML: ${error}`);
    errors.push(`Generic MISMO extraction failed: ${error.message || 'Unknown error'}`);
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: 'XML - MISMO (Generic)'
    };
  }
}

/**
 * Helper function to extract a number field from an object with multiple possible field names
 */
function extractNumberField(obj: any, fieldNames: string[]): number {
  if (!obj) {
    return 0;
  }
  
  for (const fieldName of fieldNames) {
    const value = obj[fieldName];
    if (value !== undefined && value !== null && value !== '') {
      // Handle both numeric values and string representations
      if (typeof value === 'number') {
        return value;
      } else if (typeof value === 'string') {
        // Remove any non-numeric characters (except decimal point)
        const numericValue = Number(value.replace(/[^\d.]/g, ''));
        if (!isNaN(numericValue)) {
          return numericValue;
        }
      }
    }
  }
  
  return 0;
}

/**
 * Helper function to find the first non-empty value from multiple possible field names
 */
function findFirstValue(obj: any, fieldNames: string[]): string | undefined {
  if (!obj) {
    return undefined;
  }
  
  for (const fieldName of fieldNames) {
    const value = obj[fieldName];
    if (value !== undefined && value !== null && value !== '') {
      return value.toString();
    }
  }
  
  return undefined;
}