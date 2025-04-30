import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from '../lib/queryClient';
import { ComparableSnapshot, PushSnapshotRequest, PushSnapshotResponse } from '@shared/types/comps';
import { useToast } from '@/hooks/use-toast';

/**
 * useSnapshotHistory Hook
 * 
 * Custom hook for fetching and managing snapshot history for a property
 */
interface UseSnapshotHistoryResult {
  snapshots: ComparableSnapshot[] | undefined;
  isLoading: boolean;
  error: Error | null;
  pushToForm: (snapshot: ComparableSnapshot, formId: string, fieldMappings: Record<string, string>) => Promise<void>;
}

export function useSnapshotHistory(propertyId: string): UseSnapshotHistoryResult {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Query to fetch snapshot history
  const { 
    data: snapshots, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: [`/api/properties/${propertyId}/snapshots`],
    queryFn: getQueryFn(`/api/properties/${propertyId}/snapshots`),
    enabled: !!propertyId
  });
  
  // Mutation to push snapshot data to a form
  const pushToFormMutation = useMutation({
    mutationFn: async (data: PushSnapshotRequest): Promise<PushSnapshotResponse> => {
      return apiRequest('/api/snapshots/push-to-form', {
        method: 'POST',
        data
      });
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        // If a new snapshot was created as a result, add it to the cache
        if (data.newSnapshot) {
          // Update the snapshots in the cache
          queryClient.setQueryData(
            [`/api/properties/${propertyId}/snapshots`], 
            (oldData: ComparableSnapshot[] | undefined) => {
              if (!oldData) return [data.newSnapshot];
              return [...oldData, data.newSnapshot];
            }
          );
        }
        
        toast({
          title: "Success",
          description: "Data successfully pushed to form",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to push data to form",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Function to push snapshot data to a form
  const pushToForm = async (
    snapshot: ComparableSnapshot,
    formId: string,
    fieldMappings: Record<string, string>
  ) => {
    await pushToFormMutation.mutateAsync({
      snapshotId: snapshot.id,
      formId,
      fieldMappings
    });
  };
  
  return {
    snapshots,
    isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    pushToForm
  };
}