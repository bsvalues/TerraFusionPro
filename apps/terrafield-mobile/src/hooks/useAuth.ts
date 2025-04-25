import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define user interface
interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

// Auth hook for React Native app
export function useAuthNative() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from AsyncStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem('terrafield_user');
        if (userJson) {
          setUser(JSON.parse(userJson));
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function - would normally call an API
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // This would normally be an API call
      // For demo purposes, we're creating a mock user
      const mockUser: User = {
        id: 1,
        username,
        name: username === 'admin' ? 'Admin User' : 'Field Agent',
        email: `${username}@terrafield.com`,
        role: username === 'admin' ? 'admin' : 'field_agent',
      };

      // Save user to AsyncStorage
      await AsyncStorage.setItem('terrafield_user', JSON.stringify(mockUser));
      setUser(mockUser);
      return true;
    } catch (error) {
      console.error('Error logging in:', error);
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem('terrafield_user');
      setUser(null);
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  };

  return {
    user,
    isLoading,
    login,
    logout,
  };
}

// Simplified version for the web app component
export function useAuth() {
  // Return a mock user for our component
  return {
    id: 1,
    name: 'Demo User',
    username: 'demo_user',
    email: 'demo@terrafield.com',
    role: 'field_agent',
  };
}