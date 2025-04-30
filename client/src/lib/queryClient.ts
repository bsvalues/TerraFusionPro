/**
 * Query client configuration for TanStack Query
 */
import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  data?: any;
}

/**
 * Make an API request with standardized error handling
 */
export async function apiRequest<T = any>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { method = 'GET', headers = {}, data } = options;
  
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    credentials: 'include'
  };
  
  if (data) {
    requestOptions.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, requestOptions);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `API request failed with status ${response.status}`
    );
  }
  
  return response.json();
}

/**
 * Get a query function for use with useQuery
 * Simplifies creating consistent query functions
 */
export function getQueryFn<T = any>(url: string, options: ApiRequestOptions = {}): () => Promise<T> {
  return async () => {
    return apiRequest<T>(url, options);
  };
}