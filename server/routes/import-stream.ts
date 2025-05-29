import { Request, Response } from 'express';
import { jobQueue } from '../services/job-queue';

interface StreamClient {
  id: string;
  userId: string;
  jobId: string;
  response: Response;
}

class ImportStreamManager {
  private clients: Map<string, StreamClient> = new Map();

  addClient(clientId: string, userId: string, jobId: string, res: Response) {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', jobId })}\n\n`);

    // Store client
    this.clients.set(clientId, { id: clientId, userId, jobId, response: res });

    // Handle client disconnect
    res.on('close', () => {
      this.clients.delete(clientId);
    });
  }

  broadcastRecord(jobId: string, record: any) {
    const clientsForJob = Array.from(this.clients.values())
      .filter(client => client.jobId === jobId);

    const message = JSON.stringify({ type: 'record', data: record });
    
    clientsForJob.forEach(client => {
      try {
        client.response.write(`data: ${message}\n\n`);
      } catch (error) {
        // Client disconnected, remove from list
        this.clients.delete(client.id);
      }
    });
  }

  broadcastJobUpdate(jobId: string, update: any) {
    const clientsForJob = Array.from(this.clients.values())
      .filter(client => client.jobId === jobId);

    const message = JSON.stringify({ type: 'job_update', data: update });
    
    clientsForJob.forEach(client => {
      try {
        client.response.write(`data: ${message}\n\n`);
      } catch (error) {
        this.clients.delete(client.id);
      }
    });
  }

  endStream(jobId: string, result: 'complete' | 'error', message?: string) {
    const clientsForJob = Array.from(this.clients.values())
      .filter(client => client.jobId === jobId);

    const endMessage = JSON.stringify({ 
      type: 'end', 
      result, 
      message: message || `Import ${result}` 
    });
    
    clientsForJob.forEach(client => {
      try {
        client.response.write(`data: ${endMessage}\n\n`);
        client.response.end();
      } catch (error) {
        // Ignore errors on ending
      }
      this.clients.delete(client.id);
    });
  }
}

export const streamManager = new ImportStreamManager();

// SSE endpoint for streaming import data
export function handleImportStream(req: Request, res: Response) {
  const { jobId } = req.params;
  const userId = req.query.userId as string || '1'; // Default user for now
  const clientId = `${userId}-${jobId}-${Date.now()}`;

  // Verify job exists and belongs to user
  const job = jobQueue.getJob(jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  if (job.userId !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // Add client to stream
  streamManager.addClient(clientId, userId, jobId, res);

  // Send current job status
  streamManager.broadcastJobUpdate(jobId, {
    status: job.status,
    progress: job.progress,
    recordsProcessed: job.recordsProcessed,
    totalRecords: job.totalRecords
  });
}

// Mock streaming endpoint for testing without Rust binary
export function handleMockStream(req: Request, res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Mock data
  const mockRecords = [
    {
      address: '123 Elm Street, Seattle, WA',
      sale_price_usd: 425000,
      gla_sqft: 2125,
      sale_date: '2023-05-15',
      source_table: 'sqlite_demo',
      bedrooms: 3,
      bathrooms: 2.5,
      year_built: 1985
    },
    {
      address: '456 Oak Avenue, Portland, OR',
      sale_price_usd: 385000,
      gla_sqft: 1950,
      sale_date: '2023-06-22',
      source_table: 'sqlite_demo',
      bedrooms: 4,
      bathrooms: 2,
      year_built: 1992
    },
    {
      address: '789 Pine Road, Vancouver, WA',
      sale_price_usd: 310000,
      gla_sqft: 1650,
      sale_date: '2023-07-10',
      source_table: 'sqlite_demo',
      bedrooms: 3,
      bathrooms: 2,
      year_built: 1978
    }
  ];

  let index = 0;
  const interval = setInterval(() => {
    if (index >= mockRecords.length) {
      res.write(`data: ${JSON.stringify({ type: 'end', result: 'complete' })}\n\n`);
      res.end();
      clearInterval(interval);
      return;
    }

    const record = mockRecords[index];
    res.write(`data: ${JSON.stringify({ type: 'record', data: record })}\n\n`);
    index++;
  }, 800);

  req.on('close', () => {
    clearInterval(interval);
  });
}