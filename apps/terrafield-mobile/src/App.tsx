import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './hooks/useAuth';

// Ignore specific warnings that are not relevant or cannot be fixed
LogBox.ignoreLogs([
  // Ignore timer warnings from external libraries
  'Setting a timer for a long period of time',
  // Ignore warnings from Hermes dev experience
  'Require cycle:',
  // Ignore yellow box about ViewPropTypes
  'ViewPropTypes will be removed from React Native',
  // Add more warnings to ignore as necessary
]);

const App = () => {
  // Run setup tasks when the app starts
  useEffect(() => {
    // Initialize services or load necessary data here
    const initializeApp = async () => {
      try {
        // You might want to initialize services here
        // For example, initialize the notification service
        // or perform any other startup tasks
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;