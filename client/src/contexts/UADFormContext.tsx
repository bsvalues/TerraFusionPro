import React, { createContext, useContext, useState, useEffect } from 'react';
import { UADField, UADFormSection } from '@/components/uad/constants';
import { usePropertyData } from '@/hooks/usePropertyData';

interface UADFormContextType {
  formData: Record<string, any>;
  updateField: (fieldId: string, value: any) => void;
  updateSection: (section: UADFormSection, data: Record<string, any>) => void;
  isDataChanged: boolean;
  resetChanges: () => void;
  saveChanges: () => Promise<void>;
  isSaving: boolean;
  originalData: Record<string, any>;
  loadFormDataFromProperty: (propertyId: number) => Promise<void>;
  isLoading: boolean;
  currentPropertyId: number | null;
  hasUnsavedChanges: boolean;
}

const UADFormContext = createContext<UADFormContextType | undefined>(undefined);

interface UADFormProviderProps {
  children: React.ReactNode;
}

export const UADFormProvider: React.FC<UADFormProviderProps> = ({ children }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});
  const [isDataChanged, setIsDataChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPropertyId, setCurrentPropertyId] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const propertyData = usePropertyData();
  
  // Map property data to form fields
  const mapPropertyToFormData = (property: any): Record<string, any> => {
    if (!property) return {};
    
    return {
      // Subject Property Section
      property_address: property.address,
      city: property.city,
      state: property.state,
      zip_code: property.zipCode,
      county: property.county || '',
      assessors_parcel: property.parcelNumber || '',
      tax_year: property.taxYear || new Date().getFullYear() - 1,
      r_e_taxes: property.annualTaxes || 0,
      
      // Improvements Section
      year_built: property.yearBuilt || 0,
      gross_living_area: property.grossLivingArea || 0,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      condition: property.condition || '',
      quality: property.constructionQuality || '',
      
      // Site Section
      site_area: property.lotSize || 0,
      site_view: property.view || 'N',
      
      // Any other property data mappings
      ...property.formData || {} // Include any existing form data if available
    };
  };
  
  // Load data from property
  const loadFormDataFromProperty = async (propertyId: number) => {
    if (!propertyId) return;
    
    setIsLoading(true);
    
    try {
      const property = await propertyData.useProperty(propertyId).refetch();
      
      if (property?.data) {
        const mappedData = mapPropertyToFormData(property.data);
        setFormData(mappedData);
        setOriginalData(mappedData);
        setCurrentPropertyId(propertyId);
        setIsDataChanged(false);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error loading property data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update a single field
  const updateField = (fieldId: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [fieldId]: value };
      
      // Check if the data has changed from the original
      const hasChanged = JSON.stringify(newData) !== JSON.stringify(originalData);
      setIsDataChanged(hasChanged);
      setHasUnsavedChanges(hasChanged);
      
      return newData;
    });
  };
  
  // Update an entire section
  const updateSection = (section: UADFormSection, data: Record<string, any>) => {
    setFormData(prev => {
      const newData = { ...prev, ...data };
      
      // Check if the data has changed from the original
      const hasChanged = JSON.stringify(newData) !== JSON.stringify(originalData);
      setIsDataChanged(hasChanged);
      setHasUnsavedChanges(hasChanged);
      
      return newData;
    });
  };
  
  // Reset changes to original data
  const resetChanges = () => {
    setFormData(originalData);
    setIsDataChanged(false);
    setHasUnsavedChanges(false);
  };
  
  // Save changes to the property
  const saveChanges = async () => {
    if (!currentPropertyId || !isDataChanged) return;
    
    setIsSaving(true);
    
    try {
      // Create property update payload
      const propertyUpdate: any = {
        // Basic property data
        address: formData.property_address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zip_code,
        yearBuilt: formData.year_built,
        grossLivingArea: formData.gross_living_area.toString(),
        bedrooms: formData.bedrooms.toString(),
        bathrooms: formData.bathrooms.toString(),
        
        // Additional property data if supported by the schema
        ...(formData.condition ? { condition: formData.condition } : {}),
        ...(formData.quality ? { constructionQuality: formData.quality } : {}),
        ...(formData.site_area ? { lotSize: formData.site_area.toString() } : {}),
        
        // Store the full form data for fields that don't map directly to property model
        formData: formData
      };
      
      // Update the property
      await propertyData.updateProperty({
        id: currentPropertyId,
        data: propertyUpdate
      });
      
      // Update the original data after saving
      setOriginalData(formData);
      setIsDataChanged(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving property data:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Effect to detect unsaved changes before unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);
  
  const contextValue = {
    formData,
    updateField,
    updateSection,
    isDataChanged,
    resetChanges,
    saveChanges,
    isSaving,
    originalData,
    loadFormDataFromProperty,
    isLoading,
    currentPropertyId,
    hasUnsavedChanges
  };
  
  return (
    <UADFormContext.Provider value={contextValue}>
      {children}
    </UADFormContext.Provider>
  );
};

export const useUADForm = () => {
  const context = useContext(UADFormContext);
  
  if (context === undefined) {
    throw new Error('useUADForm must be used within a UADFormProvider');
  }
  
  return context;
};