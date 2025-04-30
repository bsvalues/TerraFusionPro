import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { usePerformance } from '@/contexts/PerformanceContext';

interface AdaptiveProgressProps {
  /** Progress value from 0-100 */
  value?: number;
  
  /** Whether progress is indeterminate */
  indeterminate?: boolean;
  
  /** Whether progress should adapt to system performance */
  adaptive?: boolean;
  
  /** Optional className for styling */
  className?: string;
  
  /** Whether to show percentage */
  showPercentage?: boolean;
  
  /** Loading text to display */
  loadingText?: string;
  
  /** Show performance indicator text */
  showPerformanceText?: boolean;
}

/**
 * Adaptive progress bar that changes its animation
 * based on system performance
 */
export function AdaptiveProgress({
  value = 0,
  indeterminate = false,
  adaptive = true,
  className,
  showPercentage = false,
  loadingText,
  showPerformanceText = false
}: AdaptiveProgressProps) {
  const { performance } = usePerformance();
  const [animation, setAnimation] = useState('default');
  const [message, setMessage] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);

  // Calculate clamped value
  const clampedValue = Math.max(0, Math.min(100, value));

  // Update animation and messaging based on performance
  useEffect(() => {
    if (!adaptive) {
      setAnimation('default');
      setMessage(null);
      setEstimatedTime(null);
      return;
    }

    // Set animation class based on performance
    switch (performance.overallPerformance) {
      case 'low':
        setAnimation('slow');
        setMessage('Processing may take longer than expected.');
        break;
      case 'medium':
        setAnimation('medium');
        setMessage('Processing your request...');
        break;
      case 'high':
        setAnimation('fast');
        setMessage(null);
        break;
      default:
        setAnimation('medium');
        setMessage(null);
    }

    // Calculate estimated time remaining
    if (!indeterminate && value > 0 && value < 100) {
      const baseTimePerPercent = 0.2; // 0.2 seconds per 1% in optimal conditions
      const remainingPercent = 100 - value;
      
      let multiplier = 1;
      if (performance.overallPerformance === 'low') multiplier = 3;
      if (performance.overallPerformance === 'medium') multiplier = 1.5;
      
      const estimatedSeconds = Math.round(remainingPercent * baseTimePerPercent * multiplier);
      
      if (estimatedSeconds < 60) {
        setEstimatedTime(`about ${estimatedSeconds} seconds remaining`);
      } else {
        const minutes = Math.floor(estimatedSeconds / 60);
        const seconds = estimatedSeconds % 60;
        setEstimatedTime(`about ${minutes} min${minutes > 1 ? 's' : ''} ${seconds > 0 ? `${seconds} sec` : ''} remaining`);
      }
    } else {
      setEstimatedTime(null);
    }
  }, [adaptive, performance.overallPerformance, indeterminate, value]);

  // Animation class based on performance
  const animationClass = indeterminate ? {
    slow: 'animate-progress-bar-slow',
    medium: 'animate-progress-bar-medium',
    fast: 'animate-progress-bar-fast',
    default: 'animate-progress-bar-medium'
  } : {};

  // Performance-based background colors
  const performanceColors = {
    low: 'bg-amber-500',
    medium: 'bg-blue-500',
    high: 'bg-green-500',
    default: 'bg-primary'
  };

  return (
    <div className="w-full space-y-2">
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
        {indeterminate ? (
          <div
            className={cn(
              'h-full rounded-full w-1/4',
              animationClass[animation],
              adaptive 
                ? performanceColors[performance.overallPerformance] 
                : performanceColors.default,
              className
            )}
          />
        ) : (
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              adaptive 
                ? performanceColors[performance.overallPerformance] 
                : performanceColors.default,
              className
            )}
            style={{ width: `${clampedValue}%` }}
          />
        )}
      </div>
      
      <div className="flex justify-between items-center text-xs">
        {loadingText && (
          <div className="text-gray-600">
            {loadingText}
          </div>
        )}
        
        {showPercentage && !indeterminate && (
          <div className="text-gray-600 ml-auto">
            {clampedValue}%
          </div>
        )}
      </div>
      
      {showPerformanceText && (message || estimatedTime) && (
        <div className="text-xs text-gray-500 max-w-xs">
          {message && <p>{message}</p>}
          {estimatedTime && <p className="mt-1">{estimatedTime}</p>}
        </div>
      )}
    </div>
  );
}