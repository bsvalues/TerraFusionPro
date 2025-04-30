/**
 * useSnapshotHistory Hook
 * 
 * Custom hook for managing property snapshot history
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ComparableSnapshot, SnapshotDifference } from '../../shared/types/comps';

/**
 * Hook for managing property snapshot history
 */
export const useSnapshotHistory = (propertyId?: string) => {
  const queryClient = useQueryClient();
  const [selectedSnapshot, setSelectedSnapshot] = useState<ComparableSnapshot | null>(null);
  
  // Fetch snapshots for a property
  const {
    data: snapshots = [],
    isLoading,
    error
  } = useQuery({
    queryKey: propertyId ? ['snapshots', propertyId] : null,
    queryFn: async () => {
      const response = await fetch(`/api/comps/history/${propertyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch snapshots');
      }
      const data = await response.json();
      return data.snapshots as ComparableSnapshot[];
    },
    enabled: !!propertyId,
  });
  
  // Create a new snapshot
  const createSnapshot = useMutation({
    mutationFn: async (snapshotData: { 
      propertyId: string; 
      source: string; 
      fields: Record<string, any> 
    }) => {
      const response = await fetch('/api/comps/snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(snapshotData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create snapshot');
      }
      
      const data = await response.json();
      return data.snapshot as ComparableSnapshot;
    },
    onSuccess: (newSnapshot) => {
      // Invalidate snapshots query to refetch
      queryClient.invalidateQueries({ queryKey: ['snapshots', newSnapshot.propertyId] });
    },
  });
  
  // Compare two snapshots
  const compareSnapshots = (before: ComparableSnapshot, after: ComparableSnapshot): SnapshotDifference => {
    const beforeFields = Object.keys(before.fields);
    const afterFields = Object.keys(after.fields);
    
    // Find added fields (in after but not in before)
    const added = afterFields
      .filter(field => !beforeFields.includes(field))
      .map(field => ({
        field,
        value: after.fields[field]
      }));
    
    // Find removed fields (in before but not in after)
    const removed = beforeFields
      .filter(field => !afterFields.includes(field))
      .map(field => ({
        field,
        value: before.fields[field]
      }));
    
    // Find changed fields (in both but with different values)
    const changed = beforeFields
      .filter(field => 
        afterFields.includes(field) && 
        JSON.stringify(before.fields[field]) !== JSON.stringify(after.fields[field])
      )
      .map(field => ({
        field,
        fromValue: before.fields[field],
        toValue: after.fields[field]
      }));
    
    return {
      added,
      removed,
      changed
    };
  };
  
  // Push snapshot data to form
  const pushToForm = useMutation({
    mutationFn: async (formData: { 
      formId: string; 
      snapshotId: string; 
      fieldMappings: Record<string, string> 
    }) => {
      const response = await fetch('/api/forms/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to push data to form');
      }
      
      return response.json();
    },
  });
  
  return {
    snapshots,
    isLoading,
    error,
    selectedSnapshot,
    setSelectedSnapshot,
    createSnapshot,
    compareSnapshots,
    pushToForm
  };
};