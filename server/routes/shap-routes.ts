/**
 * TerraFusion SHAP API Routes
 */

import express, { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

// Create router
const shapRouter = Router();

/**
 * Get SHAP sample image
 */
shapRouter.get('/sample-images/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    // Set paths
    const sampleImagesPath = path.join(process.cwd(), 'data', 'sample_images');
    const filepath = path.join(sampleImagesPath, filename);
    
    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Send file
    res.sendFile(filepath);
  } catch (error) {
    console.error('[SHAP Routes] Error serving sample image:', error);
    res.status(500).json({ error: 'Error serving sample image' });
  }
});

/**
 * Get all SHAP values
 */
shapRouter.get('/values', (req: Request, res: Response) => {
  try {
    const shapValuesPath = path.join(process.cwd(), 'models', 'shap_values', 'all_shap_values.json');
    
    // Check if file exists
    if (!fs.existsSync(shapValuesPath)) {
      return res.status(404).json({ error: 'SHAP values file not found' });
    }
    
    // Read file
    const shapValues = JSON.parse(fs.readFileSync(shapValuesPath, 'utf8'));
    
    // Send data
    res.json(shapValues);
  } catch (error) {
    console.error('[SHAP Routes] Error retrieving SHAP values:', error);
    res.status(500).json({ error: 'Error retrieving SHAP values' });
  }
});

/**
 * Get SHAP values for a specific condition
 */
shapRouter.get('/values/:condition', (req: Request, res: Response) => {
  try {
    const { condition } = req.params;
    
    // Validate condition
    if (!condition || !['excellent', 'good', 'average', 'fair', 'poor'].includes(condition)) {
      return res.status(400).json({ error: 'Invalid condition' });
    }
    
    const shapValuePath = path.join(process.cwd(), 'models', 'shap_values', `${condition}_shap.json`);
    
    // Check if file exists
    if (!fs.existsSync(shapValuePath)) {
      return res.status(404).json({ error: `SHAP values for ${condition} condition not found` });
    }
    
    // Read file
    const shapValues = JSON.parse(fs.readFileSync(shapValuePath, 'utf8'));
    
    // Send data
    res.json(shapValues);
  } catch (error) {
    console.error('[SHAP Routes] Error retrieving SHAP values for condition:', error);
    res.status(500).json({ error: 'Error retrieving SHAP values' });
  }
});

/**
 * Generate SHAP values
 */
shapRouter.post('/generate', (req: Request, res: Response) => {
  try {
    const { execSync } = require('child_process');
    
    // Execute the SHAP values generator script
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate_shap_values.py');
    
    // Run the script
    const result = execSync(`python ${scriptPath}`).toString();
    
    // Check if script execution was successful
    if (result.includes('Error')) {
      return res.status(500).json({ error: 'Error generating SHAP values', details: result });
    }
    
    // Send success response
    res.json({ 
      success: true, 
      message: 'SHAP values generated successfully',
      details: result
    });
  } catch (error) {
    console.error('[SHAP Routes] Error generating SHAP values:', error);
    res.status(500).json({ error: 'Error generating SHAP values' });
  }
});

export default shapRouter;