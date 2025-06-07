import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../types/user';
import { ApiIntegrationService } from '../api/integration';

export class AuthService {
  private static instance: AuthService;
  private apiService: ApiIntegrationService;
  private tokenKey = '@auth_token';
  private userKey = '@auth_user';

  private constructor() {
    this.apiService = ApiIntegrationService.getInstance();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const response = await fetch(`${this.apiService.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const { token, user } = await response.json();
      await this.setAuthData(token, user);
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const response = await fetch(`${this.apiService.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const { token, user } = await response.json();
      await this.setAuthData(token, user);
      return user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.tokenKey, this.userKey]);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.userKey);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(this.tokenKey);
      return !!token;
    } catch (error) {
      console.error('Failed to check authentication status:', error);
      return false;
    }
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const updatedUser = await this.apiService.updateUser(currentUser.id, userData);
      await AsyncStorage.setItem(this.userKey, JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiService.baseUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem(this.tokenKey)}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        throw new Error('Password change failed');
      }
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiService.baseUrl}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Password reset request failed');
      }
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiService.baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!response.ok) {
        throw new Error('Password reset failed');
      }
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }

  private async setAuthData(token: string, user: User): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [this.tokenKey, token],
        [this.userKey, JSON.stringify(user)],
      ]);
      this.apiService.setApiKey(token);
    } catch (error) {
      console.error('Failed to set auth data:', error);
      throw error;
    }
  }
} 