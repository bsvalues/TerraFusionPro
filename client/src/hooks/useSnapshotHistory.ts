/**
 * useSnapshotHistory Hook
 * 
 * Custom hook for fetching and managing snapshot history for a property
 */
import { useState, useEffect } from 'react';
import { ComparableSnapshot } from '../../shared/types/comps';
import { useToast } from '@/hooks/use-toast';

// In a real implementation, this would be fetched from the server
// These are sample snapshots for demonstration purposes
const generateSampleSnapshots = (propertyId: string): ComparableSnapshot[] => {
  const now = new Date();
  
  return [
    {
      id: `${propertyId}-snap-1`,
      propertyId,
      source: 'MLS Import',
      version: 1,
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      fields: {
        address: '123 Main St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        propertyType: 'Single Family',
        yearBuilt: 1995,
        bedrooms: 3,
        bathrooms: 2,
        grossLivingArea: 1800,
        lotSize: 5000,
        garage: '2 Car Attached',
        pool: false,
        salePrice: 425000,
        saleDate: '2023-01-15',
        mlsNumber: 'MLS123456'
      }
    },
    {
      id: `${propertyId}-snap-2`,
      propertyId,
      source: 'Manual Edit',
      version: 2,
      createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      fields: {
        address: '123 Main St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        propertyType: 'Single Family',
        yearBuilt: 1995,
        bedrooms: 3,
        bathrooms: 2.5, // Updated
        grossLivingArea: 1850, // Updated
        lotSize: 5000, 
        garage: '2 Car Attached',
        pool: false,
        basement: 'Finished', // Added
        salePrice: 425000,
        saleDate: '2023-01-15',
        mlsNumber: 'MLS123456',
        latitude: '30.2672', // Added
        longitude: '-97.7431' // Added
      }
    },
    {
      id: `${propertyId}-snap-3`,
      propertyId,
      source: 'Form Push',
      version: 3,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      fields: {
        address: '123 Main St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        propertyType: 'Single Family',
        yearBuilt: 1995,
        bedrooms: 4, // Updated
        bathrooms: 2.5,
        grossLivingArea: 1850,
        lotSize: 5200, // Updated
        garage: '2 Car Attached',
        pool: true, // Updated
        basement: 'Finished',
        salePrice: 445000, // Updated
        saleDate: '2023-01-15',
        mlsNumber: 'MLS123456',
        latitude: '30.2672',
        longitude: '-97.7431',
        condition: 'Good', // Added
        quality: 'Average' // Added
      }
    },
    {
      id: `${propertyId}-snap-4`,
      propertyId,
      source: 'API Update',
      version: 4,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      fields: {
        address: '123 Main St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        propertyType: 'Single Family',
        yearBuilt: 1995,
        bedrooms: 4,
        bathrooms: 2.5,
        grossLivingArea: 1850,
        lotSize: 5200,
        garage: '2 Car Attached',
        pool: true,
        basement: 'Finished',
        salePrice: 445000,
        saleDate: '2023-01-15',
        mlsNumber: 'MLS123456',
        latitude: '30.2672',
        longitude: '-97.7431',
        condition: 'Good',
        quality: 'Average',
        lastAssessedValue: 430000, // Added
        taxYear: 2023, // Added
        schoolDistrict: 'Austin ISD' // Added
      }
    }
  ];
};

interface UseSnapshotHistoryResult {
  snapshots: ComparableSnapshot[] | undefined;
  isLoading: boolean;
  error: Error | null;
  pushToForm: (snapshot: ComparableSnapshot, formId: string, fieldMappings: Record<string, string>) => Promise<void>;
}

export function useSnapshotHistory(propertyId: string): UseSnapshotHistoryResult {
  const [snapshots, setSnapshots] = useState<ComparableSnapshot[]>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  // Fetch snapshots
  useEffect(() => {
    const fetchSnapshots = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real implementation, this would be an API call
        // For now, we'll simulate a delay and return mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate sample snapshots for the given property ID
        const sampleSnapshots = generateSampleSnapshots(propertyId);
        setSnapshots(sampleSnapshots);
      } catch (err) {
        console.error('Error fetching snapshots:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch snapshots'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSnapshots();
  }, [propertyId]);
  
  // Push snapshot to form
  const pushToForm = async (
    snapshot: ComparableSnapshot,
    formId: string,
    fieldMappings: Record<string, string>
  ) => {
    try {
      // In a real implementation, this would be an API call
      // For now, we'll just simulate a delay and show a toast
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create the payload to send to the server
      const payload = {
        snapshotId: snapshot.id,
        formId,
        fieldMappings
      };
      
      console.log('Pushing to form with payload:', payload);
      
      // Show success toast
      toast({
        title: 'Fields pushed to form',
        description: `Successfully pushed ${Object.keys(fieldMappings).length} fields to form ${formId}`,
      });
      
      // Create a new snapshot version to represent this push
      if (snapshots) {
        const newSnapshot: ComparableSnapshot = {
          ...snapshot,
          id: `${snapshot.id}-push-${Date.now()}`,
          version: (snapshot.version || 0) + 1,
          source: 'Form Push',
          createdAt: new Date().toISOString(),
          fields: { ...snapshot.fields }
        };
        
        setSnapshots([...snapshots, newSnapshot]);
      }
    } catch (err) {
      console.error('Error pushing to form:', err);
      
      // Show error toast
      toast({
        title: 'Push failed',
        description: 'Failed to push fields to form. Please try again.',
        variant: 'destructive',
      });
      
      throw err;
    }
  };
  
  return {
    snapshots,
    isLoading,
    error,
    pushToForm
  };
}