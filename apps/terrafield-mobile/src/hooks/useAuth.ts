import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../services/ApiService';

// User interface
export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'appraiser' | 'reviewer';
  created_at?: string;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<boolean>;
}

// Register data interface
interface RegisterData {
  username: string;
  password: string;
  name: string;
  email: string;
  role?: 'admin' | 'appraiser' | 'reviewer';
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Local storage key
const USER_STORAGE_KEY = 'terrafield_user';

// Auth provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const apiService = ApiService.getInstance();

  // Load user from storage on mount
  useEffect(() => {
    loadUser();
  }, []);

  // Load user from storage
  const loadUser = async () => {
    try {
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      
      if (userJson) {
        const userData = JSON.parse(userJson);
        setUser(userData);
      }
    } catch (err) {
      console.error('Error loading user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save user to storage
  const saveUser = async (userData: User) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } catch (err) {
      console.error('Error saving user:', err);
    }
  };

  // Clear user from storage
  const clearUser = async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    } catch (err) {
      console.error('Error clearing user:', err);
    }
  };

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.post('/api/auth/login', { username, password });
      
      if (response && response.id) {
        const userData: User = {
          id: response.id,
          username: response.username,
          name: response.name || username,
          email: response.email || '',
          role: response.role || 'appraiser',
          created_at: response.created_at,
        };
        
        setUser(userData);
        saveUser(userData);
        
        // Set token in ApiService
        if (response.token) {
          apiService.setToken(response.token);
        }
        
        return true;
      } else {
        setError('Invalid response from server');
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Call logout API if connected
      if (apiService.isAuthenticated()) {
        await apiService.post('/api/auth/logout');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear token in ApiService
      apiService.clearToken();
      
      // Clear user state and storage
      setUser(null);
      await clearUser();
      
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.post('/api/users', userData);
      
      if (response && response.id) {
        const newUser: User = {
          id: response.id,
          username: response.username,
          name: response.name || userData.username,
          email: response.email || userData.email,
          role: response.role || 'appraiser',
          created_at: response.created_at,
        };
        
        setUser(newUser);
        saveUser(newUser);
        
        // Set token in ApiService
        if (response.token) {
          apiService.setToken(response.token);
        }
        
        return true;
      } else {
        setError('Invalid response from server');
        return false;
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};