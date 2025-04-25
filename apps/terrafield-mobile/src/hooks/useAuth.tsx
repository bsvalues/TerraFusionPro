import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../services/ApiService';
import { NotificationService } from '../services/NotificationService';

// User interface
export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

// Authentication context interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (username: string, password: string) => Promise<boolean>;
  signUp: (data: SignUpData) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
}

// Sign-up data interface
interface SignUpData {
  username: string;
  password: string;
  name: string;
  email: string;
}

// Create context with initial value
const AuthContext = createContext<AuthContextType | null>(null);

// Storage keys
const USER_STORAGE_KEY = 'terrafield_user';

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const apiService = ApiService.getInstance();
  const notificationService = NotificationService.getInstance();
  
  // Load user data from storage on app start
  useEffect(() => {
    loadUser();
  }, []);
  
  // Load user data from storage
  const loadUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get user data from storage
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      
      if (userJson) {
        // Parse user data
        const userData = JSON.parse(userJson);
        setUser(userData);
        
        // Set token in ApiService
        if (userData.token) {
          apiService.setToken(userData.token);
        }
        
        // Validate token with server
        try {
          // Only validate if we're online
          if (apiService.isConnected()) {
            const validatedUser = await apiService.get('/api/user/validate');
            if (validatedUser) {
              // Update user data with latest from server
              const updatedUserData = { ...userData, ...validatedUser };
              setUser(updatedUserData);
              saveUser(updatedUserData);
            }
          }
        } catch (validationError) {
          console.warn('Token validation failed:', validationError);
          // Keep the user logged in but we'll try again later
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save user data to storage
  const saveUser = async (userData: User & { token?: string }) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };
  
  // Sign in
  const signIn = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call API to sign in
      const response = await apiService.post('/api/auth/login', { username, password });
      
      if (response && response.user && response.token) {
        // Set user data
        const userData = { 
          ...response.user,
          token: response.token
        };
        
        setUser(userData);
        
        // Set token in ApiService
        apiService.setToken(response.token);
        
        // Save user data to storage
        await saveUser(userData);
        
        // Send client state to DataSyncService if applicable
        try {
          const { DataSyncService } = await import('../services/DataSyncService');
          DataSyncService.getInstance().setClientState(userData.id, userData.name);
        } catch (error) {
          console.warn('Failed to set client state in DataSyncService:', error);
        }
        
        return true;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error.message || 'Failed to sign in');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sign up
  const signUp = async (data: SignUpData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call API to sign up
      const response = await apiService.post('/api/auth/register', data);
      
      if (response && response.user && response.token) {
        // Set user data
        const userData = { 
          ...response.user,
          token: response.token
        };
        
        setUser(userData);
        
        // Set token in ApiService
        apiService.setToken(response.token);
        
        // Save user data to storage
        await saveUser(userData);
        
        // Send welcome notification
        notificationService.sendSystemNotification(
          'Welcome to TerraField',
          `Thank you for joining TerraField, ${userData.name}! Your account has been created successfully.`
        );
        
        return true;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setError(error.message || 'Failed to sign up');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call API to sign out
      try {
        await apiService.post('/api/auth/logout');
      } catch (error) {
        console.warn('Error during API sign out:', error);
        // Continue with local sign out even if API call fails
      }
      
      // Clear token in ApiService
      apiService.clearToken();
      
      // Clear user data
      setUser(null);
      
      // Remove user data from storage
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      
      // Disconnect from any active synchronization
      try {
        const { DataSyncService } = await import('../services/DataSyncService');
        await DataSyncService.getInstance().disconnect();
      } catch (error) {
        console.warn('Error disconnecting from DataSyncService:', error);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update profile
  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      setIsLoading(true);
      setError(null);
      
      // Call API to update profile
      const updatedUser = await apiService.put('/api/user/profile', data);
      
      if (updatedUser) {
        // Update user data
        const userData = { ...user, ...updatedUser };
        setUser(userData);
        
        // Save updated user data to storage
        await saveUser(userData);
        
        // Send notification
        notificationService.sendSystemNotification(
          'Profile Updated',
          'Your profile has been updated successfully.'
        );
        
        return true;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setError(error.message || 'Failed to update profile');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update password
  const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      setIsLoading(true);
      setError(null);
      
      // Call API to update password
      const response = await apiService.put('/api/user/password', {
        currentPassword,
        newPassword,
      });
      
      if (response && response.success) {
        // Send notification
        notificationService.sendSystemNotification(
          'Password Updated',
          'Your password has been updated successfully.'
        );
        
        return true;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Update password error:', error);
      setError(error.message || 'Failed to update password');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset password
  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call API to reset password
      const response = await apiService.post('/api/auth/reset-password', { email });
      
      if (response && response.success) {
        return true;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError(error.message || 'Failed to reset password');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Provider value
  const value: AuthContextType = {
    user,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updatePassword,
    resetPassword,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};