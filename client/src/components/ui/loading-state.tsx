import React from 'react';
import { cn } from '@/lib/utils';

type LoadingStateProps = {
  isLoading: boolean;
  loadingText?: string;
  className?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'overlay' | 'inline' | 'skeleton';
};

export function LoadingState({
  isLoading,
  loadingText = 'Loading...',
  className,
  children,
  size = 'md',
  variant = 'overlay'
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  // If not loading, just render children
  if (!isLoading) {
    return <>{children}</>;
  }

  if (variant === 'skeleton') {
    return (
      <div className="animate-pulse">
        <div className="flex space-x-4 w-full">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className={cn("animate-spin rounded-full border-2 border-current border-t-transparent", sizeClasses[size])}
             aria-hidden="true"
             role="status"
             data-testid="loading-spinner"></div>
        <span>{loadingText}</span>
      </div>
    );
  }

  // Default overlay variant
  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10 backdrop-blur-sm">
        <div 
          className={cn("animate-spin rounded-full border-2 border-primary border-t-transparent", sizeClasses[size])} 
          aria-hidden="true"
          role="status"
          data-testid="loading-spinner"
        />
        {loadingText && <p className="mt-2 text-sm text-muted-foreground">{loadingText}</p>}
      </div>
    </div>
  );
}