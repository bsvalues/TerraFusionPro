import React from 'react';
import { AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

type ErrorSeverity = 'warning' | 'error' | 'critical';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  severity?: ErrorSeverity;
  className?: string;
  showRetry?: boolean;
  errorCode?: string | number;
}

export function ErrorState({
  title,
  message,
  onRetry,
  severity = 'error',
  className,
  showRetry = true,
  errorCode
}: ErrorStateProps) {
  const getIcon = () => {
    switch (severity) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
    }
  };

  const getDefaultTitle = () => {
    switch (severity) {
      case 'warning':
        return 'Warning';
      case 'critical':
        return 'Critical Error';
      default:
        return 'Error Occurred';
    }
  };

  const getVariant = () => {
    switch (severity) {
      case 'warning':
        return 'default';
      default:
        return 'destructive';
    }
  };

  return (
    <Alert 
      variant={getVariant()} 
      className={cn("flex flex-col items-start", className)}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>
        <div className="flex-1">
          <AlertTitle className="text-base font-medium">
            {title || getDefaultTitle()}
            {errorCode && <span className="ml-2 text-xs opacity-70">({errorCode})</span>}
          </AlertTitle>
          <AlertDescription className="mt-1">
            {message}
          </AlertDescription>
        </div>
      </div>
      
      {showRetry && onRetry && (
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-3 ml-8 flex items-center"
          onClick={onRetry}
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Try Again
        </Button>
      )}
    </Alert>
  );
}