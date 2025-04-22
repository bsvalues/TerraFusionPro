/**
 * Import Routes
 * 
 * API endpoints for handling file import operations.
 */

import { Router } from 'express';
import multer from 'multer';
import { processFile, saveUploadedFile, getImportResults, getImportResult } from '../lib/import-service';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // Limit file size to 20MB
  },
});

/**
 * Upload and process a file
 */
router.post('/import/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select a file to upload',
      });
    }
    
    console.log(`Received file: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
    
    // Save uploaded file
    const fileMetadata = await saveUploadedFile(file);
    
    // Process the file asynchronously
    const importResult = await processFile(fileMetadata);
    
    return res.status(200).json({
      success: true,
      fileId: fileMetadata.id,
      fileName: file.originalname,
      message: 'File upload successful',
      result: importResult,
    });
  } catch (error) {
    console.error('Error processing file upload:', error);
    
    return res.status(500).json({
      error: 'File upload failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get import results
 */
router.get('/import/results', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const results = await getImportResults(limit, offset);
    
    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error getting import results:', error);
    
    return res.status(500).json({
      error: 'Failed to get import results',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get a specific import result
 */
router.get('/import/results/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await getImportResult(id);
    
    if (!result) {
      return res.status(404).json({
        error: 'Import result not found',
        message: `No import result found with ID: ${id}`,
      });
    }
    
    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error getting import result:', error);
    
    return res.status(500).json({
      error: 'Failed to get import result',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;