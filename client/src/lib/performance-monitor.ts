/**
 * Performance Monitor
 * Tracks and provides system performance metrics
 */

type PerformanceLevel = 'low' | 'medium' | 'high';
type PerformanceMetric = 'network' | 'cpu' | 'memory' | 'overall';

export interface PerformanceData {
  networkLatency: number;  // in milliseconds
  cpuLoad: number;         // 0-1 normalized value
  memoryUsage: number;     // 0-1 normalized value
  overallPerformance: PerformanceLevel;
  lastUpdated: Date;
}

// Default thresholds for performance metrics
const LATENCY_THRESHOLDS = { low: 300, high: 100 };  // ms
const CPU_THRESHOLDS = { low: 0.7, high: 0.3 };      // normalized (0-1)
const MEMORY_THRESHOLDS = { low: 0.8, high: 0.4 };   // normalized (0-1)

class PerformanceMonitor {
  private data: PerformanceData;
  private apiLatencyHistory: number[] = [];
  private maxHistoryEntries = 5;
  private updateInterval: number | null = null;
  private observers: Set<(data: PerformanceData) => void> = new Set();
  
  constructor() {
    // Initialize with default values
    this.data = {
      networkLatency: 0,
      cpuLoad: 0,
      memoryUsage: 0,
      overallPerformance: 'high',
      lastUpdated: new Date()
    };
  }

  /**
   * Start monitoring system performance
   * @param interval - Interval in milliseconds to update metrics
   */
  public startMonitoring(interval = 10000): void {
    if (this.updateInterval) {
      this.stopMonitoring();
    }
    
    // Perform initial measurement
    this.measurePerformance();
    
    // Set up interval for ongoing measurements
    this.updateInterval = window.setInterval(() => {
      this.measurePerformance();
    }, interval);
  }

  /**
   * Stop monitoring system performance
   */
  public stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Record an API request latency
   * @param latency - Request latency in milliseconds
   */
  public recordApiLatency(latency: number): void {
    this.apiLatencyHistory.push(latency);
    
    // Keep history at maximum size
    if (this.apiLatencyHistory.length > this.maxHistoryEntries) {
      this.apiLatencyHistory.shift();
    }
    
    // Update the network latency metric
    this.data.networkLatency = this.calculateAverageLatency();
    this.updateOverallPerformance();
    this.notifyObservers();
  }

  /**
   * Get the current performance level for a specific metric
   * @param metric - The performance metric to check
   */
  public getPerformanceLevel(metric: PerformanceMetric): PerformanceLevel {
    switch (metric) {
      case 'network':
        return this.getNetworkPerformanceLevel();
      case 'cpu':
        return this.getCpuPerformanceLevel();
      case 'memory':
        return this.getMemoryPerformanceLevel();
      case 'overall':
        return this.data.overallPerformance;
      default:
        return 'medium';
    }
  }

  /**
   * Get the current performance data
   */
  public getPerformanceData(): PerformanceData {
    return { ...this.data };
  }

  /**
   * Subscribe to performance updates
   * @param callback - Function to call when performance is updated
   * @returns Unsubscribe function
   */
  public subscribe(callback: (data: PerformanceData) => void): () => void {
    this.observers.add(callback);
    
    // Immediately notify with current state
    callback(this.getPerformanceData());
    
    return () => {
      this.observers.delete(callback);
    };
  }

  /**
   * Measure the current system performance
   */
  private measurePerformance(): void {
    // Measure CPU performance
    this.measureCpuPerformance();
    
    // Measure memory usage
    this.measureMemoryUsage();
    
    // Update overall performance score
    this.updateOverallPerformance();
    
    // Update timestamp
    this.data.lastUpdated = new Date();
    
    // Notify observers
    this.notifyObservers();
  }

  /**
   * Measure CPU performance
   */
  private measureCpuPerformance(): void {
    // Use a simple CPU benchmark 
    const start = performance.now();
    
    // Simple computation task to measure CPU performance
    // This is a naive approach but gives us some indication
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.sin(i * 0.01) * Math.cos(i * 0.01);
    }
    
    const end = performance.now();
    
    // The longer it takes, the higher the load
    // Normalize to a 0-1 scale where higher is more loaded
    const duration = end - start;
    
    // Calibration values (adjust based on testing)
    const MIN_DURATION = 10;  // ms for a fast machine
    const MAX_DURATION = 200; // ms for a slow machine
    
    // Calculate normalized CPU load
    let cpuLoad = (duration - MIN_DURATION) / (MAX_DURATION - MIN_DURATION);
    cpuLoad = Math.max(0, Math.min(1, cpuLoad));
    
    this.data.cpuLoad = cpuLoad;
  }

  /**
   * Measure memory usage
   */
  private measureMemoryUsage(): void {
    // Use performance.memory if available (Chrome only)
    if (performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      this.data.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    } else {
      // Fallback for browsers without memory API - use a rough estimate
      // based on the number of DOM nodes as a proxy for memory usage
      const nodeCount = document.querySelectorAll('*').length;
      const estimatedUsage = Math.min(1, nodeCount / 5000); // Normalize to 0-1
      this.data.memoryUsage = estimatedUsage;
    }
  }

  /**
   * Calculate average latency from history
   */
  private calculateAverageLatency(): number {
    if (this.apiLatencyHistory.length === 0) return 0;
    
    const sum = this.apiLatencyHistory.reduce((acc, val) => acc + val, 0);
    return sum / this.apiLatencyHistory.length;
  }

  /**
   * Get network performance level based on latency
   */
  private getNetworkPerformanceLevel(): PerformanceLevel {
    const latency = this.data.networkLatency;
    
    if (latency >= LATENCY_THRESHOLDS.low) return 'low';
    if (latency <= LATENCY_THRESHOLDS.high) return 'high';
    return 'medium';
  }

  /**
   * Get CPU performance level
   */
  private getCpuPerformanceLevel(): PerformanceLevel {
    const load = this.data.cpuLoad;
    
    if (load >= CPU_THRESHOLDS.low) return 'low';
    if (load <= CPU_THRESHOLDS.high) return 'high';
    return 'medium';
  }

  /**
   * Get memory performance level
   */
  private getMemoryPerformanceLevel(): PerformanceLevel {
    const usage = this.data.memoryUsage;
    
    if (usage >= MEMORY_THRESHOLDS.low) return 'low';
    if (usage <= MEMORY_THRESHOLDS.high) return 'high';
    return 'medium';
  }

  /**
   * Update the overall performance level
   */
  private updateOverallPerformance(): void {
    const networkLevel = this.getNetworkPerformanceLevel();
    const cpuLevel = this.getCpuPerformanceLevel();
    const memoryLevel = this.getMemoryPerformanceLevel();
    
    // Count how many metrics are at each level
    const counts = {
      low: 0,
      medium: 0,
      high: 0
    };
    
    [networkLevel, cpuLevel, memoryLevel].forEach(level => {
      counts[level]++;
    });
    
    // Determine overall level
    if (counts.low >= 2 || (counts.low >= 1 && networkLevel === 'low')) {
      this.data.overallPerformance = 'low';
    } else if (counts.high >= 2 && counts.low === 0) {
      this.data.overallPerformance = 'high';
    } else {
      this.data.overallPerformance = 'medium';
    }
  }

  /**
   * Notify all observers of changes
   */
  private notifyObservers(): void {
    const data = this.getPerformanceData();
    this.observers.forEach(callback => callback(data));
  }
}

// Export a singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Initialize performance monitoring when the module is loaded
if (typeof window !== 'undefined') {
  // Start after a short delay to allow the app to initialize
  window.setTimeout(() => {
    performanceMonitor.startMonitoring();
  }, 2000);
}