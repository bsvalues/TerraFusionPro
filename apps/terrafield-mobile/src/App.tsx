import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from './navigation/AppNavigator';

// Create Query Client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
    },
  },
});

// Main App Component
export default function App() {
  // Initialize services as needed
  useEffect(() => {
    // This would be a good place to initialize any services that need
    // to be started when the app launches
    return () => {
      // Cleanup function if needed
    };
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar barStyle="light-content" />
        <AppNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}