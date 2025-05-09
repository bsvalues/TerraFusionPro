/**
 * Performance monitoring utilities for adaptive loading
 * Measures network, CPU, memory and rendering performance
 * to help components adjust their rendering strategy
 */

// Performance metrics interface
export interface PerformanceMetrics {
  networkLatency: number;   // milliseconds
  cpuLoad: number;          // 0-1 normalized
  memoryUsage: number;      // 0-1 normalized 
  frameRate: number;        // frames per second
  renderTime: number;       // milliseconds
}

// Simulated network request to measure latency
const measureNetworkLatency = async (): Promise<number> => {
  // In a real implementation, you might ping an endpoint or
  // use the Navigation Timing API. Using simulated data here.
  const startTime = performance.now();
  
  // Simulate network request with a setTimeout
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  
  // Add some randomness to simulate network conditions
  const endTime = performance.now();
  
  // Calculate latency in milliseconds
  const latency = endTime - startTime;
  
  // For demo purposes, occasionally simulate higher latency
  return Math.random() < 0.1 
    ? latency + Math.random() * 500 
    : latency;
};

// Measure CPU load using performance api or simulation
const measureCpuLoad = (): number => {
  // In a real implementation, you might use Long Tasks API or 
  // analyze JS execution time. Using simulation here.
  
  // Get an estimate based on task manager data if available
  if (window.navigator && 'hardwareConcurrency' in window.navigator) {
    // More cores generally means less load per core
    const coreCount = window.navigator.hardwareConcurrency || 4;
    // Simulate varying load levels with bias toward medium load
    const baseLoad = 0.3 + (Math.random() * 0.4);
    // Adjust for core count - more cores = potentially less load
    return Math.min(baseLoad * (4 / coreCount), 1.0);
  }
  
  // Fallback to simulation with occasional high loads
  return Math.random() < 0.2 
    ? 0.7 + (Math.random() * 0.3) 
    : 0.2 + (Math.random() * 0.5);
};

// Measure memory usage using performance api or simulation
const measureMemoryUsage = (): number => {
  // In a real implementation, you might use the Memory API
  // Using simulation here
  
  // Try to use performance memory API if available (Chrome only)
  if (window.performance && 'memory' in window.performance) {
    const memory = (window.performance as any).memory;
    if (memory && memory.usedJSHeapSize && memory.jsHeapSizeLimit) {
      return memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
  }
  
  // Fallback to simulation with occasional high memory usage
  return Math.random() < 0.15 
    ? 0.7 + (Math.random() * 0.3) 
    : 0.3 + (Math.random() * 0.4);
};

// Frame rate calculation
let lastFrameTime = 0;
let frameCount = 0;
let frameRateValue = 60;

const measureFrameRate = (): number => {
  const now = performance.now();
  
  // Update frame count
  frameCount++;
  
  // Calculate FPS every second
  if (now - lastFrameTime >= 1000) {
    frameRateValue = frameCount;
    frameCount = 0;
    lastFrameTime = now;
  }
  
  // Occasionally simulate lower frame rates to test adaptive components
  if (Math.random() < 0.1) {
    return Math.max(10, Math.min(60, frameRateValue - Math.floor(Math.random() * 30)));
  }
  
  return frameRateValue;
};

// Measure render time
const measureRenderTime = (): number => {
  // In a real implementation, you'd use the User Timing API
  // or measure specific component renders
  
  // Simulate render time based on frame rate
  // Lower frame rates usually mean higher render times
  const inverseRelationship = 1000 / (frameRateValue || 60);
  
  // Add some variability
  return Math.min(100, Math.max(5, inverseRelationship * (1 + Math.random() * 0.5)));
};

// Main function to collect all performance metrics
export const monitorPerformanceAsync = async (): Promise<PerformanceMetrics> => {
  // For immediate metrics
  const cpuLoad = measureCpuLoad();
  const memoryUsage = measureMemoryUsage();
  const frameRate = measureFrameRate();
  const renderTime = measureRenderTime();
  
  // For metrics that need async measurement
  const networkLatency = await measureNetworkLatency();
  
  return {
    networkLatency,
    cpuLoad,
    memoryUsage,
    frameRate,
    renderTime
  };
};

// Synchronous version for when we need metrics immediately
export const monitorPerformance = (): PerformanceMetrics => {
  // For metrics that would normally need async, use the last known value or estimate
  // In a real implementation, you'd have a background process updating these values
  const latencyEstimate = Math.random() < 0.1 
    ? 200 + Math.random() * 300 
    : 50 + Math.random() * 100;
  
  return {
    networkLatency: latencyEstimate,
    cpuLoad: measureCpuLoad(),
    memoryUsage: measureMemoryUsage(),
    frameRate: measureFrameRate(),
    renderTime: measureRenderTime()
  };
};