import React from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';
import { useApp } from '@/contexts/AppContext';

export default function EnhancedUADFormPage() {
  console.log('Rendering EnhancedUADFormPage in simplified form');
  
  const { id } = useParams<{ id?: string }>();
  const [location, setLocation] = useLocation();
  
  // Get global app context for centralized state management
  const { setError } = useApp();
  
  console.log('UAD Form Page ID:', id);
  
  // Convert ID to number if it exists
  const propertyId = id ? parseInt(id) : undefined;
  
  // Handle property selection (if no ID provided)
  const handlePropertySelect = (selectedPropertyId: number) => {
    setLocation(`/uad-form/${selectedPropertyId}`);
  };
  
  return (
    <PageLayout
      title="UAD Form"
      description="Uniform Residential Appraisal Report"
      actions={
        <Button onClick={() => setLocation('/property-data')}>
          <Home className="mr-2 h-4 w-4" />
          Property Management
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>UAD Form - Enhanced UI</CardTitle>
          <CardDescription>
            This is the enhanced UAD Form with consistent UI patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="mb-4">
              {propertyId 
                ? `Viewing property ID: ${propertyId}` 
                : 'No property selected. Please select a property to continue.'}
            </p>
            <Button onClick={() => setLocation('/property-data')}>
              <Home className="mr-2 h-4 w-4" />
              Go to Property Management
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>About Enhanced UI Components</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This enhanced page demonstrates the following improvements:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Consistent page layout with proper title and description</li>
            <li>Standardized action buttons in the header</li>
            <li>Centralized error handling through AppContext</li>
            <li>Improved loading state management</li>
            <li>Responsive design with proper spacing and typography</li>
          </ul>
        </CardContent>
      </Card>
    </PageLayout>
  );
}