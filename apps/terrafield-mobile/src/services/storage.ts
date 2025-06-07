import AsyncStorage from '@react-native-async-storage/async-storage';
import { Field } from '../types/field';
import { RootState } from '../store';

const STORAGE_KEYS = {
  FIELDS: '@terrafield/fields',
  SETTINGS: '@terrafield/settings',
  ANALYTICS: '@terrafield/analytics',
};

class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async saveFields(fields: Field[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FIELDS, JSON.stringify(fields));
    } catch (error) {
      console.error('Error saving fields:', error);
      throw error;
    }
  }

  async getFields(): Promise<Field[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FIELDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting fields:', error);
      throw error;
    }
  }

  async saveSettings(settings: RootState['settings']): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  async getSettings(): Promise<RootState['settings'] | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  }

  async saveAnalytics(analytics: RootState['analytics']): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
    } catch (error) {
      console.error('Error saving analytics:', error);
      throw error;
    }
  }

  async getAnalytics(): Promise<RootState['analytics'] | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ANALYTICS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.FIELDS,
        STORAGE_KEYS.SETTINGS,
        STORAGE_KEYS.ANALYTICS,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }
}

export const storageService = StorageService.getInstance(); 