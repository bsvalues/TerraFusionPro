/**
 * Fallback Polling Service
 * A fallback mechanism to use when WebSockets are not available or are unreliable
 * Uses standard HTTP polling to provide real-time-like functionality
 */

import { queryClient } from './queryClient';

// Polling intervals in milliseconds
const DEFAULT_POLLING_INTERVAL = 10000; // 10 seconds
const MIN_POLLING_INTERVAL = 3000; // 3 seconds
const MAX_POLLING_INTERVAL = 60000; // 60 seconds

// Types
export interface PollingConfig {
  enabled: boolean;
  intervalMs: number;
  endpoint: string;
  queryKey: string | string[];
  onData?: (data: any) => void;
  onError?: (error: any) => void;
}

export interface FallbackPollingSingleton {
  startPolling: (id: string, config: PollingConfig) => void;
  stopPolling: (id: string) => void;
  updatePollingInterval: (id: string, intervalMs: number) => void;
  isPollingSupportEnabled: () => boolean;
  getActivePollingCount: () => number;
}

interface PollingTask {
  id: string;
  config: PollingConfig;
  timeoutId?: number;
  lastPollTime?: number;
  isActive: boolean;
}

// Singleton implementation
class FallbackPollingService implements FallbackPollingSingleton {
  private pollingTasks: Map<string, PollingTask> = new Map();
  private globalEnabled: boolean = true;

  constructor() {
    // Add unload event listener to clean up polling tasks
    window.addEventListener('beforeunload', () => {
      this.stopAllPolling();
    });

    console.log('[FallbackPolling] Service initialized as WebSocket alternative');
  }

  /**
   * Start polling for a specific resource
   */
  public startPolling(id: string, config: PollingConfig): void {
    if (!this.globalEnabled) {
      console.warn('[FallbackPolling] Polling is globally disabled');
      return;
    }

    if (this.pollingTasks.has(id)) {
      this.stopPolling(id);
    }

    const intervalMs = Math.max(
      MIN_POLLING_INTERVAL,
      Math.min(config.intervalMs || DEFAULT_POLLING_INTERVAL, MAX_POLLING_INTERVAL)
    );

    const task: PollingTask = {
      id,
      config: {
        ...config,
        intervalMs
      },
      isActive: true
    };

    this.pollingTasks.set(id, task);
    console.log(`[FallbackPolling] Started polling for ${id} every ${intervalMs}ms`);

    // Start polling immediately
    this.executePoll(id);
  }

  /**
   * Stop polling for a specific resource
   */
  public stopPolling(id: string): void {
    const task = this.pollingTasks.get(id);
    if (task) {
      task.isActive = false;
      
      if (task.timeoutId) {
        window.clearTimeout(task.timeoutId);
        task.timeoutId = undefined;
      }
      
      this.pollingTasks.delete(id);
      console.log(`[FallbackPolling] Stopped polling for ${id}`);
    }
  }

  /**
   * Stop all polling tasks
   */
  private stopAllPolling(): void {
    for (const id of this.pollingTasks.keys()) {
      this.stopPolling(id);
    }
    console.log('[FallbackPolling] Stopped all polling tasks');
  }

  /**
   * Update the polling interval for a specific resource
   */
  public updatePollingInterval(id: string, intervalMs: number): void {
    const task = this.pollingTasks.get(id);
    if (task) {
      const newInterval = Math.max(
        MIN_POLLING_INTERVAL,
        Math.min(intervalMs, MAX_POLLING_INTERVAL)
      );
      
      task.config.intervalMs = newInterval;
      console.log(`[FallbackPolling] Updated polling interval for ${id} to ${newInterval}ms`);
      
      // Restart polling with new interval
      if (task.timeoutId) {
        window.clearTimeout(task.timeoutId);
        this.schedulePoll(id);
      }
    }
  }

  /**
   * Enable or disable polling globally
   */
  public setGlobalEnabled(enabled: boolean): void {
    this.globalEnabled = enabled;
    
    if (!enabled) {
      this.stopAllPolling();
    }
  }

  /**
   * Check if polling support is enabled
   */
  public isPollingSupportEnabled(): boolean {
    return this.globalEnabled;
  }

  /**
   * Get the number of active polling tasks
   */
  public getActivePollingCount(): number {
    return this.pollingTasks.size;
  }

  /**
   * Execute a polling task
   */
  private async executePoll(id: string): Promise<void> {
    const task = this.pollingTasks.get(id);
    if (!task || !task.isActive) return;

    try {
      // Use React Query's fetch infrastructure for consistency
      const queryKeyArray = Array.isArray(task.config.queryKey) 
        ? task.config.queryKey 
        : [task.config.queryKey];
        
      // Force refetch the data
      await queryClient.fetchQuery({
        queryKey: queryKeyArray,
        queryFn: () => fetch(task.config.endpoint).then(res => res.json()),
        staleTime: 0
      });

      // Additional callback if provided
      if (task.config.onData) {
        const data = queryClient.getQueryData(queryKeyArray);
        task.config.onData(data);
      }
    } catch (error) {
      console.error(`[FallbackPolling] Error polling ${id}:`, error);
      
      if (task.config.onError) {
        task.config.onError(error);
      }
    } finally {
      task.lastPollTime = Date.now();
      
      // Schedule next poll if still active
      if (task.isActive) {
        this.schedulePoll(id);
      }
    }
  }

  /**
   * Schedule the next poll
   */
  private schedulePoll(id: string): void {
    const task = this.pollingTasks.get(id);
    if (!task || !task.isActive) return;

    task.timeoutId = window.setTimeout(() => {
      this.executePoll(id);
    }, task.config.intervalMs);
  }
}

// Create and export singleton instance
export const fallbackPollingService = new FallbackPollingService();