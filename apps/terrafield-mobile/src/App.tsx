import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './hooks/useAuth';
import * as Colors from './constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { NotificationService } from './services/NotificationService';

// Initialize notification service
const notificationService = NotificationService.getInstance();

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize notifications
        await notificationService.initialize();
        
        // Simulate app loading (in a real app, you would load resources, fonts, etc.)
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Set up network connectivity listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Loading screen
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading TerraField...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        
        {/* Network status indicator */}
        {isConnected === false && (
          <View style={styles.offlineIndicator}>
            <Text style={styles.offlineText}>You are offline</Text>
          </View>
        )}
      </AuthProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: Colors.text,
  },
  offlineIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.error,
    padding: 8,
    alignItems: 'center',
  },
  offlineText: {
    color: Colors.white,
    fontWeight: '600',
  },
});

export default App;