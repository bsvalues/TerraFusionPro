/**
 * PDF Batch Exporter
 * 
 * This service handles batch export of PDFs for multiple comparables.
 * It provides functionality for both individual PDF exports and
 * consolidated ZIP archives containing multiple PDFs and metadata.
 */

import * as fs from 'fs';
import * as path from 'path';
import { jsPDF } from 'jspdf';
import * as JSZip from 'jszip';
const config = require('../../../shared/config.js');

// Types for export
interface ExportOptions {
  includeCover?: boolean;
  includePhotos?: boolean;
  includeAdjustments?: boolean;
  includeAIAnnotations?: boolean;
  addWatermark?: boolean;
  watermarkText?: string;
}

interface MetadataEntry {
  filename: string;
  property: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  exportDate: string;
  fileSize: number;
  containsAdjustments: boolean;
  containsAIAnnotations: boolean;
}

class PDFBatchExporter {
  private exportDir: string;
  private tempDir: string;

  constructor() {
    this.exportDir = path.resolve('./exports');
    this.tempDir = path.resolve('./temp');
    
    // Ensure directories exist
    this.ensureDirectories();
  }

  /**
   * Create directories if they don't exist
   */
  private ensureDirectories(): void {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Export a single comparable as PDF
   */
  public async exportComparablePDF(comparable, options: ExportOptions = {}): Promise<string> {
    const {
      includeCover = true,
      includePhotos = true,
      includeAdjustments = true,
      includeAIAnnotations = config.pdfExport.enableAIAnnotations,
      addWatermark = config.pdfExport.addWatermark,
      watermarkText = config.pdfExport.watermarkText
    } = options;

    // Create a new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    // Add cover page if requested
    if (includeCover) {
      this.addCoverPage(doc, comparable);
    }

    // Add property details
    this.addPropertyDetails(doc, comparable);

    // Add adjustments if requested
    if (includeAdjustments && comparable.adjustments && comparable.adjustments.length > 0) {
      this.addAdjustments(doc, comparable);
    }

    // Add AI annotations if requested
    if (includeAIAnnotations) {
      this.addAIAnnotations(doc, comparable);
    }

    // Add photos if requested
    if (includePhotos) {
      // In a real implementation, we would add property photos
      // Simulated here
    }

    // Add watermark if requested
    if (addWatermark) {
      this.addWatermark(doc, watermarkText);
    }

    // Generate a filename
    const filename = this.generateFilename(comparable);
    const filePath = path.join(this.tempDir, filename);

    // Save the PDF
    await doc.save(filePath);

    return filePath;
  }

  /**
   * Export multiple comparables as individual PDFs in a ZIP archive
   */
  public async exportComparablesZIP(
    comparables: any[],
    appraisalId: string,
    options: ExportOptions & { includeMetadata?: boolean } = {}
  ): Promise<string> {
    const {
      includeMetadata = config.zipExport.includeMetadata,
      ...pdfOptions
    } = options;

    // Create a new ZIP archive
    const zip = new JSZip();
    const metadata: MetadataEntry[] = [];

    // Export each comparable as a PDF and add to the ZIP
    for (const comparable of comparables) {
      try {
        // Generate PDF for this comparable
        const pdfPath = await this.exportComparablePDF(comparable, pdfOptions);
        
        // Read the generated PDF file
        const pdfContent = fs.readFileSync(pdfPath);
        
        // Add to ZIP archive
        const filename = path.basename(pdfPath);
        zip.file(filename, pdfContent);
        
        // Add to metadata
        if (includeMetadata) {
          metadata.push({
            filename,
            property: {
              address: comparable.address,
              city: comparable.city || '',
              state: comparable.state || '',
              zipCode: comparable.zipCode || '',
            },
            exportDate: new Date().toISOString(),
            fileSize: pdfContent.length,
            containsAdjustments: pdfOptions.includeAdjustments && !!comparable.adjustments,
            containsAIAnnotations: pdfOptions.includeAIAnnotations
          });
        }
        
        // Clean up temporary PDF file
        fs.unlinkSync(pdfPath);
      } catch (error) {
        console.error(`Error exporting comparable ${comparable.id}:`, error);
        // Continue with next comparable
      }
    }

    // Add metadata JSON if requested
    if (includeMetadata) {
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));
    }

    // Generate ZIP filename
    const zipFilename = `export_${appraisalId}_${Date.now()}.zip`;
    const zipPath = path.join(this.exportDir, zipFilename);

    // Generate ZIP file
    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(zipPath, zipContent);

    return zipPath;
  }

  /**
   * Add a cover page to the PDF
   */
  private addCoverPage(doc: jsPDF, comparable: any): void {
    // Set font
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    
    // Add title
    doc.text('Comparable Property Report', 105, 40, { align: 'center' });
    
    // Add property address
    doc.setFontSize(16);
    doc.text(comparable.address, 105, 60, { align: 'center' });
    
    if (comparable.city || comparable.state || comparable.zipCode) {
      const location = [
        comparable.city,
        comparable.state,
        comparable.zipCode
      ].filter(Boolean).join(', ');
      
      doc.text(location, 105, 70, { align: 'center' });
    }
    
    // Add date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 90, { align: 'center' });
    
    // Add logo placeholder
    doc.roundedRect(65, 110, 80, 50, 3, 3, 'S');
    doc.setFontSize(10);
    doc.text('Company Logo', 105, 135, { align: 'center' });
    
    // Add footer
    doc.setFontSize(10);
    doc.text('TerraFusion Property Valuations', 105, 270, { align: 'center' });
    
    // Add page break
    doc.addPage();
  }

  /**
   * Add property details to the PDF
   */
  private addPropertyDetails(doc: jsPDF, comparable: any): void {
    // Set font
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    
    // Add section title
    doc.text('Property Details', 20, 20);
    
    // Draw line
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    // Set font for content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    
    // Add property details
    let y = 40;
    const addDetail = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value || 'N/A', 80, y);
      y += 10;
    };
    
    addDetail('Address', comparable.address);
    addDetail('Sale Price', `$${Number(comparable.salePrice).toLocaleString()}`);
    addDetail('Sale Date', comparable.saleDate);
    addDetail('Property Type', comparable.propertyType || 'N/A');
    addDetail('Year Built', comparable.yearBuilt ? comparable.yearBuilt.toString() : 'N/A');
    addDetail('Gross Living Area', `${comparable.grossLivingArea} sqft`);
    addDetail('Bedrooms', comparable.bedrooms);
    addDetail('Bathrooms', comparable.bathrooms);
    
    // Add page break if needed for larger reports
    if (y > 240) {
      doc.addPage();
    }
  }

  /**
   * Add adjustments to the PDF
   */
  private addAdjustments(doc: jsPDF, comparable: any): void {
    // Add new page for adjustments
    doc.addPage();
    
    // Set font
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    
    // Add section title
    doc.text('Adjustments', 20, 20);
    
    // Draw line
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    // Set font for content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    
    // Headers
    let y = 40;
    doc.setFont('helvetica', 'bold');
    doc.text('Adjustment Type', 20, y);
    doc.text('Description', 80, y);
    doc.text('Amount', 170, y, { align: 'right' });
    y += 5;
    
    // Draw header line
    doc.setLineWidth(0.2);
    doc.line(20, y, 190, y);
    y += 10;
    
    // Reset font
    doc.setFont('helvetica', 'normal');
    
    // Add adjustments
    let totalAdjustment = 0;
    
    if (comparable.adjustments && comparable.adjustments.length > 0) {
      comparable.adjustments.forEach((adjustment) => {
        doc.text(adjustment.adjustmentType || 'N/A', 20, y);
        doc.text(adjustment.description || '', 80, y);
        
        const amount = Number(adjustment.amount) || 0;
        totalAdjustment += amount;
        
        const formattedAmount = `$${Math.abs(amount).toLocaleString()}`;
        doc.text(amount >= 0 ? formattedAmount : `(${formattedAmount})`, 170, y, { align: 'right' });
        
        y += 10;
        
        // Add page break if needed
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
      
      // Add total line
      y += 5;
      doc.setLineWidth(0.2);
      doc.line(140, y, 190, y);
      y += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Total Adjustments:', 140, y);
      
      const formattedTotal = `$${Math.abs(totalAdjustment).toLocaleString()}`;
      doc.text(totalAdjustment >= 0 ? formattedTotal : `(${formattedTotal})`, 170, y, { align: 'right' });
      
      // Calculate adjusted price
      y += 15;
      const salePrice = Number(comparable.salePrice) || 0;
      const adjustedPrice = salePrice + totalAdjustment;
      
      doc.text('Sale Price:', 140, y);
      doc.text(`$${salePrice.toLocaleString()}`, 170, y, { align: 'right' });
      
      y += 10;
      doc.text('Adjusted Price:', 140, y);
      doc.text(`$${adjustedPrice.toLocaleString()}`, 170, y, { align: 'right' });
    } else {
      doc.text('No adjustments have been made to this comparable.', 20, y);
    }
  }

  /**
   * Add AI annotations to the PDF
   */
  private addAIAnnotations(doc: jsPDF, comparable: any): void {
    // Add new page for AI annotations
    doc.addPage();
    
    // Set font
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    
    // Add section title
    doc.text('AI Valuation Analysis', 20, 20);
    
    // Draw line
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    // Set font for content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    
    let y = 40;
    
    // Add AI annotation disclaimer
    doc.text('AI-Assisted Valuation Analysis', 20, y);
    y += 10;
    
    // In a real implementation, we would add actual AI annotations from the system
    // For demo purposes, generate some sample annotations
    
    const aiAnnotations = [
      {
        category: 'Location',
        confidence: 'High',
        analysis: 'Based on geospatial data analysis, this property is located in a desirable area with good access to amenities.'
      },
      {
        category: 'Condition',
        confidence: 'Medium',
        analysis: 'Property appears to be in good condition based on visual inspection, with an estimated condition score of 3.8/5.'
      },
      {
        category: 'Market Trends',
        confidence: 'High',
        analysis: 'This area has shown a 5.2% appreciation over the past 12 months, suggesting positive market momentum.'
      },
      {
        category: 'Comparable Quality',
        confidence: 'Medium',
        analysis: 'This comparable is within 0.5 miles of the subject property and has similar characteristics, making it a good comparison.'
      }
    ];
    
    // Add AI annotations
    doc.setFont('helvetica', 'bold');
    doc.text('Category', 20, y);
    doc.text('Confidence', 70, y);
    doc.text('Analysis', 110, y);
    y += 5;
    
    // Draw header line
    doc.setLineWidth(0.2);
    doc.line(20, y, 190, y);
    y += 10;
    
    // Reset font
    doc.setFont('helvetica', 'normal');
    
    aiAnnotations.forEach((annotation) => {
      const lines = doc.splitTextToSize(annotation.analysis, 80);
      
      doc.setFont('helvetica', 'bold');
      doc.text(annotation.category, 20, y);
      
      // Color-coded confidence
      doc.setFont('helvetica', 'normal');
      const confidenceColor = annotation.confidence === 'High' ? [0, 0.5, 0] : 
                              annotation.confidence === 'Medium' ? [0.9, 0.6, 0] : 
                              [0.8, 0, 0];
      doc.setTextColor(confidenceColor[0] * 255, confidenceColor[1] * 255, confidenceColor[2] * 255);
      doc.text(annotation.confidence, 70, y);
      doc.setTextColor(0, 0, 0);
      
      // Analysis text
      doc.text(lines, 110, y);
      
      // Calculate next y position based on number of lines
      y += Math.max(10, lines.length * 7);
      
      // Add page break if needed
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    
    // Reset font and add disclaimer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    y += 10;
    doc.text('AI-generated analysis is provided for informational purposes only and should be verified by a licensed appraiser.', 20, y);
  }

  /**
   * Add watermark to all pages of the PDF
   */
  private addWatermark(doc: jsPDF, text: string): void {
    const pages = doc.getNumberOfPages();
    
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      
      // Save graphics state
      doc.saveGraphicsState();
      
      // Set watermark styles
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(30);
      doc.setTextColor(200, 200, 200);
      
      // Add watermark diagonally
      doc.translate(105, 150);
      doc.rotate(-45);
      doc.text(text, 0, 0, { align: 'center' });
      
      // Restore graphics state
      doc.restoreGraphicsState();
    }
  }

  /**
   * Generate a filename for the PDF
   */
  private generateFilename(comparable: any): string {
    const address = comparable.address
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 50);
    
    return `comparable_${comparable.id}_${address}_${Date.now()}.pdf`;
  }
}

export default new PDFBatchExporter();