import { useState, useEffect, useContext, createContext } from 'react';
import { ApiService } from '../services/ApiService';

// User type
export interface User {
  id: number;
  username: string;
  name: string;
  email?: string;
  role: string;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<boolean>;
}

// Register data type
interface RegisterData {
  username: string;
  password: string;
  name: string;
  email?: string;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const apiService = ApiService.getInstance();

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  // Load user from API or token
  const loadUser = async () => {
    setIsLoading(true);
    try {
      // Try to load token
      const token = await apiService.loadToken();
      
      if (token) {
        // Get user data
        const userData = await apiService.get<User>('/api/user');
        
        if (userData) {
          setUser(userData);
        } else {
          // Token invalid, clear it
          await apiService.clearToken();
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      await apiService.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  // Login user
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.post<{ user: User; token: string }>('/api/auth/login', {
        username,
        password,
      });
      
      if (response && response.token && response.user) {
        await apiService.setToken(response.token);
        setUser(response.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Logout user
  const logout = async (): Promise<void> => {
    try {
      await apiService.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await apiService.clearToken();
      setUser(null);
    }
  };

  // Register user
  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const response = await apiService.post<{ user: User; token: string }>('/api/users', userData);
      
      if (response && response.token && response.user) {
        await apiService.setToken(response.token);
        setUser(response.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  // Provide context value
  const value = {
    user,
    isLoading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Auth hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};