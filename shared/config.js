/**
 * TerraFusion Platform Configuration
 * 
 * This file contains global configuration settings for the TerraFusion platform.
 * Modify these settings to control various aspects of the application.
 */

const config = {
  /**
   * Demo Mode Toggle
   * 
   * When enabled, the application will use demo data and simulated functionality.
   * This is useful for demonstrations, testing, or when certain backend services
   * are unavailable.
   * 
   * Set to true to enable demo mode, false to use real data and services.
   */
  demoMode: true,
  
  /**
   * API Configuration
   */
  api: {
    /**
     * Base URL for API requests
     */
    baseUrl: '/api',
    
    /**
     * Timeout for API requests in milliseconds
     */
    timeout: 30000,
    
    /**
     * Retry configuration
     */
    retry: {
      /**
       * Maximum number of retry attempts
       */
      maxRetries: 3,
      
      /**
       * Base delay between retries in milliseconds
       */
      retryDelay: 1000
    }
  },
  
  /**
   * PDF Export Configuration
   */
  pdfExport: {
    /**
     * Enable AI annotations in exported PDFs
     */
    enableAIAnnotations: true,
    
    /**
     * Add watermark to exported PDFs
     */
    addWatermark: true,
    
    /**
     * Default watermark text
     */
    watermarkText: 'TerraFusion Pro',
    
    /**
     * Batch export settings
     */
    batchExport: {
      /**
       * Maximum number of PDFs to export in a single batch
       */
      maxBatchSize: 20,
      
      /**
       * Enable batch adjustments
       */
      enableBatchAdjustments: true
    }
  },
  
  /**
   * Reviewer Configuration
   */
  reviewer: {
    /**
     * Enable reviewer mode
     */
    enableReviewerMode: true,
    
    /**
     * Allow batch review operations
     */
    allowBatchReview: true
  },
  
  /**
   * ZIP Export Configuration
   */
  zipExport: {
    /**
     * Enable ZIP export functionality
     */
    enableZipExport: true,
    
    /**
     * Default ZIP file name
     */
    defaultFileName: 'TerraFusion_Export',
    
    /**
     * Include export metadata JSON file
     */
    includeMetadata: true
  }
};

module.exports = config;