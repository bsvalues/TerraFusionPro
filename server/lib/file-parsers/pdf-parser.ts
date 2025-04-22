/**
 * PDF Parser
 * 
 * Extracts data from PDF appraisal reports using text extraction and pattern matching.
 * This parser handles standard appraisal forms like URAR (Uniform Residential Appraisal Report),
 * as well as custom and narrative appraisal reports.
 */

// Import PDF.js for Node.js environment
// Using v2.16.105 which has proper Node.js support via the legacy build
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { identifyAppraisalData } from './index';
import { Property, InsertProperty, Report, InsertReport, Comparable, InsertComparable } from '../types';

// NodeJS doesn't need worker initialization
const pdfjsLibNodejs = pdfjsLib;

/**
 * Extract data from PDF appraisal reports
 */
export async function extractFromPDF(
  fileBuffer: Buffer,
  fileName: string
): Promise<{
  properties: Partial<InsertProperty>[],
  comparables: Partial<InsertComparable>[],
  reports: Partial<InsertReport>[],
  errors: string[],
  warnings: string[],
  format: string
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    console.log(`Extracting data from PDF: ${fileName}`);
    
    // Load the PDF document
    const pdfData = new Uint8Array(fileBuffer);
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdfDocument = await loadingTask.promise;
    
    // Get total number of pages
    const numPages = pdfDocument.numPages;
    console.log(`PDF loaded successfully. Total pages: ${numPages}`);
    
    // Extract text from all pages
    let fullText = '';
    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const textItems = textContent.items as any[];
      const pageText = textItems.map(item => item.str).join(' ');
      fullText += pageText + ' ';
    }
    
    // Determine PDF type based on content
    const pdfType = determinePdfType(fullText);
    console.log(`PDF type detected: ${pdfType}`);
    
    // Extract data based on PDF type
    switch (pdfType) {
      case 'URAR':
        return extractFromURARForm(fullText, fileName);
      case 'Condo':
        return extractFromCondoForm(fullText, fileName);
      case 'Land':
        return extractFromLandForm(fullText, fileName);
      case 'Custom':
      default:
        return extractFromGenericAppraisal(fullText, fileName);
    }
  } catch (error) {
    console.error(`Error extracting data from PDF: ${error}`);
    errors.push(`PDF extraction failed: ${error.message || 'Unknown error'}`);
    
    return {
      properties: [],
      comparables: [],
      reports: [],
      errors,
      warnings,
      format: 'PDF'
    };
  }
}

/**
 * Determine PDF type based on content analysis
 */
function determinePdfType(text: string): 'URAR' | 'Condo' | 'Land' | 'Custom' {
  // Check for URAR form indicators
  if (
    text.includes('Uniform Residential Appraisal Report') ||
    text.includes('Form 1004') ||
    text.includes('Fannie Mae Form 1004')
  ) {
    return 'URAR';
  }
  
  // Check for Condo form indicators
  if (
    text.includes('Individual Condominium Unit Appraisal Report') ||
    text.includes('Form 1073') ||
    text.includes('Fannie Mae Form 1073')
  ) {
    return 'Condo';
  }
  
  // Check for Land appraisal form indicators
  if (
    text.includes('Land Appraisal Report') ||
    text.includes('Form 2055')
  ) {
    return 'Land';
  }
  
  // Default to custom/narrative appraisal
  return 'Custom';
}

/**
 * Extract data from URAR Form (Fannie Mae Form 1004)
 */
function extractFromURARForm(
  text: string,
  fileName: string
): {
  properties: Partial<InsertProperty>[],
  comparables: Partial<InsertComparable>[],
  reports: Partial<InsertReport>[],
  errors: string[],
  warnings: string[],
  format: string
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const properties: Partial<InsertProperty>[] = [];
  const comparables: Partial<InsertComparable>[] = [];
  const reports: Partial<InsertReport>[] = [];
  
  try {
    // Extract subject property address
    let propertyAddress = '';
    let city = '';
    let state = '';
    let zipCode = '';
    
    // Look for property address section
    const addressMatch = text.match(/Property Address\s*[\:\.]?\s*([^\n]+)/i);
    if (addressMatch && addressMatch[1]) {
      propertyAddress = addressMatch[1].trim();
    }
    
    // Look for city, state, zip
    const cityStateZipMatch = text.match(/City\s*[\:\.]?\s*([^\n]+)\s*State\s*[\:\.]?\s*([A-Z]{2})\s*Zip Code\s*[\:\.]?\s*(\d{5}(?:-\d{4})?)/i);
    if (cityStateZipMatch) {
      city = cityStateZipMatch[1].trim();
      state = cityStateZipMatch[2].trim();
      zipCode = cityStateZipMatch[3].trim();
    }
    
    // Extract other property details
    let propertyType = '';
    const propertyTypeMatch = text.match(/Property Rights Appraised\s*[\:\.]?\s*([^\n]+)/i);
    if (propertyTypeMatch) {
      propertyType = propertyTypeMatch[1].trim();
    }
    
    // Try to find a more specific property type
    if (!propertyType || propertyType.includes('Fee Simple')) {
      const designMatch = text.match(/Design \(Style\)\s*[\:\.]?\s*([^\n]+)/i);
      if (designMatch) {
        propertyType = designMatch[1].trim();
      } else {
        // Default if we can't find anything specific
        propertyType = 'Single Family';
      }
    }
    
    // Extract year built
    let yearBuilt = 0;
    const yearBuiltMatch = text.match(/Year Built\s*[\:\.]?\s*(\d{4})/i);
    if (yearBuiltMatch) {
      yearBuilt = parseInt(yearBuiltMatch[1], 10);
    }
    
    // Extract bedrooms/bathrooms
    let bedrooms = 0;
    let bathrooms = 0;
    
    const bedroomsMatch = text.match(/Total\s+Bdrms\.\s+Bath[^\n]*\n[^\n]*(\d+)\s+(\d+)\s+(\d+(?:\.\d+)?)/i);
    if (bedroomsMatch) {
      // total rooms, bedrooms, bathrooms
      bedrooms = parseInt(bedroomsMatch[2], 10);
      bathrooms = parseFloat(bedroomsMatch[3]);
    }
    
    // Extract gross living area
    let grossLivingArea = 0;
    const glaMatch = text.match(/Gross Living Area\s*[\:\.]?\s*([\d,]+)\s*sq/i);
    if (glaMatch) {
      grossLivingArea = parseInt(glaMatch[1].replace(/,/g, ''), 10);
    }
    
    // Extract lot size
    let lotSize = 0;
    const lotSizeMatch = text.match(/Area\s*[\:\.]?\s*([\d,\.]+)\s*(acre|sq\.? ?ft\.?)/i);
    if (lotSizeMatch) {
      const size = parseFloat(lotSizeMatch[1].replace(/,/g, ''));
      const unit = lotSizeMatch[2].toLowerCase();
      
      // Convert to square feet if in acres
      if (unit.includes('acre')) {
        lotSize = size * 43560;
      } else {
        lotSize = size;
      }
    }
    
    // Create property object
    if (propertyAddress) {
      properties.push({
        userId: 1, // Default user ID
        address: propertyAddress,
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
      
      // Extract market value for the report
      let marketValue = 0;
      const valueMatch = text.match(/Opinion of Market Value\s*[\:\$]?\s*([\d,]+)/i);
      if (valueMatch) {
        marketValue = parseInt(valueMatch[1].replace(/,/g, ''), 10);
      }
      
      // Extract effective date
      let effectiveDate: Date | undefined;
      const dateMatch = text.match(/Effective Date\s*[\:\.]?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
      if (dateMatch) {
        effectiveDate = new Date(dateMatch[1]);
      } else {
        // Try alternate date format
        const altDateMatch = text.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/i);
        if (altDateMatch) {
          effectiveDate = new Date(altDateMatch[0]);
        }
      }
      
      // Create report object
      reports.push({
        userId: 1, // Default user ID
        propertyId: 0, // Will be set after property is inserted
        reportType: 'Appraisal Report',
        formType: 'URAR',
        status: 'completed',
        purpose: 'Market Value',
        effectiveDate,
        reportDate: effectiveDate,
        marketValue
      });
      
      // Extract comparable sales
      extractComparableSales(text, comparables);
    } else {
      warnings.push('Could not find property address in the PDF');
    }
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: 'PDF - URAR Form'
    };
  } catch (error) {
    console.error(`Error extracting data from URAR form: ${error}`);
    errors.push(`URAR form extraction failed: ${error.message || 'Unknown error'}`);
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: 'PDF - URAR Form'
    };
  }
}

/**
 * Extract data from Condo Form (Fannie Mae Form 1073)
 */
function extractFromCondoForm(
  text: string,
  fileName: string
): {
  properties: Partial<InsertProperty>[],
  comparables: Partial<InsertComparable>[],
  reports: Partial<InsertReport>[],
  errors: string[],
  warnings: string[],
  format: string
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const properties: Partial<InsertProperty>[] = [];
  const comparables: Partial<InsertComparable>[] = [];
  const reports: Partial<InsertReport>[] = [];
  
  try {
    // Extract subject property address
    let propertyAddress = '';
    let city = '';
    let state = '';
    let zipCode = '';
    
    // Look for property address section
    const addressMatch = text.match(/Property Address\s*[\:\.]?\s*([^\n]+)/i);
    if (addressMatch && addressMatch[1]) {
      propertyAddress = addressMatch[1].trim();
    }
    
    // Look for city, state, zip
    const cityStateZipMatch = text.match(/City\s*[\:\.]?\s*([^\n]+)\s*State\s*[\:\.]?\s*([A-Z]{2})\s*Zip Code\s*[\:\.]?\s*(\d{5}(?:-\d{4})?)/i);
    if (cityStateZipMatch) {
      city = cityStateZipMatch[1].trim();
      state = cityStateZipMatch[2].trim();
      zipCode = cityStateZipMatch[3].trim();
    }
    
    // Extract other property details
    const propertyType = 'Condominium';
    
    // Extract year built
    let yearBuilt = 0;
    const yearBuiltMatch = text.match(/Year Built\s*[\:\.]?\s*(\d{4})/i);
    if (yearBuiltMatch) {
      yearBuilt = parseInt(yearBuiltMatch[1], 10);
    }
    
    // Extract bedrooms/bathrooms
    let bedrooms = 0;
    let bathrooms = 0;
    
    const roomsMatch = text.match(/Total\s+Bdrms\.\s+Bath[^\n]*\n[^\n]*(\d+)\s+(\d+)\s+(\d+(?:\.\d+)?)/i);
    if (roomsMatch) {
      bedrooms = parseInt(roomsMatch[2], 10);
      bathrooms = parseFloat(roomsMatch[3]);
    }
    
    // Extract gross living area
    let grossLivingArea = 0;
    const glaMatch = text.match(/Gross Living Area\s*[\:\.]?\s*([\d,]+)\s*sq/i);
    if (glaMatch) {
      grossLivingArea = parseInt(glaMatch[1].replace(/,/g, ''), 10);
    }
    
    // Create property object
    if (propertyAddress) {
      properties.push({
        userId: 1, // Default user ID
        address: propertyAddress,
        city,
        state,
        zipCode,
        propertyType,
        yearBuilt,
        grossLivingArea,
        bedrooms,
        bathrooms
      });
      
      // Extract market value for the report
      let marketValue = 0;
      const valueMatch = text.match(/Opinion of Market Value\s*[\:\$]?\s*([\d,]+)/i);
      if (valueMatch) {
        marketValue = parseInt(valueMatch[1].replace(/,/g, ''), 10);
      }
      
      // Extract effective date
      let effectiveDate: Date | undefined;
      const dateMatch = text.match(/Effective Date\s*[\:\.]?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
      if (dateMatch) {
        effectiveDate = new Date(dateMatch[1]);
      }
      
      // Create report object
      reports.push({
        userId: 1, // Default user ID
        propertyId: 0, // Will be set after property is inserted
        reportType: 'Appraisal Report',
        formType: 'Condo',
        status: 'completed',
        purpose: 'Market Value',
        effectiveDate,
        marketValue
      });
      
      // Extract comparable sales
      extractComparableSales(text, comparables);
    } else {
      warnings.push('Could not find property address in the PDF');
    }
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: 'PDF - Condo Form'
    };
  } catch (error) {
    console.error(`Error extracting data from Condo form: ${error}`);
    errors.push(`Condo form extraction failed: ${error.message || 'Unknown error'}`);
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: 'PDF - Condo Form'
    };
  }
}

/**
 * Extract data from Land Appraisal Form
 */
function extractFromLandForm(
  text: string,
  fileName: string
): {
  properties: Partial<InsertProperty>[],
  comparables: Partial<InsertComparable>[],
  reports: Partial<InsertReport>[],
  errors: string[],
  warnings: string[],
  format: string
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const properties: Partial<InsertProperty>[] = [];
  const comparables: Partial<InsertComparable>[] = [];
  const reports: Partial<InsertReport>[] = [];
  
  try {
    // Extract subject property address
    let propertyAddress = '';
    let city = '';
    let state = '';
    let zipCode = '';
    
    // Look for property address section
    const addressMatch = text.match(/Property Address\s*[\:\.]?\s*([^\n]+)/i);
    if (addressMatch && addressMatch[1]) {
      propertyAddress = addressMatch[1].trim();
    }
    
    // Look for city, state, zip
    const cityStateZipMatch = text.match(/City\s*[\:\.]?\s*([^\n]+)\s*State\s*[\:\.]?\s*([A-Z]{2})\s*Zip Code\s*[\:\.]?\s*(\d{5}(?:-\d{4})?)/i);
    if (cityStateZipMatch) {
      city = cityStateZipMatch[1].trim();
      state = cityStateZipMatch[2].trim();
      zipCode = cityStateZipMatch[3].trim();
    }
    
    // Extract other property details
    const propertyType = 'Vacant Land';
    
    // Extract lot size
    let lotSize = 0;
    const lotSizeMatch = text.match(/Area\s*[\:\.]?\s*([\d,\.]+)\s*(acre|sq\.? ?ft\.?)/i);
    if (lotSizeMatch) {
      const size = parseFloat(lotSizeMatch[1].replace(/,/g, ''));
      const unit = lotSizeMatch[2].toLowerCase();
      
      // Convert to square feet if in acres
      if (unit.includes('acre')) {
        lotSize = size * 43560;
      } else {
        lotSize = size;
      }
    }
    
    // Create property object
    if (propertyAddress) {
      properties.push({
        userId: 1, // Default user ID
        address: propertyAddress,
        city,
        state,
        zipCode,
        propertyType,
        lotSize
      });
      
      // Extract market value for the report
      let marketValue = 0;
      const valueMatch = text.match(/Opinion of Market Value\s*[\:\$]?\s*([\d,]+)/i);
      if (valueMatch) {
        marketValue = parseInt(valueMatch[1].replace(/,/g, ''), 10);
      }
      
      // Extract effective date
      let effectiveDate: Date | undefined;
      const dateMatch = text.match(/Effective Date\s*[\:\.]?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
      if (dateMatch) {
        effectiveDate = new Date(dateMatch[1]);
      }
      
      // Create report object
      reports.push({
        userId: 1, // Default user ID
        propertyId: 0, // Will be set after property is inserted
        reportType: 'Appraisal Report',
        formType: 'Land',
        status: 'completed',
        purpose: 'Market Value',
        effectiveDate,
        marketValue
      });
      
      // Extract comparable sales
      extractLandComparables(text, comparables);
    } else {
      warnings.push('Could not find property address in the PDF');
    }
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: 'PDF - Land Form'
    };
  } catch (error) {
    console.error(`Error extracting data from Land form: ${error}`);
    errors.push(`Land form extraction failed: ${error.message || 'Unknown error'}`);
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: 'PDF - Land Form'
    };
  }
}

/**
 * Extract data from generic appraisal report using pattern matching
 */
function extractFromGenericAppraisal(
  text: string,
  fileName: string
): {
  properties: Partial<InsertProperty>[],
  comparables: Partial<InsertComparable>[],
  reports: Partial<InsertReport>[],
  errors: string[],
  warnings: string[],
  format: string
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const properties: Partial<InsertProperty>[] = [];
  const comparables: Partial<InsertComparable>[] = [];
  const reports: Partial<InsertReport>[] = [];
  
  try {
    // Use the utility function to extract appraisal data
    const { addresses, propertyTypes, valuations, dates } = identifyAppraisalData(text);
    
    // Process identified addresses
    if (addresses.length > 0) {
      // The first address is likely the subject property
      const mainAddress = addresses[0];
      
      // Try to parse address components
      const addressParts = parseAddress(mainAddress);
      
      if (addressParts) {
        // Create property object
        properties.push({
          userId: 1,
          address: addressParts.address,
          city: addressParts.city,
          state: addressParts.state,
          zipCode: addressParts.zipCode,
          propertyType: propertyTypes.length > 0 ? propertyTypes[0] : 'Unknown'
        });
        
        // Create report object
        const marketValue = valuations.length > 0 ? valuations[0] : 0;
        
        let effectiveDate: Date | undefined;
        if (dates.length > 0) {
          try {
            effectiveDate = new Date(dates[0]);
          } catch (e) {
            // Invalid date format, ignore
          }
        }
        
        reports.push({
          userId: 1,
          propertyId: 0, // Will be set after property is inserted
          reportType: 'Appraisal Report',
          formType: 'Narrative',
          status: 'completed',
          purpose: 'Market Value',
          effectiveDate,
          marketValue
        });
        
        // Process additional addresses as potential comparables
        if (addresses.length > 1) {
          for (let i = 1; i < Math.min(addresses.length, 5); i++) {
            const compAddress = addresses[i];
            const compParts = parseAddress(compAddress);
            
            if (compParts) {
              // Try to find a value for this comparable
              let salePrice = 0;
              if (i < valuations.length) {
                salePrice = valuations[i];
              }
              
              // Try to find a date for this comparable
              let saleDate: Date | undefined;
              if (i < dates.length) {
                try {
                  saleDate = new Date(dates[i]);
                } catch (e) {
                  // Invalid date format, ignore
                }
              }
              
              comparables.push({
                reportId: 0, // Will be set after report is inserted
                compType: 'sale',
                address: compParts.address,
                city: compParts.city,
                state: compParts.state,
                zipCode: compParts.zipCode,
                salePrice,
                saleDate
              });
            }
          }
        }
      } else {
        warnings.push('Could not parse address components from the PDF');
      }
    } else {
      warnings.push('Could not find property addresses in the PDF');
    }
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: 'PDF - Generic Appraisal'
    };
  } catch (error) {
    console.error(`Error extracting data from generic appraisal: ${error}`);
    errors.push(`Generic appraisal extraction failed: ${error.message || 'Unknown error'}`);
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: 'PDF - Generic Appraisal'
    };
  }
}

/**
 * Extract comparable sales from form text
 */
function extractComparableSales(
  text: string,
  comparables: Partial<InsertComparable>[]
): void {
  // Look for the comparable sales grid section
  // This is a complex task due to the varied formatting of appraisal forms
  
  // For URAR forms, try to find the sales comparison approach section
  const salesCompSection = text.match(/SALES COMPARISON APPROACH(.*?)RECONCILIATION/is);
  
  if (!salesCompSection) {
    return;
  }
  
  const sectionText = salesCompSection[1];
  
  // Extract comparable addresses
  // In URAR forms, comp addresses are often labeled as "Comparable Sale #1", etc.
  for (let i = 1; i <= 3; i++) {
    const compAddressMatch = sectionText.match(new RegExp(`Comparable Sale #${i}[^\\n]*\\n([^\\n]+)`, 'i'));
    
    if (compAddressMatch && compAddressMatch[1]) {
      const compAddress = compAddressMatch[1].trim();
      
      // Extract sale price
      let salePrice = 0;
      const salePriceMatch = sectionText.match(new RegExp(`Sale Price[^\\n]*\\n[^\\n]*#${i}\\s*\\$(\\d+,\\d+|\\d+)`, 'i'));
      if (salePriceMatch && salePriceMatch[1]) {
        salePrice = parseInt(salePriceMatch[1].replace(/,/g, ''), 10);
      }
      
      // Extract sale date
      let saleDate: Date | undefined;
      const saleDateMatch = sectionText.match(new RegExp(`Date of Sale[^\\n]*\\n[^\\n]*#${i}\\s*([\\d\\/]+)`, 'i'));
      if (saleDateMatch && saleDateMatch[1]) {
        try {
          saleDate = new Date(saleDateMatch[1]);
        } catch (e) {
          // Invalid date format, ignore
        }
      }
      
      // Extract distance from subject
      let proximityToSubject = '';
      const proximityMatch = sectionText.match(new RegExp(`Proximity to Subject[^\\n]*\\n[^\\n]*#${i}\\s*([^\\n]+)`, 'i'));
      if (proximityMatch && proximityMatch[1]) {
        proximityToSubject = proximityMatch[1].trim();
      }
      
      // Try to parse the address
      const addressParts = parseAddress(compAddress);
      
      if (addressParts) {
        comparables.push({
          reportId: 0, // Will be set after report is inserted
          compType: 'sale',
          address: addressParts.address,
          city: addressParts.city,
          state: addressParts.state,
          zipCode: addressParts.zipCode,
          proximityToSubject,
          salePrice,
          saleDate
        });
      }
    }
  }
}

/**
 * Extract land comparables from form text
 */
function extractLandComparables(
  text: string,
  comparables: Partial<InsertComparable>[]
): void {
  // Similar to extractComparableSales but adapted for land forms
  const salesCompSection = text.match(/SALES COMPARISON APPROACH(.*?)RECONCILIATION/is);
  
  if (!salesCompSection) {
    return;
  }
  
  const sectionText = salesCompSection[1];
  
  // Extract comparable addresses
  for (let i = 1; i <= 3; i++) {
    const compAddressMatch = sectionText.match(new RegExp(`Comparable Sale #${i}[^\\n]*\\n([^\\n]+)`, 'i'));
    
    if (compAddressMatch && compAddressMatch[1]) {
      const compAddress = compAddressMatch[1].trim();
      
      // Extract sale price
      let salePrice = 0;
      const salePriceMatch = sectionText.match(new RegExp(`Sale Price[^\\n]*\\n[^\\n]*#${i}\\s*\\$(\\d+,\\d+|\\d+)`, 'i'));
      if (salePriceMatch && salePriceMatch[1]) {
        salePrice = parseInt(salePriceMatch[1].replace(/,/g, ''), 10);
      }
      
      // Extract sale date
      let saleDate: Date | undefined;
      const saleDateMatch = sectionText.match(new RegExp(`Date of Sale[^\\n]*\\n[^\\n]*#${i}\\s*([\\d\\/]+)`, 'i'));
      if (saleDateMatch && saleDateMatch[1]) {
        try {
          saleDate = new Date(saleDateMatch[1]);
        } catch (e) {
          // Invalid date format, ignore
        }
      }
      
      // Try to parse the address
      const addressParts = parseAddress(compAddress);
      
      if (addressParts) {
        comparables.push({
          reportId: 0, // Will be set after report is inserted
          compType: 'sale',
          address: addressParts.address,
          city: addressParts.city,
          state: addressParts.state,
          zipCode: addressParts.zipCode,
          salePrice,
          saleDate
        });
      }
    }
  }
}

/**
 * Parse address string into components
 */
function parseAddress(address: string): {
  address: string,
  city: string,
  state: string,
  zipCode: string
} | null {
  // Try to match address with city, state, zip
  const fullAddressRegex = /^(.*?),\s*(.*?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/;
  const match = address.match(fullAddressRegex);
  
  if (match) {
    return {
      address: match[1].trim(),
      city: match[2].trim(),
      state: match[3].trim(),
      zipCode: match[4].trim()
    };
  }
  
  // If no match, try to extract just the state and zip
  const stateZipRegex = /(.*?)([A-Z]{2})\s*(\d{5}(?:-\d{4})?)/;
  const partialMatch = address.match(stateZipRegex);
  
  if (partialMatch) {
    // Try to extract city from the remaining text
    const remainingText = partialMatch[1].trim();
    const cityMatch = remainingText.match(/(.*?),\s*([^,]+)$/);
    
    if (cityMatch) {
      return {
        address: cityMatch[1].trim(),
        city: cityMatch[2].trim(),
        state: partialMatch[2].trim(),
        zipCode: partialMatch[3].trim()
      };
    }
    
    // Fallback if we can't reliably extract city
    return {
      address: remainingText.replace(/,\s*$/, ''),
      city: 'Unknown',
      state: partialMatch[2].trim(),
      zipCode: partialMatch[3].trim()
    };
  }
  
  return null;
}