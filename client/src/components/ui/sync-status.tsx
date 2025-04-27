import React from 'react';
import { 
  Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, Info
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { Badge, BadgeProps } from './badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from './tooltip';
import { Button } from './button';

export interface SyncStatusProps {
  // Additional CSS classes
  className?: string;
  // Whether to show the retry button for error states
  showRetry?: boolean;
  // Callback for retry action
  onRetry?: () => void;
  // Badge variant
  variant?: BadgeProps['variant'];
}

export function SyncStatus({
  className,
  showRetry = false,
  onRetry,
  variant = 'outline',
}: SyncStatusProps) {
  const { state, resetSync } = useApp();
  const { status, pendingItems, lastSyncTime, errorDetails } = state.syncState;
  
  let icon = <Cloud className="h-3 w-3 mr-1" />;
  let text = 'Synced';
  let tooltipText = lastSyncTime 
    ? `Last synced: ${new Date(lastSyncTime).toLocaleString()}` 
    : 'All changes are synced';
  let statusVariant: BadgeProps['variant'] = variant;
  
  switch (status) {
    case 'syncing':
      icon = <RefreshCw className="h-3 w-3 mr-1 animate-spin" />;
      text = pendingItems > 0 ? `Syncing ${pendingItems} items` : 'Syncing...';
      tooltipText = 'Synchronizing data with the server';
      statusVariant = 'secondary';
      break;
    case 'error':
      icon = <CloudOff className="h-3 w-3 mr-1" />;
      text = 'Sync Error';
      tooltipText = errorDetails || 'Failed to sync with the server';
      statusVariant = 'destructive';
      break;
    case 'success':
      icon = <CheckCircle className="h-3 w-3 mr-1" />;
      text = 'Synced';
      statusVariant = 'default';
      break;
    case 'idle':
      if (pendingItems > 0) {
        icon = <Info className="h-3 w-3 mr-1" />;
        text = `${pendingItems} pending`;
        tooltipText = `${pendingItems} items waiting to be synced`;
        statusVariant = 'outline';
      }
      break;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center", className)}>
            <Badge variant={statusVariant} className="flex items-center gap-1">
              {icon}
              <span>{text}</span>
            </Badge>
            
            {showRetry && status === 'error' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 ml-1 px-1" 
                onClick={() => onRetry ? onRetry() : resetSync()}
              >
                <RefreshCw className="h-3 w-3" />
                <span className="sr-only">Retry</span>
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
          {lastSyncTime && status !== 'error' && (
            <p className="text-xs text-muted-foreground">
              Last synced: {new Date(lastSyncTime).toLocaleString()}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}