import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  units: 'metric' | 'imperial';
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
  map: {
    defaultZoom: number;
    showSatellite: boolean;
    showTraffic: boolean;
  };
  sync: {
    autoSync: boolean;
    syncInterval: number;
    wifiOnly: boolean;
  };
  privacy: {
    locationEnabled: boolean;
    analyticsEnabled: boolean;
    crashReportsEnabled: boolean;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'en',
  units: 'metric',
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
  },
  map: {
    defaultZoom: 15,
    showSatellite: false,
    showTraffic: false,
  },
  sync: {
    autoSync: true,
    syncInterval: 30,
    wifiOnly: true,
  },
  privacy: {
    locationEnabled: true,
    analyticsEnabled: true,
    crashReportsEnabled: true,
  },
};

export class SettingsService {
  private static instance: SettingsService;
  private settingsKey = '@app_settings';
  private settings: AppSettings;

  private constructor() {
    this.settings = DEFAULT_SETTINGS;
  }

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  async initialize(): Promise<void> {
    try {
      const savedSettings = await AsyncStorage.getItem(this.settingsKey);
      if (savedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      } else {
        await this.saveSettings();
      }
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      throw error;
    }
  }

  async getSettings(): Promise<AppSettings> {
    return this.settings;
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...updates };
      await this.saveSettings();
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }

  async resetSettings(): Promise<void> {
    try {
      this.settings = DEFAULT_SETTINGS;
      await this.saveSettings();
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  async getTheme(): Promise<'light' | 'dark' | 'system'> {
    return this.settings.theme;
  }

  async setTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await this.updateSettings({ theme });
  }

  async getLanguage(): Promise<string> {
    return this.settings.language;
  }

  async setLanguage(language: string): Promise<void> {
    await this.updateSettings({ language });
  }

  async getUnits(): Promise<'metric' | 'imperial'> {
    return this.settings.units;
  }

  async setUnits(units: 'metric' | 'imperial'): Promise<void> {
    await this.updateSettings({ units });
  }

  async getNotifications(): Promise<AppSettings['notifications']> {
    return this.settings.notifications;
  }

  async setNotifications(notifications: Partial<AppSettings['notifications']>): Promise<void> {
    await this.updateSettings({
      notifications: { ...this.settings.notifications, ...notifications },
    });
  }

  async getMapSettings(): Promise<AppSettings['map']> {
    return this.settings.map;
  }

  async setMapSettings(map: Partial<AppSettings['map']>): Promise<void> {
    await this.updateSettings({
      map: { ...this.settings.map, ...map },
    });
  }

  async getSyncSettings(): Promise<AppSettings['sync']> {
    return this.settings.sync;
  }

  async setSyncSettings(sync: Partial<AppSettings['sync']>): Promise<void> {
    await this.updateSettings({
      sync: { ...this.settings.sync, ...sync },
    });
  }

  async getPrivacySettings(): Promise<AppSettings['privacy']> {
    return this.settings.privacy;
  }

  async setPrivacySettings(privacy: Partial<AppSettings['privacy']>): Promise<void> {
    await this.updateSettings({
      privacy: { ...this.settings.privacy, ...privacy },
    });
  }

  async exportSettings(): Promise<string> {
    try {
      return JSON.stringify(this.settings, null, 2);
    } catch (error) {
      console.error('Failed to export settings:', error);
      throw error;
    }
  }

  async importSettings(settingsJson: string): Promise<void> {
    try {
      const importedSettings = JSON.parse(settingsJson);
      await this.updateSettings(importedSettings);
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  }

  async clearSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.settingsKey);
      this.settings = DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Failed to clear settings:', error);
      throw error;
    }
  }
} 