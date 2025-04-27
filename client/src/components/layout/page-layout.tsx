import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ErrorBanner } from '@/components/ui/error-banner';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { SyncStatus } from '@/components/ui/sync-status';
import { 
  ArrowLeft, 
  HelpCircle, 
  Settings,
  MoreHorizontal
} from 'lucide-react';
import { Link } from 'wouter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export interface PageHeaderProps {
  // Page title
  title: string;
  // Page description
  description?: string;
  // Back link URL
  backUrl?: string;
  // Back link text
  backText?: string;
  // Right area content (buttons, actions)
  actions?: ReactNode;
  // Additional CSS classes
  className?: string;
  // Whether to show the sync status
  showSyncStatus?: boolean;
}

export function PageHeader({
  title,
  description,
  backUrl,
  backText = 'Back',
  actions,
  className,
  showSyncStatus = false,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          {backUrl && (
            <Link href={backUrl}>
              <Button variant="ghost" size="sm" className="mb-2 -ml-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backText}
              </Button>
            </Link>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showSyncStatus && <SyncStatus />}
          {actions}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Page Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export interface PageLayoutProps {
  // Page title
  title: string;
  // Page description
  description?: string;
  // Back link URL
  backUrl?: string;
  // Back link text
  backText?: string;
  // Right area content (buttons, actions)
  actions?: ReactNode;
  // Page content
  children: ReactNode;
  // Whether to show the loading overlay
  loading?: boolean;
  // Custom loading message
  loadingMessage?: string;
  // Error message to display
  error?: string;
  // Error description
  errorDescription?: string;
  // Whether to show a full-screen loading overlay
  fullScreenLoading?: boolean;
  // Additional CSS classes for the header
  headerClassName?: string;
  // Additional CSS classes for the content
  contentClassName?: string;
  // Whether to show the sync status
  showSyncStatus?: boolean;
}

export function PageLayout({
  title,
  description,
  backUrl,
  backText,
  actions,
  children,
  loading,
  loadingMessage,
  error,
  errorDescription,
  fullScreenLoading = false,
  headerClassName,
  contentClassName,
  showSyncStatus = true,
}: PageLayoutProps) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title={title}
        description={description}
        backUrl={backUrl}
        backText={backText}
        actions={actions}
        className={headerClassName}
        showSyncStatus={showSyncStatus}
      />
      
      {error && (
        <ErrorBanner 
          title={error} 
          description={errorDescription} 
        />
      )}
      
      {loading && fullScreenLoading ? (
        <LoadingOverlay 
          show={loading} 
          message={loadingMessage} 
          fullScreen={fullScreenLoading} 
        />
      ) : loading ? (
        <LoadingPlaceholder />
      ) : (
        <div className={cn("", contentClassName)}>
          {children}
        </div>
      )}
    </div>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[80%]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-[200px] rounded-md" />
        <Skeleton className="h-[200px] rounded-md" />
        <Skeleton className="h-[200px] rounded-md" />
      </div>
    </div>
  );
}