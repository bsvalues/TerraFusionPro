/**
 * Import Routes
 * 
 * API routes for handling appraisal report imports from various file formats.
 */

import { Router } from 'express';
import multer from 'multer';
import * as importService from '../lib/import-service';
import { storage } from '../storage';

const router = Router();

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB limit
  },
});

// Get all import results
router.get('/imports', async (req, res) => {
  try {
    const imports = await storage.getFileImportResults();
    res.json(imports);
  } catch (error) {
    console.error(`Error getting import results: ${error}`);
    res.status(500).json({ error: 'Failed to get import results' });
  }
});

// Get import result by ID
router.get('/imports/:id', async (req, res) => {
  try {
    const importResult = await storage.getFileImportResult(req.params.id);
    
    if (!importResult) {
      return res.status(404).json({ error: 'Import result not found' });
    }
    
    res.json(importResult);
  } catch (error) {
    console.error(`Error getting import result: ${error}`);
    res.status(500).json({ error: 'Failed to get import result' });
  }
});

// Upload a file for import
router.post('/imports/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Get the file from the request
    const file = req.file;
    
    // Handle the file upload
    const uploadResult = await importService.handleFileUpload(file);
    
    res.json(uploadResult);
  } catch (error) {
    console.error(`Error uploading file: ${error}`);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Process an uploaded file
router.post('/imports/process/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;
    
    // Process the uploaded file
    const importResult = await importService.processImportedFile(uploadId);
    
    res.json(importResult);
  } catch (error) {
    console.error(`Error processing file: ${error}`);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// Delete an import result
router.delete('/imports/:id', async (req, res) => {
  try {
    const deleted = await storage.deleteFileImportResult(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Import result not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error(`Error deleting import result: ${error}`);
    res.status(500).json({ error: 'Failed to delete import result' });
  }
});

export default router;