import { useState, useCallback, useEffect } from 'react';
import { useAppraisal } from '@/contexts/AppraisalContext';
import PropertyAddressCard from '@/components/appraisal/PropertyAddressCard';
import PropertyCharacteristicsCard from '@/components/appraisal/PropertyCharacteristicsCard';
import MarketValueWorksheetCard from '@/components/appraisal/MarketValueWorksheetCard';
import { Button } from '@/components/ui/button';
import { Property, Adjustment } from '@shared/schema';

export default function FormPage() {
  const {
    currentReport,
    currentProperty,
    comparables,
    adjustments,
    updateProperty,
    updateReport,
    createAdjustment,
    updateAdjustment
  } = useAppraisal();

  const [property, setProperty] = useState<Property | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Initialize state with current property data
  useEffect(() => {
    if (currentProperty) {
      setProperty(currentProperty);
    }
  }, [currentProperty]);

  // Handle property updates
  const handlePropertyChange = useCallback((data: Partial<Property>) => {
    if (!property) return;
    
    const updatedProperty = { ...property, ...data };
    setProperty(updatedProperty);
  }, [property]);

  // Save property changes
  const handleSave = useCallback(async () => {
    if (!property || !currentReport) return;
    
    try {
      await updateProperty(property.id, property);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving property:', error);
    }
  }, [property, currentReport, updateProperty]);

  // Handle report updates
  const handleReportChange = useCallback((data: any) => {
    if (!currentReport) return;
    
    updateReport(currentReport.id, data)
      .catch(error => console.error('Error updating report:', error));
  }, [currentReport, updateReport]);

  // Handle adjustment changes
  const handleAdjustmentChange = useCallback((comparableId: number, type: string, value: number) => {
    if (!currentReport) return;
    
    // Find if an adjustment of this type already exists for this comparable
    const existingAdjustment = adjustments.find(
      adj => adj.comparableId === comparableId && adj.adjustmentType === type
    );
    
    if (existingAdjustment) {
      // Update existing adjustment
      updateAdjustment(existingAdjustment.id, { 
        amount: value 
      }).catch(error => console.error('Error updating adjustment:', error));
    } else {
      // Create new adjustment
      createAdjustment({
        reportId: currentReport.id,
        comparableId,
        adjustmentType: type,
        description: `Adjustment for ${type}`,
        amount: value
      }).catch(error => console.error('Error creating adjustment:', error));
    }
  }, [currentReport, adjustments, createAdjustment, updateAdjustment]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (property && currentProperty && JSON.stringify(property) !== JSON.stringify(currentProperty)) {
        handleSave();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [property, currentProperty, handleSave]);

  if (!currentReport || !property) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>Loading property data...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Form Header */}
      <div className="bg-white border-b border-neutral-medium p-4 flex justify-between items-center">
        <h2 className="text-lg font-medium">Subject Property Details</h2>
        <div className="flex items-center space-x-2">
          {lastSaved && (
            <span className="text-sm text-neutral-gray">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button 
            onClick={handleSave}
            className="px-3 py-1 text-sm bg-secondary text-white rounded-md hover:bg-secondary-dark flex items-center"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Save
          </Button>
        </div>
      </div>
      
      {/* Subject Property Form */}
      <div className="flex-1 overflow-auto p-6 bg-neutral-lightest">
        <div className="max-w-5xl mx-auto">
          {/* Property Address Card */}
          <PropertyAddressCard 
            property={property}
            onPropertyChange={handlePropertyChange}
          />
          
          {/* Property Characteristics Card */}
          <PropertyCharacteristicsCard 
            property={property}
            onPropertyChange={handlePropertyChange}
          />
          
          {/* Market Value Worksheet Card */}
          <MarketValueWorksheetCard 
            property={property}
            comparables={comparables}
            adjustments={adjustments}
            report={currentReport}
            onReportChange={handleReportChange}
            onAdjustmentChange={handleAdjustmentChange}
          />
        </div>
      </div>
    </div>
  );
}
