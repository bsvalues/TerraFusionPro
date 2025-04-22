import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

/**
 * Custom hook for fetching and updating property data
 */
export function usePropertyData() {
  // Fetch a single property
  const useProperty = (propertyId: number | undefined) => {
    return useQuery({
      queryKey: ['/api/properties', propertyId],
      queryFn: async () => {
        if (!propertyId) return null;
        const res = await apiRequest({ method: 'GET', path: `/api/properties/${propertyId}` });
        return res.json();
      },
      enabled: !!propertyId
    });
  };

  // Fetch properties for the current user
  const useProperties = () => {
    return useQuery({
      queryKey: ['/api/properties'],
      queryFn: async () => {
        const res = await apiRequest({ method: 'GET', path: '/api/properties' });
        return res.json();
      }
    });
  };

  // Create a new property
  const createPropertyMutation = useMutation({
    mutationFn: async (propertyData: any) => {
      const res = await apiRequest({ method: 'POST', path: '/api/properties', data: propertyData });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
    }
  });

  // Update an existing property
  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest({ method: 'PUT', path: `/api/properties/${id}`, data });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties', variables.id] });
    }
  });

  // Delete a property
  const deletePropertyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest({ method: 'DELETE', path: `/api/properties/${id}` });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
    }
  });

  // Trigger property data retrieval from public records
  const retrievePropertyDataMutation = useMutation({
    mutationFn: async ({ propertyId, reportId }: { propertyId: number, reportId?: number }) => {
      // First, get the property data
      const propertyRes = await apiRequest({ method: 'GET', path: `/api/properties/${propertyId}` });
      const property = await propertyRes.json();
      
      // If we have a report ID, use that, otherwise get the first report for this property
      let targetReportId = reportId;
      if (!targetReportId) {
        const reportsRes = await apiRequest({ method: 'GET', path: `/api/reports?propertyId=${propertyId}` });
        const reports = await reportsRes.json();
        if (reports && reports.length > 0) {
          targetReportId = reports[0].id;
        } else {
          // Create a new report if none exists
          const newReportRes = await apiRequest({ 
            method: 'POST', 
            path: `/api/reports`, 
            data: { 
              propertyId, 
              status: 'in_progress',
              reportType: 'URAR',
              formType: 'URAR',
              purpose: 'Refinance',
              effectiveDate: new Date().toISOString(),
              reportDate: new Date().toISOString()
            }
          });
          const newReport = await newReportRes.json();
          targetReportId = newReport.id;
        }
      }
      
      // Trigger the data analysis via the AI
      if (targetReportId) {
        const analyzeRes = await apiRequest({ 
          method: 'POST', 
          path: '/api/ai/analyze-property', 
          data: { propertyId }
        });
        await analyzeRes.json();
      } else {
        throw new Error('Could not find or create a report for this property');
      }
      
      // Return the updated property
      const updatedPropertyRes = await apiRequest({ method: 'GET', path: `/api/properties/${propertyId}` });
      return await updatedPropertyRes.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties', variables.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    }
  });

  return {
    useProperty,
    useProperties,
    createProperty: createPropertyMutation.mutateAsync,
    updateProperty: updatePropertyMutation.mutateAsync,
    deleteProperty: deletePropertyMutation.mutateAsync,
    retrievePropertyData: retrievePropertyDataMutation.mutateAsync,
    
    // Loading states
    isCreatingProperty: createPropertyMutation.isPending,
    isUpdatingProperty: updatePropertyMutation.isPending,
    isDeletingProperty: deletePropertyMutation.isPending,
    isRetrievingPropertyData: retrievePropertyDataMutation.isPending
  };
}