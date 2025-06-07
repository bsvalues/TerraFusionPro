import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';
import { SettingsService } from '../settings/settings';
import { ErrorService } from '../error/error';

interface SecurityConfig {
  encryptionKey: string;
  keychainService: string;
  biometricPrompt: {
    title: string;
    subtitle: string;
    description: string;
    cancel: string;
  };
}

interface BiometricType {
  available: boolean;
  type: 'fingerprint' | 'face' | 'none';
}

export class SecurityService {
  private static instance: SecurityService;
  private settingsService: SettingsService;
  private errorService: ErrorService;
  private config: SecurityConfig;

  private constructor() {
    this.settingsService = SettingsService.getInstance();
    this.errorService = ErrorService.getInstance();
    this.config = {
      encryptionKey: 'terrafield_encryption_key', // TODO: Get from environment
      keychainService: 'com.terrafield.app',
      biometricPrompt: {
        title: 'Authentication Required',
        subtitle: 'Please authenticate to continue',
        description: 'Use your biometric to authenticate',
        cancel: 'Cancel',
      },
    };
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.checkBiometricAvailability();
    } catch (error) {
      console.error('Failed to initialize security service:', error);
      throw error;
    }
  }

  private async checkBiometricAvailability(): Promise<void> {
    try {
      const biometrics = await Keychain.getSupportedBiometryType();
      if (!biometrics) {
        await this.errorService.logWarning('Biometric authentication not available');
      }
    } catch (error) {
      console.error('Failed to check biometric availability:', error);
      throw error;
    }
  }

  async getBiometricType(): Promise<BiometricType> {
    try {
      const type = await Keychain.getSupportedBiometryType();
      return {
        available: !!type,
        type: type || 'none',
      };
    } catch (error) {
      console.error('Failed to get biometric type:', error);
      return {
        available: false,
        type: 'none',
      };
    }
  }

  async setSecureItem(key: string, value: string): Promise<void> {
    try {
      await Keychain.setGenericPassword(key, value, {
        service: this.config.keychainService,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      });
    } catch (error) {
      console.error('Failed to set secure item:', error);
      throw error;
    }
  }

  async getSecureItem(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword(this.config.keychainService);
      if (credentials && credentials.username === key) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error('Failed to get secure item:', error);
      return null;
    }
  }

  async removeSecureItem(key: string): Promise<void> {
    try {
      await Keychain.resetGenericPassword(this.config.keychainService);
    } catch (error) {
      console.error('Failed to remove secure item:', error);
      throw error;
    }
  }

  async authenticateWithBiometrics(): Promise<boolean> {
    try {
      const biometrics = await this.getBiometricType();
      if (!biometrics.available) {
        throw new Error('Biometric authentication not available');
      }

      const result = await Keychain.authenticate(
        this.config.biometricPrompt.title,
        this.config.biometricPrompt
      );

      return result;
    } catch (error) {
      console.error('Failed to authenticate with biometrics:', error);
      return false;
    }
  }

  async encryptData(data: string): Promise<string> {
    try {
      // TODO: Implement proper encryption
      return btoa(data);
    } catch (error) {
      console.error('Failed to encrypt data:', error);
      throw error;
    }
  }

  async decryptData(encryptedData: string): Promise<string> {
    try {
      // TODO: Implement proper decryption
      return atob(encryptedData);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      throw error;
    }
  }

  async hashData(data: string): Promise<string> {
    try {
      // TODO: Implement proper hashing
      return data;
    } catch (error) {
      console.error('Failed to hash data:', error);
      throw error;
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      // TODO: Implement proper token validation
      return !!token;
    } catch (error) {
      console.error('Failed to validate token:', error);
      return false;
    }
  }

  async generateToken(): Promise<string> {
    try {
      // TODO: Implement proper token generation
      return Math.random().toString(36).substring(2);
    } catch (error) {
      console.error('Failed to generate token:', error);
      throw error;
    }
  }

  async clearSecureStorage(): Promise<void> {
    try {
      await Keychain.resetGenericPassword(this.config.keychainService);
      const keys = await AsyncStorage.getAllKeys();
      const secureKeys = keys.filter(key => key.startsWith('@secure_'));
      await AsyncStorage.multiRemove(secureKeys);
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
      throw error;
    }
  }

  async isDeviceSecure(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // TODO: Implement Android device security check
        return true;
      } else if (Platform.OS === 'ios') {
        // TODO: Implement iOS device security check
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to check device security:', error);
      return false;
    }
  }

  async getDeviceSecurityInfo(): Promise<Record<string, any>> {
    try {
      return {
        platform: Platform.OS,
        version: Platform.Version,
        isSecure: await this.isDeviceSecure(),
        biometrics: await this.getBiometricType(),
      };
    } catch (error) {
      console.error('Failed to get device security info:', error);
      throw error;
    }
  }
} 