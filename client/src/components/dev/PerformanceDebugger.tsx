import React from 'react';
import { usePerformance } from '@/contexts/PerformanceContext';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { AdaptiveSpinner } from '@/components/ui/adaptive-spinner';
import { AdaptiveProgress } from '@/components/ui/adaptive-progress';
import { 
  Cpu, 
  Network, 
  HardDrive, 
  BarChart, 
  RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Performance Debugger Component
 * Shows current performance metrics and allows developers
 * to test different loading states
 */
export function PerformanceDebugger() {
  const { performance } = usePerformance();
  const [testProgress, setTestProgress] = React.useState(0);
  const [isRunningTest, setIsRunningTest] = React.useState(false);
  
  // Run a simulated progress operation
  const startProgressTest = () => {
    setIsRunningTest(true);
    setTestProgress(0);
    
    const interval = setInterval(() => {
      setTestProgress(prev => {
        const newValue = prev + Math.random() * 3;
        
        if (newValue >= 100) {
          clearInterval(interval);
          setIsRunningTest(false);
          return 100;
        }
        
        return newValue;
      });
    }, 200);
  };
  
  // Function to get color class based on performance level
  const getPerformanceColorClass = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-amber-500';
      case 'medium':
        return 'text-blue-500';
      case 'high':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };
  
  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart className="mr-2 h-5 w-5" />
          Performance Monitor
        </CardTitle>
        <CardDescription>
          Debug system performance metrics and test adaptive loading animations
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-gray-50 rounded-md p-3 space-y-3">
          <h3 className="text-sm font-medium">Current Performance Metrics</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center">
              <Network className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm mr-1">Network:</span>
              <span className={`text-sm font-semibold ${getPerformanceColorClass(performance.networkLatency > 300 ? 'low' : performance.networkLatency < 100 ? 'high' : 'medium')}`}>
                {Math.round(performance.networkLatency)}ms
              </span>
            </div>
            
            <div className="flex items-center">
              <Cpu className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm mr-1">CPU:</span>
              <span className={`text-sm font-semibold ${getPerformanceColorClass(performance.cpuLoad > 0.7 ? 'low' : performance.cpuLoad < 0.3 ? 'high' : 'medium')}`}>
                {Math.round(performance.cpuLoad * 100)}%
              </span>
            </div>
            
            <div className="flex items-center">
              <HardDrive className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm mr-1">Memory:</span>
              <span className={`text-sm font-semibold ${getPerformanceColorClass(performance.memoryUsage > 0.8 ? 'low' : performance.memoryUsage < 0.4 ? 'high' : 'medium')}`}>
                {Math.round(performance.memoryUsage * 100)}%
              </span>
            </div>
            
            <div className="flex items-center">
              <BarChart className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm mr-1">Overall:</span>
              <span className={`text-sm font-semibold ${getPerformanceColorClass(performance.overallPerformance)}`}>
                {performance.overallPerformance.charAt(0).toUpperCase() + performance.overallPerformance.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Last updated: {performance.lastUpdated.toLocaleTimeString()}
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-3">Adaptive Loading Examples</h3>
          
          <div className="space-y-5">
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">Spinner</h4>
              <div className="flex justify-around">
                <div className="flex flex-col items-center">
                  <span className="text-xs mb-1">Small</span>
                  <AdaptiveSpinner size="sm" />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs mb-1">Medium</span>
                  <AdaptiveSpinner size="md" />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs mb-1">Large</span>
                  <AdaptiveSpinner size="lg" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">Progress Bars</h4>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs mb-1">Indeterminate</p>
                  <AdaptiveProgress 
                    indeterminate 
                    showPerformanceText
                  />
                </div>
                
                <div>
                  <p className="text-xs mb-1">
                    Determinate 
                    {isRunningTest 
                      ? ` (${Math.round(testProgress)}%)`
                      : ''}
                  </p>
                  <AdaptiveProgress 
                    value={testProgress} 
                    showPerformanceText
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.location.reload();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Metrics
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={startProgressTest}
          disabled={isRunningTest}
        >
          {isRunningTest ? 'Testing...' : 'Test Progress Bar'}
        </Button>
      </CardFooter>
    </Card>
  );
}