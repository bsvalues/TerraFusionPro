import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { usePerformance } from '@/contexts/PerformanceContext';

interface SpinnerProps {
  /** Size of the spinner (sm, md, lg, xl) */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /** Optional className for styling */
  className?: string;
  
  /** Whether the spinner should adapt to performance */
  adaptive?: boolean;
  
  /** Loading text to display */
  loadingText?: string;
  
  /** Show performance indicator text */
  showPerformanceText?: boolean;
}

/**
 * Adaptive loading spinner that changes its animation 
 * based on system performance
 */
export function AdaptiveSpinner({
  size = 'md',
  className,
  adaptive = true,
  loadingText,
  showPerformanceText = false
}: SpinnerProps) {
  const { performance } = usePerformance();
  const [animation, setAnimation] = useState('default');
  const [message, setMessage] = useState<string | null>(null);

  // Define size classes
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4'
  };

  // Update animation based on performance
  useEffect(() => {
    if (!adaptive) {
      setAnimation('default');
      setMessage(null);
      return;
    }

    switch (performance.overallPerformance) {
      case 'low':
        setAnimation('slow');
        setMessage('System performance is currently degraded. This might take longer than usual.');
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
        setAnimation('default');
        setMessage(null);
    }
  }, [adaptive, performance.overallPerformance]);

  // Animation duration based on performance
  const animationDuration = {
    slow: 'animate-spin-slow',
    medium: 'animate-spin',
    fast: 'animate-spin-fast',
    default: 'animate-spin'
  };

  // Border styles for performance
  const performanceStyles = {
    low: 'border-amber-500 border-l-amber-200',
    medium: 'border-blue-500 border-l-blue-200',
    high: 'border-green-500 border-l-green-200',
    default: 'border-primary border-l-transparent'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div
        className={cn(
          'rounded-full',
          sizeClasses[size],
          animationDuration[animation],
          adaptive 
            ? performanceStyles[performance.overallPerformance] 
            : performanceStyles.default,
          className
        )}
      />
      
      {loadingText && (
        <div className="text-sm text-gray-600 mt-2">{loadingText}</div>
      )}
      
      {showPerformanceText && message && (
        <div className="text-xs text-gray-500 mt-1 max-w-xs text-center">
          {message}
        </div>
      )}
    </div>
  );
}

// Export a default spinner that can be used as a drop-in replacement
export function LoadingSpinner(props: SpinnerProps) {
  return <AdaptiveSpinner {...props} />;
}