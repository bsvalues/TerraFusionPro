import { Router, Request, Response } from 'express';
import { rustImporter } from '../services/rust-importer-bridge';
import { schemaValidator } from '../services/schema-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.db', '.sqlite', '.sqlite3', '.csv', '.xml', '.zip', '.sql'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not supported. Allowed: ${allowedExtensions.join(', ')}`));
    }
  }
});

// POST /api/import/upload - Start a new import job
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = 1; // TODO: Get from authenticated user session
    const fileName = req.file.originalname;
    const filePath = req.file.path;
    const format = req.body.format || 'auto-detect';

    // Create import job
    const jobId = rustImporter.createJob(userId, fileName, filePath, format);

    res.json({
      success: true,
      jobId,
      message: 'Import job created successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/import/stream/:jobId - Stream import results via Server-Sent Events
router.get('/stream/:jobId', (req: Request, res: Response) => {
  const jobId = req.params.jobId;
  const job = rustImporter.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Set up Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial job status
  res.write(`data: ${JSON.stringify({
    type: 'job_status',
    data: job
  })}\n\n`);

  // Listen for job events
  const onCompProcessed = (compJobId: string, comp: any) => {
    if (compJobId === jobId) {
      // Validate the comp data
      const validation = schemaValidator.validate(comp);
      
      res.write(`data: ${JSON.stringify({
        type: 'comp_processed',
        data: {
          comp,
          validation
        }
      })}\n\n`);
    }
  };

  const onJobProgress = (progressJob: any) => {
    if (progressJob.id === jobId) {
      res.write(`data: ${JSON.stringify({
        type: 'job_progress',
        data: progressJob
      })}\n\n`);
    }
  };

  const onJobCompleted = (completedJob: any) => {
    if (completedJob.id === jobId) {
      res.write(`data: ${JSON.stringify({
        type: 'job_completed',
        data: completedJob
      })}\n\n`);
      
      // Close the connection
      res.end();
      cleanup();
    }
  };

  const onJobStatusChanged = (changedJob: any) => {
    if (changedJob.id === jobId) {
      res.write(`data: ${JSON.stringify({
        type: 'job_status_changed',
        data: changedJob
      })}\n\n`);
    }
  };

  // Register event listeners
  rustImporter.on('compProcessed', onCompProcessed);
  rustImporter.on('jobProgress', onJobProgress);
  rustImporter.on('jobCompleted', onJobCompleted);
  rustImporter.on('jobStatusChanged', onJobStatusChanged);

  const cleanup = () => {
    rustImporter.removeListener('compProcessed', onCompProcessed);
    rustImporter.removeListener('jobProgress', onJobProgress);
    rustImporter.removeListener('jobCompleted', onJobCompleted);
    rustImporter.removeListener('jobStatusChanged', onJobStatusChanged);
  };

  // Handle client disconnect
  req.on('close', cleanup);
  req.on('aborted', cleanup);

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({
      type: 'heartbeat',
      timestamp: Date.now()
    })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    cleanup();
  });
});

// GET /api/import/jobs - Get all import jobs for user
router.get('/jobs', (req: Request, res: Response) => {
  const userId = 1; // TODO: Get from authenticated user session
  const jobs = rustImporter.getJobsByUser(userId);
  
  res.json({ jobs });
});

// GET /api/import/jobs/:jobId - Get specific job status
router.get('/jobs/:jobId', (req: Request, res: Response) => {
  const jobId = req.params.jobId;
  const job = rustImporter.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({ job });
});

// DELETE /api/import/jobs/:jobId - Cancel import job
router.delete('/jobs/:jobId', (req: Request, res: Response) => {
  const jobId = req.params.jobId;
  const cancelled = rustImporter.cancelJob(jobId);

  if (!cancelled) {
    return res.status(404).json({ error: 'Job not found or cannot be cancelled' });
  }

  res.json({ 
    success: true,
    message: 'Job cancelled successfully'
  });
});

// POST /api/import/validate - Validate TerraFusionComp data
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { comp, batch } = req.body;

    if (batch && Array.isArray(batch)) {
      // Batch validation
      const results = schemaValidator.validateBatch(batch);
      const summary = schemaValidator.getValidationSummary(results);
      
      res.json({
        success: true,
        results,
        summary
      });
    } else if (comp) {
      // Single comp validation
      const result = schemaValidator.validate(comp);
      
      res.json({
        success: true,
        result
      });
    } else {
      res.status(400).json({ 
        error: 'Must provide either "comp" or "batch" data' 
      });
    }

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ 
      error: 'Validation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/import/formats - Get supported import formats
router.get('/formats', (req: Request, res: Response) => {
  res.json({
    formats: [
      {
        id: 'sqlite',
        name: 'SQLite Database',
        extensions: ['.db', '.sqlite', '.sqlite3'],
        description: 'Legacy appraisal system databases'
      },
      {
        id: 'csv',
        name: 'CSV Files',
        extensions: ['.csv'],
        description: 'Comma-separated values files'
      },
      {
        id: 'xml',
        name: 'XML Files',
        extensions: ['.xml'],
        description: 'XML formatted appraisal data'
      },
      {
        id: 'zip',
        name: 'Archive Files',
        extensions: ['.zip'],
        description: 'Compressed archives containing multiple files'
      },
      {
        id: 'sql',
        name: 'SQL Scripts',
        extensions: ['.sql'],
        description: 'SQL database dumps'
      }
    ]
  });
});

export default router;