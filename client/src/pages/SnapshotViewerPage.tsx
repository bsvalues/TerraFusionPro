import React from 'react';
import { useLocation, useRoute } from 'wouter';
import { SnapshotViewer } from '../components/comps/SnapshotViewer';
// Direct import of PageHeader without sub-components that don't exist
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { History, Home, Building } from 'lucide-react';

export default function SnapshotViewerPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/snapshots/:propertyId');
  
  // If no propertyId provided, show error
  if (!match || !params?.propertyId) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
            Property Not Found
          </h1>
          <p className="text-muted-foreground mb-8">
            No property ID was provided. Please select a property to view its snapshot history.
          </p>
          <button 
            onClick={() => setLocation('/')}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Return to Properties
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/" onClick={(e) => { e.preventDefault(); setLocation('/'); }}>
            <Home className="h-4 w-4 mr-1" />
            <span>Home</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/comps" onClick={(e) => { e.preventDefault(); setLocation('/comps'); }}>
            <Building className="h-4 w-4 mr-1" />
            <span>Comparables</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <History className="h-4 w-4 mr-1" />
          <span>Snapshot History</span>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <PageHeader className="mb-6">
        <PageHeaderHeading>Snapshot History</PageHeaderHeading>
        <PageHeaderDescription>
          View and compare historical snapshots of property data over time
        </PageHeaderDescription>
      </PageHeader>
      
      <SnapshotViewer 
        propertyId={params.propertyId}
        onBack={() => setLocation('/comps')}
      />
    </div>
  );
}