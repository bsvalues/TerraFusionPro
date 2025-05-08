/**
 * Network Health Checker
 *
 * This module provides utilities to check network and server health
 * for more robust connections in unstable environments
 */

import * as dns from 'dns';
import * as http from 'http';
import { Socket } from 'net';

// Track active connections
export const activeConnections = new Map<string, Socket>();

// Track recent connection errors
export const connectionErrors = {
  count: 0,
  lastError: null as Error | null,
  lastErrorTime: 0,
  recentErrors: [] as Array<{ time: number, error: Error }>
};

// Track server health
export const serverHealth = {
  startTime: Date.now(),
  requestCount: 0,
  errorCount: 0,
  lastRestart: 0,
  memoryUsage: process.memoryUsage(),
  dnsStatus: 'unknown' as 'healthy' | 'degraded' | 'failed' | 'unknown',
  isReconnecting: false
};

/**
 * Track new socket connection
 */
export function trackConnection(id: string, socket: Socket): void {
  activeConnections.set(id, socket);
  
  // Monitor for socket errors
  socket.on('error', (err) => {
    console.error(`Socket error for connection ${id}:`, err);
    connectionErrors.count++;
    connectionErrors.lastError = err;
    connectionErrors.lastErrorTime = Date.now();
    connectionErrors.recentErrors.push({ time: Date.now(), error: err });
    
    // Only keep the last 20 errors
    if (connectionErrors.recentErrors.length > 20) {
      connectionErrors.recentErrors.shift();
    }
  });
  
  // Clean up on close
  socket.on('close', () => {
    activeConnections.delete(id);
  });
}

/**
 * Check if we have too many recent errors
 */
export function hasTooManyRecentErrors(threshold = 5, timeWindowMs = 60000): boolean {
  const now = Date.now();
  const recentCount = connectionErrors.recentErrors.filter(
    e => now - e.time < timeWindowMs
  ).length;
  
  return recentCount >= threshold;
}

/**
 * Check DNS resolution as a proxy for network health
 */
export async function checkDnsHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    dns.resolve('www.google.com', (err) => {
      if (err) {
        serverHealth.dnsStatus = 'failed';
        resolve(false);
      } else {
        serverHealth.dnsStatus = 'healthy';
        resolve(true);
      }
    });
  });
}

/**
 * Check if the server should attempt reconnection based on health metrics
 */
export async function shouldAttemptReconnect(): Promise<boolean> {
  // Don't try to reconnect if we're already reconnecting
  if (serverHealth.isReconnecting) {
    return false;
  }
  
  // Check if we've had too many errors recently
  if (hasTooManyRecentErrors()) {
    return true;
  }
  
  // Check DNS health
  const dnsHealthy = await checkDnsHealth();
  if (!dnsHealthy) {
    return true;
  }
  
  // Consider reconnecting if memory usage is too high
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed / memUsage.heapTotal > 0.85) {
    return true;
  }
  
  return false;
}

/**
 * Close all active connections
 */
export function closeAllConnections(): void {
  const connectionCount = activeConnections.size;
  
  if (connectionCount > 0) {
    console.log(`Closing ${connectionCount} active connections`);
    
    // Close each connection
    for (const [id, socket] of activeConnections.entries()) {
      try {
        socket.end();
        console.log(`Successfully closed connection ${id}`);
      } catch (err) {
        console.error(`Error closing connection ${id}:`, err);
      }
    }
    
    // Clear the map
    activeConnections.clear();
  } else {
    console.log('No active connections to close');
  }
}

/**
 * Get health status report
 */
export function getHealthReport(): any {
  return {
    uptime: Math.floor((Date.now() - serverHealth.startTime) / 1000),
    activeConnections: activeConnections.size,
    requestCount: serverHealth.requestCount,
    errorCount: serverHealth.errorCount,
    recentErrors: connectionErrors.recentErrors.length,
    lastErrorTime: connectionErrors.lastErrorTime > 0 
      ? new Date(connectionErrors.lastErrorTime).toISOString() 
      : 'none',
    memory: {
      rss: Math.round(serverHealth.memoryUsage.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(serverHealth.memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(serverHealth.memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      external: Math.round(serverHealth.memoryUsage.external / 1024 / 1024) + 'MB',
    },
    dnsStatus: serverHealth.dnsStatus
  };
}

/**
 * Update server health metrics
 */
export function updateHealthMetrics(): void {
  serverHealth.memoryUsage = process.memoryUsage();
  
  // Log memory usage every 5 minutes
  const fiveMinutes = 5 * 60 * 1000;
  const now = Date.now();
  
  if (now - serverHealth.lastRestart > fiveMinutes) {
    console.log('Server memory usage:', getHealthReport().memory);
    serverHealth.lastRestart = now;
  }
}

// Set up regular health checks
setInterval(updateHealthMetrics, 60000);

// Middleware to track request count
export function healthMiddleware(req: http.IncomingMessage, res: http.ServerResponse, next: Function): void {
  serverHealth.requestCount++;
  
  // Track errors
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: BufferEncoding, callback?: () => void) {
    const statusCode = res.statusCode;
    if (statusCode >= 500) {
      serverHealth.errorCount++;
    }
    return originalEnd.call(this, chunk, encoding, callback);
  } as typeof res.end;
  
  next();
}