import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { UADForm } from '@/components/uad/UADForm';
import { UADFormProvider } from '@/contexts/UADFormContext';
import { usePropertyData } from '@/hooks/usePropertyData';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, FileText, Database, RefreshCw } from 'lucide-react';
import { PropertyInfoCard } from '@/components/property/PropertyInfoCard';
import { PropertyDataRetrieval } from '@/components/property/PropertyDataRetrieval';
import { PageLayout } from '@/components/layout/page-layout';
import { useApp } from '@/contexts/AppContext';

export default function EnhancedUADFormPage() {
  const { id } = useParams<{ id?: string }>();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('form');
  
  // Get global app context for centralized state management
  const { startLoading, stopLoading, setError, clearError } = useApp();
  
  // Convert ID to number if it exists
  const propertyId = id ? parseInt(id) : undefined;
  
  // Get property data
  const { 
    useProperty, 
    retrievePropertyData, 
    isRetrievingPropertyData 
  } = usePropertyData();
  const { data: property, isLoading, error } = useProperty(propertyId);
  
  useEffect(() => {
    if (error) {
      setError('Property Data Error', 'Failed to load property data. Please try again later.');
      console.error('Property data error:', error);
    } else {
      clearError();
    }
  }, [error, setError, clearError]);
  
  // Handle property data loading state
  useEffect(() => {
    if (isLoading) {
      startLoading('Loading property data...');
    } else {
      stopLoading();
    }
  }, [isLoading, startLoading, stopLoading]);
  
  // Handle property retrieval
  const handlePropertyDataRefresh = async () => {
    if (!propertyId) return;
    
    startLoading('Refreshing property data...');
    
    try {
      await retrievePropertyData({ propertyId });
    } catch (error: any) {
      console.error('Error refreshing property data:', error);
      setError('Data Refresh Error', 'Failed to refresh property data. Please try again.');
    } finally {
      stopLoading();
    }
  };
  
  // Handle property selection (if no ID provided)
  const handlePropertySelect = (selectedPropertyId: number) => {
    setLocation(`/uad-form/${selectedPropertyId}`);
  };
  
  // No property ID state
  if (!propertyId) {
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
            <CardTitle>Select Property</CardTitle>
            <CardDescription>
              Choose a property to complete a UAD form for it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="mb-4 text-muted-foreground">
                No property is currently selected. Please go to Property Management to select a property, or use the property selector below.
              </p>
              <Button onClick={() => setLocation('/property-data')}>
                <Home className="mr-2 h-4 w-4" />
                Go to Property Management
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout
      title="UAD Appraisal Form"
      description={property ? `${property.address}, ${property.city}, ${property.state} ${property.zipCode}` : 'Loading property details...'}
      loading={isLoading}
      actions={
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation(`/property/${propertyId}`)}
          >
            <Home className="mr-2 h-4 w-4" />
            Property Details
          </Button>
        </div>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="form">
            <FileText className="mr-2 h-4 w-4" />
            UAD Form
          </TabsTrigger>
          <TabsTrigger value="property">
            <Home className="mr-2 h-4 w-4" />
            Property Details
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="mr-2 h-4 w-4" />
            Data Retrieval
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="form" className="space-y-6">
          <UADFormProvider>
            <UADForm propertyId={propertyId} />
          </UADFormProvider>
        </TabsContent>
        
        <TabsContent value="property" className="space-y-6">
          {property ? (
            <PropertyInfoCard property={property} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading property details...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="data" className="space-y-6">
          <PropertyDataRetrieval 
            propertyId={propertyId} 
            onDataRetrieved={handlePropertyDataRefresh}
          />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}