import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from "react-native";
import { ApiService } from "../services/ApiService";
import { NotificationService } from "../services/NotificationService";

// User types
export interface User {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

// LoginCredentials type
interface LoginCredentials {
  username: string;
  password: string;
}

// RegisterData type
interface RegisterData {
  username: string;
  password: string;
  fullName?: string;
  email?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Services
  const apiService = ApiService.getInstance();
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));

        // Set token in API service
        apiService.setToken(token);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setLoading(true);
      // Implement your login logic here
      const response = await fetch('YOUR_API_URL/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
      
      setIsAuthenticated(true);
      setUser(data.user);

      // Set token in API service
      apiService.setToken(data.token);

      // Show success notification
      notificationService.sendSystemNotification(
        "Login Successful",
        `Welcome back, ${data.user.fullName || data.user.username}!`
      );
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      setIsAuthenticated(false);
      setUser(null);

      // Clear token in API service
      apiService.clearToken();

      // Show success notification
      notificationService.sendSystemNotification("Logout Successful", "You have been logged out.");
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const authContextValue: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
