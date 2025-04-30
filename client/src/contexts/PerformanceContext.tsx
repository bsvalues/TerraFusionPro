import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  performanceMonitor, 
  type PerformanceData 
} from '@/lib/performance-monitor';

interface PerformanceContextType {
  performance: PerformanceData;
}

const PerformanceContext = createContext<PerformanceContextType>({
  performance: {
    networkLatency: 0,
    cpuLoad: 0,
    memoryUsage: 0,
    overallPerformance: 'high',
    lastUpdated: new Date()
  }
});

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [performanceData, setPerformanceData] = useState<PerformanceData>(
    performanceMonitor.getPerformanceData()
  );
  
  useEffect(() => {
    // Subscribe to performance updates
    const unsubscribe = performanceMonitor.subscribe(data => {
      setPerformanceData(data);
    });
    
    // Add API latency tracking to fetch requests
    const originalFetch = window.fetch;
    
    window.fetch = async function(input, init) {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch.apply(window, [input, init]);
        const endTime = performance.now();
        
        // Record latency for API requests
        if (typeof input === 'string' && input.startsWith('/api/')) {
          const latency = endTime - startTime;
          performanceMonitor.recordApiLatency(latency);
        }
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        
        // Record latency for failed requests too
        if (typeof input === 'string' && input.startsWith('/api/')) {
          const latency = endTime - startTime;
          performanceMonitor.recordApiLatency(latency);
        }
        
        throw error;
      }
    };
    
    return () => {
      unsubscribe();
      
      // Restore original fetch
      window.fetch = originalFetch;
    };
  }, []);
  
  return (
    <PerformanceContext.Provider value={{ performance: performanceData }}>
      {children}
    </PerformanceContext.Provider>
  );
}

export const usePerformance = () => useContext(PerformanceContext);