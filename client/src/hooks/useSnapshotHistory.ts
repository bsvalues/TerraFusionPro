import { useState, useEffect } from 'react';
import { ComparableSnapshot } from '@/shared/types/comps';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch historical snapshots for a property
 * @param addressId The ID of the property
 */
export function useSnapshotHistory(addressId: string | null) {
  const { toast } = useToast();
  
  const snapshotsQuery = useQuery({
    queryKey: ['/api/comps/history', addressId],
    queryFn: async () => {
      if (!addressId) return { snapshots: [] };
      
      try {
        const response = await fetch(`/api/comps/history/${addressId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch history: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        toast({
          title: "Error fetching history",
          description: error instanceof Error ? error.message : String(error),
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: !!addressId,
  });

  return {
    snapshots: snapshotsQuery.data?.snapshots as ComparableSnapshot[] || [],
    isLoading: snapshotsQuery.isLoading,
    isError: snapshotsQuery.isError,
    error: snapshotsQuery.error,
    refetch: snapshotsQuery.refetch
  };
}