/**
 * Work File Parser
 * 
 * Extracts data from proprietary appraisal software work files like:
 * - ACI (.aci, .env files)
 * - a la mode (.xml, .alamode files)
 * - Bradford Technologies (.zap files)
 * - FormNet/Equity (.formnet files)
 * 
 * These files have different structures but contain similar appraisal data.
 */

import * as xml2js from 'xml2js';
import { Partial as PartialType } from 'utility-types';
import { Property, InsertProperty, Report, InsertReport, Comparable, InsertComparable } from '../types';
import { identifyAppraisalData } from './index';

/**
 * Extract data from appraisal work files
 */
export async function extractFromWorkFile(
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
    console.log(`Extracting data from work file: ${fileName}`);
    
    // Determine work file type based on file extension or content
    const fileType = determineWorkFileType(fileName, fileBuffer);
    console.log(`Work file type detected: ${fileType}`);
    
    // Process work file based on detected type
    switch (fileType) {
      case 'aci':
        await extractFromACIFile(fileBuffer, fileName, properties, comparables, reports, warnings);
        break;
      case 'alamode':
        await extractFromALaModeFile(fileBuffer, fileName, properties, comparables, reports, warnings);
        break;
      case 'bradford':
        await extractFromBradfordFile(fileBuffer, fileName, properties, comparables, reports, warnings);
        break;
      case 'formnet':
        await extractFromFormNetFile(fileBuffer, fileName, properties, comparables, reports, warnings);
        break;
      default:
        // Try generic extraction if specific format can't be determined
        await extractFromGenericWorkFile(fileBuffer, fileName, properties, comparables, reports, warnings);
    }
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: `Work File - ${fileType}`
    };
  } catch (error) {
    console.error(`Error extracting data from work file: ${error}`);
    errors.push(`Work file extraction failed: ${error.message || 'Unknown error'}`);
    
    return {
      properties,
      comparables,
      reports,
      errors,
      warnings,
      format: 'Work File'
    };
  }
}

/**
 * Determine work file type based on file extension and content
 */
function determineWorkFileType(fileName: string, fileBuffer: Buffer): 'aci' | 'alamode' | 'bradford' | 'formnet' | 'unknown' {
  // Check file extension
  const lowerFileName = fileName.toLowerCase();
  
  if (lowerFileName.endsWith('.aci') || lowerFileName.endsWith('.env')) {
    return 'aci';
  } else if (lowerFileName.endsWith('.alamode') || (lowerFileName.endsWith('.xml') && isALaModeXML(fileBuffer))) {
    return 'alamode';
  } else if (lowerFileName.endsWith('.zap')) {
    return 'bradford';
  } else if (lowerFileName.endsWith('.formnet')) {
    return 'formnet';
  }
  
  // If extension doesn't match, try to identify by content
  const fileString = fileBuffer.toString('utf-8', 0, Math.min(2000, fileBuffer.length));
  
  if (fileString.includes('ACI') || fileString.includes('ENV_FILE')) {
    return 'aci';
  } else if (fileString.includes('a la mode') || fileString.includes('ALAMODE')) {
    return 'alamode';
  } else if (fileString.includes('Bradford') || fileString.includes('ClickFORMS')) {
    return 'bradford';
  } else if (fileString.includes('FormNet') || fileString.includes('EqWeb')) {
    return 'formnet';
  }
  
  return 'unknown';
}

/**
 * Check if an XML file is from a la mode software
 */
function isALaModeXML(fileBuffer: Buffer): boolean {
  const xmlString = fileBuffer.toString('utf-8', 0, Math.min(2000, fileBuffer.length));
  return xmlString.includes('a la mode') || 
         xmlString.includes('ALAMODE') || 
         xmlString.includes('TOTAL XML') ||
         xmlString.includes('WinTOTAL');
}

/**
 * Extract data from ACI work files (.aci, .env)
 */
async function extractFromACIFile(
  fileBuffer: Buffer,
  fileName: string,
  properties: PartialType<InsertProperty>[],
  comparables: PartialType<InsertComparable>[],
  reports: PartialType<InsertReport>[],
  warnings: string[]
): Promise<void> {
  // ACI files are typically in a proprietary format, but often contain 
  // sections with clearly marked field names and values
  const fileContent = fileBuffer.toString('utf-8');
  
  // Try to extract using pattern matching
  // ACI files often have sections like [PROPERTY], [COMPARABLES], etc.
  const propertySection = extractSection(fileContent, 'PROPERTY', 'SUBJECT');
  const comparablesSection = extractSection(fileContent, 'COMPARABLES', 'COMPS');
  const reportSection = extractSection(fileContent, 'REPORT', 'APPRAISAL');
  
  // Extract property data
  if (propertySection) {
    const address = extractField(propertySection, ['Address', 'PropertyAddress', 'Street']);
    const city = extractField(propertySection, ['City', 'PropertyCity']);
    const state = extractField(propertySection, ['State', 'PropertyState', 'ST']);
    const zipCode = extractField(propertySection, ['ZipCode', 'Zip', 'ZIP']);
    const propertyType = extractField(propertySection, ['PropertyType', 'PropType', 'Type']);
    const yearBuilt = extractNumberField(propertySection, ['YearBuilt', 'Year', 'YrBlt']);
    const grossLivingArea = extractNumberField(propertySection, ['GLA', 'LivingArea', 'SqFt', 'SquareFeet']);
    const lotSize = extractNumberField(propertySection, ['LotSize', 'Lot', 'LandArea']);
    const bedrooms = extractNumberField(propertySection, ['Beds', 'Bedrooms', 'BR']);
    const bathrooms = extractNumberField(propertySection, ['Baths', 'Bathrooms', 'BA']);
    
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
    } else {
      // If pattern matching fails, try to extract data using the utility function
      const extractedData = identifyAppraisalData(fileContent);
      
      if (extractedData.addresses.length > 0) {
        const addressParts = parseAddress(extractedData.addresses[0]);
        
        if (addressParts) {
          properties.push({
            userId: 1,
            address: addressParts.address,
            city: addressParts.city,
            state: addressParts.state,
            zipCode: addressParts.zipCode,
            propertyType: extractedData.propertyTypes.length > 0 ? extractedData.propertyTypes[0] : 'Unknown'
          });
        }
      } else {
        warnings.push('Could not extract property information from ACI file');
      }
    }
  }
  
  // Extract report data
  if (reportSection || propertySection) {
    const section = reportSection || propertySection;
    
    const marketValue = extractNumberField(section, ['MarketValue', 'Value', 'OpinionOfValue', 'AppraisedValue']);
    const effectiveDate = extractDateField(section, ['EffectiveDate', 'AppraisalDate', 'ValueDate']);
    const reportDate = extractDateField(section, ['ReportDate', 'DateOfReport', 'DatePrepared']);
    const formType = extractField(section, ['FormType', 'Form', 'ReportForm']) || 'URAR';
    
    if (properties.length > 0) {
      reports.push({
        userId: 1, // Default user ID
        propertyId: 0, // Will be set after property is inserted
        reportType: 'Appraisal Report',
        formType,
        status: 'completed',
        purpose: 'Market Value',
        effectiveDate,
        reportDate,
        marketValue
      });
    }
  }
  
  // Extract comparable data
  if (comparablesSection) {
    // ACI files often list comparables with numbered prefixes like "Comp1_", "Comp2_"
    const compPrefixes = ['Comp1_', 'Comp2_', 'Comp3_', 'Comp4_', 'Comp5_', 'Comp6_'];
    
    for (const prefix of compPrefixes) {
      // Try to extract comparable data with the current prefix
      const compAddress = extractField(comparablesSection, [`${prefix}Address`, `${prefix}Street`]);
      const compCity = extractField(comparablesSection, [`${prefix}City`]);
      const compState = extractField(comparablesSection, [`${prefix}State`, `${prefix}ST`]);
      const compZip = extractField(comparablesSection, [`${prefix}Zip`, `${prefix}ZipCode`]);
      
      // Only process if we found address information
      if (compAddress || (compCity && compState)) {
        const salePrice = extractNumberField(comparablesSection, [
          `${prefix}SalePrice`, `${prefix}Price`, `${prefix}Value`
        ]);
        
        const saleDate = extractDateField(comparablesSection, [
          `${prefix}SaleDate`, `${prefix}Date`, `${prefix}TransactionDate`
        ]);
        
        const proximityToSubject = extractField(comparablesSection, [
          `${prefix}Proximity`, `${prefix}Distance`, `${prefix}ProximityToSubject`
        ]);
        
        comparables.push({
          reportId: 0, // Will be set after report is inserted
          compType: 'sale',
          address: compAddress || '',
          city: compCity || '',
          state: compState || '',
          zipCode: compZip || '',
          proximityToSubject,
          salePrice,
          saleDate,
          grossLivingArea: extractNumberField(comparablesSection, [
            `${prefix}GLA`, `${prefix}LivingArea`, `${prefix}SqFt`
          ]),
          bedrooms: extractNumberField(comparablesSection, [
            `${prefix}Beds`, `${prefix}Bedrooms`, `${prefix}BR`
          ]),
          bathrooms: extractNumberField(comparablesSection, [
            `${prefix}Baths`, `${prefix}Bathrooms`, `${prefix}BA`
          ])
        });
      }
    }
    
    // If we couldn't find any comparables with prefixes, try other approaches
    if (comparables.length === 0) {
      // Try to extract using delimiter patterns
      const compSections = comparablesSection.split(/Comparable\s*\d+|Comp\s*\d+/gi);
      
      if (compSections.length > 1) {
        // Skip the first section as it might be a header
        for (let i = 1; i < compSections.length; i++) {
          const section = compSections[i];
          
          const compAddress = extractField(section, ['Address', 'Street']);
          const compCity = extractField(section, ['City']);
          const compState = extractField(section, ['State', 'ST']);
          const compZip = extractField(section, ['Zip', 'ZipCode']);
          
          if (compAddress || (compCity && compState)) {
            comparables.push({
              reportId: 0,
              compType: 'sale',
              address: compAddress || '',
              city: compCity || '',
              state: compState || '',
              zipCode: compZip || '',
              proximityToSubject: extractField(section, ['Proximity', 'Distance']),
              salePrice: extractNumberField(section, ['SalePrice', 'Price', 'Value']),
              saleDate: extractDateField(section, ['SaleDate', 'Date']),
              grossLivingArea: extractNumberField(section, ['GLA', 'LivingArea', 'SqFt']),
              bedrooms: extractNumberField(section, ['Beds', 'Bedrooms', 'BR']),
              bathrooms: extractNumberField(section, ['Baths', 'Bathrooms', 'BA'])
            });
          }
        }
      }
    }
  }
}

/**
 * Extract data from a la mode work files (.alamode, some .xml files)
 */
async function extractFromALaModeFile(
  fileBuffer: Buffer,
  fileName: string,
  properties: PartialType<InsertProperty>[],
  comparables: PartialType<InsertComparable>[],
  reports: PartialType<InsertReport>[],
  warnings: string[]
): Promise<void> {
  // A la mode files are often in XML format
  const fileContent = fileBuffer.toString('utf-8');
  
  // Check if it's an XML file
  if (fileContent.startsWith('<?xml') || fileContent.includes('<APPRAISAL>')) {
    try {
      // Parse XML
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(fileContent);
      
      // Find the appraisal data
      const appraisalData = result.APPRAISAL || result.REPORT || result.ALAMODE || result;
      
      // Extract property data
      const subjectData = appraisalData.SUBJECT || appraisalData.PROPERTY || {};
      
      const address = subjectData.ADDRESS || subjectData.STREET || '';
      const city = subjectData.CITY || '';
      const state = subjectData.STATE || '';
      const zipCode = subjectData.ZIP || subjectData.ZIPCODE || '';
      const propertyType = subjectData.PROPERTY_TYPE || subjectData.TYPE || 'Unknown';
      const yearBuilt = parseInt(subjectData.YEAR_BUILT || subjectData.YEARBUILT || '0', 10) || 0;
      const grossLivingArea = parseInt(subjectData.GLA || subjectData.SQUARE_FEET || '0', 10) || 0;
      const lotSize = parseInt(subjectData.LOT_SIZE || subjectData.LOTSIZE || '0', 10) || 0;
      const bedrooms = parseInt(subjectData.BEDROOMS || subjectData.BEDS || '0', 10) || 0;
      const bathrooms = parseFloat(subjectData.BATHROOMS || subjectData.BATHS || '0') || 0;
      
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
        
        // Extract report data
        const valuationData = appraisalData.VALUATION || appraisalData.VALUE || {};
        
        const marketValue = parseInt(valuationData.MARKET_VALUE || valuationData.VALUE || '0', 10) || 0;
        
        // Parse dates
        let effectiveDate: Date | undefined;
        const effectiveDateStr = valuationData.EFFECTIVE_DATE || valuationData.VALUEDATE || appraisalData.EFFECTIVE_DATE;
        if (effectiveDateStr) {
          try {
            effectiveDate = new Date(effectiveDateStr);
          } catch (e) {
            // Invalid date format, ignore
          }
        }
        
        let reportDate: Date | undefined;
        const reportDateStr = valuationData.REPORT_DATE || appraisalData.REPORT_DATE || appraisalData.DATE;
        if (reportDateStr) {
          try {
            reportDate = new Date(reportDateStr);
          } catch (e) {
            // Invalid date format, ignore
          }
        }
        
        const formType = valuationData.FORM_TYPE || appraisalData.FORM_TYPE || appraisalData.FORM || 'URAR';
        
        reports.push({
          userId: 1, // Default user ID
          propertyId: 0, // Will be set after property is inserted
          reportType: 'Appraisal Report',
          formType,
          status: 'completed',
          purpose: 'Market Value',
          effectiveDate,
          reportDate,
          marketValue
        });
        
        // Extract comparable data
        const compsData = appraisalData.COMPARABLES || appraisalData.COMPARABLE_SALES || {};
        const compsList = compsData.COMPARABLE ? 
          (Array.isArray(compsData.COMPARABLE) ? compsData.COMPARABLE : [compsData.COMPARABLE]) : 
          [];
        
        for (const comp of compsList) {
          const compAddress = comp.ADDRESS || comp.STREET || '';
          const compCity = comp.CITY || '';
          const compState = comp.STATE || '';
          const compZip = comp.ZIP || comp.ZIPCODE || '';
          
          if (compAddress || (compCity && compState)) {
            // Parse sale price
            const salePriceStr = comp.SALE_PRICE || comp.PRICE || '0';
            const salePrice = parseInt(salePriceStr.replace(/[^\d]/g, ''), 10) || 0;
            
            // Parse sale date
            let saleDate: Date | undefined;
            const saleDateStr = comp.SALE_DATE || comp.DATE;
            if (saleDateStr) {
              try {
                saleDate = new Date(saleDateStr);
              } catch (e) {
                // Invalid date format, ignore
              }
            }
            
            const proximityToSubject = comp.PROXIMITY || comp.DISTANCE || '';
            
            comparables.push({
              reportId: 0, // Will be set after report is inserted
              compType: 'sale',
              address: compAddress,
              city: compCity,
              state: compState,
              zipCode: compZip,
              proximityToSubject,
              salePrice,
              saleDate,
              grossLivingArea: parseInt(comp.GLA || comp.SQUARE_FEET || '0', 10) || 0,
              bedrooms: parseInt(comp.BEDROOMS || comp.BEDS || '0', 10) || 0,
              bathrooms: parseFloat(comp.BATHROOMS || comp.BATHS || '0') || 0,
              yearBuilt: parseInt(comp.YEAR_BUILT || comp.YEARBUILT || '0', 10) || 0
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error parsing a la mode XML: ${error}`);
      warnings.push(`Error parsing a la mode XML: ${error.message}`);
      
      // Fall back to text-based extraction
      await extractFromGenericWorkFile(fileBuffer, fileName, properties, comparables, reports, warnings);
    }
  } else {
    // If it's not XML, treat it as a generic text file
    await extractFromGenericWorkFile(fileBuffer, fileName, properties, comparables, reports, warnings);
  }
}

/**
 * Extract data from Bradford Technologies work files (.zap)
 */
async function extractFromBradfordFile(
  fileBuffer: Buffer,
  fileName: string,
  properties: PartialType<InsertProperty>[],
  comparables: PartialType<InsertComparable>[],
  reports: PartialType<InsertReport>[],
  warnings: string[]
): Promise<void> {
  // Bradford files often use a proprietary binary format
  // However, they may contain sections of plain text that we can extract
  const fileContent = fileBuffer.toString('utf-8', 0, Math.min(fileBuffer.length, 100000));
  
  // Try to extract using the utility function
  const extractedData = identifyAppraisalData(fileContent);
  
  // Process extracted address
  if (extractedData.addresses.length > 0) {
    const addressParts = parseAddress(extractedData.addresses[0]);
    
    if (addressParts) {
      properties.push({
        userId: 1,
        address: addressParts.address,
        city: addressParts.city,
        state: addressParts.state,
        zipCode: addressParts.zipCode,
        propertyType: extractedData.propertyTypes.length > 0 ? extractedData.propertyTypes[0] : 'Unknown'
      });
      
      // Create a report
      const marketValue = extractedData.valuations.length > 0 ? extractedData.valuations[0] : 0;
      
      let effectiveDate: Date | undefined;
      if (extractedData.dates.length > 0) {
        try {
          effectiveDate = new Date(extractedData.dates[0]);
        } catch (e) {
          // Invalid date format, ignore
        }
      }
      
      reports.push({
        userId: 1,
        propertyId: 0, // Will be set after property is inserted
        reportType: 'Appraisal Report',
        formType: 'URAR',
        status: 'completed',
        purpose: 'Market Value',
        effectiveDate,
        marketValue
      });
      
      // Process additional addresses as comparables
      if (extractedData.addresses.length > 1) {
        for (let i = 1; i < Math.min(extractedData.addresses.length, 6); i++) {
          const compParts = parseAddress(extractedData.addresses[i]);
          
          if (compParts) {
            // Try to find a value for this comparable
            let salePrice = 0;
            if (i < extractedData.valuations.length) {
              salePrice = extractedData.valuations[i];
            }
            
            // Try to find a date for this comparable
            let saleDate: Date | undefined;
            if (i < extractedData.dates.length) {
              try {
                saleDate = new Date(extractedData.dates[i]);
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
      warnings.push('Could not parse address components from Bradford file');
    }
  } else {
    warnings.push('Could not extract property information from Bradford file');
  }
}

/**
 * Extract data from FormNet/Equity work files (.formnet)
 */
async function extractFromFormNetFile(
  fileBuffer: Buffer,
  fileName: string,
  properties: PartialType<InsertProperty>[],
  comparables: PartialType<InsertComparable>[],
  reports: PartialType<InsertReport>[],
  warnings: string[]
): Promise<void> {
  // FormNet files might be in a proprietary format
  // Let's try to extract data using the utility function
  const fileContent = fileBuffer.toString('utf-8', 0, Math.min(fileBuffer.length, 100000));
  
  // Try to extract using the utility function
  const extractedData = identifyAppraisalData(fileContent);
  
  if (extractedData.addresses.length > 0) {
    const addressParts = parseAddress(extractedData.addresses[0]);
    
    if (addressParts) {
      properties.push({
        userId: 1,
        address: addressParts.address,
        city: addressParts.city,
        state: addressParts.state,
        zipCode: addressParts.zipCode,
        propertyType: extractedData.propertyTypes.length > 0 ? extractedData.propertyTypes[0] : 'Unknown'
      });
      
      // Create a report
      const marketValue = extractedData.valuations.length > 0 ? extractedData.valuations[0] : 0;
      
      let effectiveDate: Date | undefined;
      if (extractedData.dates.length > 0) {
        try {
          effectiveDate = new Date(extractedData.dates[0]);
        } catch (e) {
          // Invalid date format, ignore
        }
      }
      
      reports.push({
        userId: 1,
        propertyId: 0, // Will be set after property is inserted
        reportType: 'Appraisal Report',
        formType: 'URAR',
        status: 'completed',
        purpose: 'Market Value',
        effectiveDate,
        marketValue
      });
      
      // Process additional addresses as comparables
      if (extractedData.addresses.length > 1) {
        for (let i = 1; i < Math.min(extractedData.addresses.length, 6); i++) {
          const compParts = parseAddress(extractedData.addresses[i]);
          
          if (compParts) {
            // Try to find a value for this comparable
            let salePrice = 0;
            if (i < extractedData.valuations.length) {
              salePrice = extractedData.valuations[i];
            }
            
            // Try to find a date for this comparable
            let saleDate: Date | undefined;
            if (i < extractedData.dates.length) {
              try {
                saleDate = new Date(extractedData.dates[i]);
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
      warnings.push('Could not parse address components from FormNet file');
    }
  } else {
    warnings.push('Could not extract property information from FormNet file');
  }
}

/**
 * Extract data from a generic work file
 */
async function extractFromGenericWorkFile(
  fileBuffer: Buffer,
  fileName: string,
  properties: PartialType<InsertProperty>[],
  comparables: PartialType<InsertComparable>[],
  reports: PartialType<InsertReport>[],
  warnings: string[]
): Promise<void> {
  // For files that don't match known formats, try to extract data using pattern recognition
  const fileContent = fileBuffer.toString('utf-8', 0, Math.min(fileBuffer.length, 100000));
  
  // Use the utility function to extract appraisal data
  const extractedData = identifyAppraisalData(fileContent);
  
  if (extractedData.addresses.length > 0) {
    const addressParts = parseAddress(extractedData.addresses[0]);
    
    if (addressParts) {
      properties.push({
        userId: 1,
        address: addressParts.address,
        city: addressParts.city,
        state: addressParts.state,
        zipCode: addressParts.zipCode,
        propertyType: extractedData.propertyTypes.length > 0 ? extractedData.propertyTypes[0] : 'Unknown'
      });
      
      // Create a report
      const marketValue = extractedData.valuations.length > 0 ? extractedData.valuations[0] : 0;
      
      let effectiveDate: Date | undefined;
      if (extractedData.dates.length > 0) {
        try {
          effectiveDate = new Date(extractedData.dates[0]);
        } catch (e) {
          // Invalid date format, ignore
        }
      }
      
      reports.push({
        userId: 1,
        propertyId: 0, // Will be set after property is inserted
        reportType: 'Appraisal Report',
        formType: 'URAR',
        status: 'completed',
        purpose: 'Market Value',
        effectiveDate,
        marketValue
      });
      
      // Process additional addresses as comparables
      if (extractedData.addresses.length > 1) {
        for (let i = 1; i < Math.min(extractedData.addresses.length, 6); i++) {
          const compParts = parseAddress(extractedData.addresses[i]);
          
          if (compParts) {
            // Try to find a value for this comparable
            let salePrice = 0;
            if (i < extractedData.valuations.length) {
              salePrice = extractedData.valuations[i];
            }
            
            // Try to find a date for this comparable
            let saleDate: Date | undefined;
            if (i < extractedData.dates.length) {
              try {
                saleDate = new Date(extractedData.dates[i]);
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
      warnings.push('Could not parse address components from work file');
    }
  } else {
    warnings.push('Could not extract property information from work file');
  }
}

/**
 * Extract a section from file content
 */
function extractSection(
  content: string,
  ...sectionNames: string[]
): string | undefined {
  for (const name of sectionNames) {
    // Try common section markers
    const markers = [
      new RegExp(`\\[${name}\\](.*?)\\[END_${name}\\]`, 'is'),
      new RegExp(`<${name}>(.*?)</${name}>`, 'is'),
      new RegExp(`\\[${name}\\](.*?)\\[`, 'is'),
      new RegExp(`BEGIN_${name}(.*?)END_${name}`, 'is'),
      new RegExp(`\\*\\*\\*\\s*${name}\\s*\\*\\*\\*(.*?)\\*\\*\\*`, 'is')
    ];
    
    for (const marker of markers) {
      const match = content.match(marker);
      if (match && match[1]) {
        return match[1];
      }
    }
  }
  
  return undefined;
}

/**
 * Extract a field value from a section
 */
function extractField(
  section: string,
  fieldNames: string[]
): string | undefined {
  for (const name of fieldNames) {
    // Try different field formats
    const formats = [
      new RegExp(`${name}\\s*[=:]\\s*([^\\r\\n]+)`, 'i'),
      new RegExp(`"${name}"\\s*[=:]\\s*"([^"]+)"`, 'i'),
      new RegExp(`<${name}>([^<]+)</${name}>`, 'i'),
      new RegExp(`\\[${name}\\]([^\\[]*)\\[`, 'i'),
      new RegExp(`${name}\\s*:([^:]+):`, 'i')
    ];
    
    for (const format of formats) {
      const match = section.match(format);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }
  
  return undefined;
}

/**
 * Extract a number field value from a section
 */
function extractNumberField(
  section: string,
  fieldNames: string[]
): number {
  const value = extractField(section, fieldNames);
  
  if (value) {
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');
    const numericValue = Number(cleanValue);
    
    if (!isNaN(numericValue)) {
      return numericValue;
    }
  }
  
  return 0;
}

/**
 * Extract a date field value from a section
 */
function extractDateField(
  section: string,
  fieldNames: string[]
): Date | undefined {
  const value = extractField(section, fieldNames);
  
  if (value) {
    try {
      return new Date(value);
    } catch (e) {
      // Invalid date format, ignore
    }
  }
  
  return undefined;
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