import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface PageLayoutProps {
  /**
   * Page title
   */
  title: string;

  /**
   * Page description
   */
  description?: string;

  /**
   * Action buttons to display in the page header
   */
  actions?: React.ReactNode;

  /**
   * Show sync status
   */
  showSyncStatus?: boolean;

  /**
   * Is the page loading
   */
  isLoading?: boolean;

  /**
   * Error message if any
   */
  error?: Error | string | null;

  /**
   * Success message if any
   */
  success?: string | null;

  /**
   * Page content
   */
  children: React.ReactNode;

  /**
   * Additional classes to apply to the root container
   */
  className?: string;
}

/**
 * StandardizedPageLayout component provides a consistent layout for all pages
 */
export function PageLayout({
  title,
  description,
  actions,
  showSyncStatus = false,
  isLoading = false,
  error = null,
  success = null,
  children,
  className = ''
}: PageLayoutProps) {
  // Convert error object to string if needed
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div className={`container mx-auto py-8 ${className}`}>
      <Helmet>
        <title>{`${title} | TerraFusionPlatform`}</title>
        <meta name="description" content={description || `${title} page in TerraFusionPlatform`} />
      </Helmet>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Sync Status */}
      {showSyncStatus && (
        <div className="mb-4 flex items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span>All changes synced</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {errorMessage && !isLoading && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {success && !isLoading && !errorMessage && (
        <Alert variant="default" className="mb-6 bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Page Content */}
      {!isLoading && !errorMessage && children}
    </div>
  );
}