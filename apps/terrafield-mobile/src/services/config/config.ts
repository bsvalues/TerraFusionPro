import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingsService } from '../settings/settings';
import { ErrorService } from '../error/error';
import { NetworkService } from '../network/network';
import { LoggingService } from '../logging/logging';

interface Config {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  auth: {
    tokenExpiry: number;
    refreshTokenExpiry: number;
    biometricEnabled: boolean;
  };
  sync: {
    interval: number;
    batchSize: number;
    maxRetries: number;
  };
  storage: {
    maxSize: number;
    cleanupInterval: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    maxEntries: number;
    retentionPeriod: number;
  };
  analytics: {
    enabled: boolean;
    sampleRate: number;
    endpoint: string;
  };
  monitoring: {
    enabled: boolean;
    interval: number;
    endpoint: string;
  };
}

interface ConfigUpdate {
  path: string[];
  value: any;
}

export class ConfigService {
  private static instance: ConfigService;
  private settingsService: SettingsService;
  private errorService: ErrorService;
  private networkService: NetworkService;
  private loggingService: LoggingService;
  private config: Config;
  private configListeners: ((config: Config) => void)[] = [];

  private constructor() {
    this.settingsService = SettingsService.getInstance();
    this.errorService = ErrorService.getInstance();
    this.networkService = NetworkService.getInstance();
    this.loggingService = LoggingService.getInstance();
    this.config = this.getDefaultConfig();
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private getDefaultConfig(): Config {
    return {
      api: {
        baseUrl: 'https://api.terrafield.com', // TODO: Get from environment
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
      },
      auth: {
        tokenExpiry: 3600,
        refreshTokenExpiry: 604800,
        biometricEnabled: true,
      },
      sync: {
        interval: 300000,
        batchSize: 100,
        maxRetries: 3,
      },
      storage: {
        maxSize: 100 * 1024 * 1024, // 100MB
        cleanupInterval: 3600000, // 1 hour
      },
      logging: {
        level: 'info',
        maxEntries: 1000,
        retentionPeriod: 604800000, // 7 days
      },
      analytics: {
        enabled: true,
        sampleRate: 1.0,
        endpoint: 'https://analytics.terrafield.com', // TODO: Get from environment
      },
      monitoring: {
        enabled: true,
        interval: 60000,
        endpoint: 'https://monitoring.terrafield.com', // TODO: Get from environment
      },
    };
  }

  async initialize(): Promise<void> {
    try {
      await this.loadConfig();
      await this.validateConfig();
    } catch (error) {
      console.error('Failed to initialize config service:', error);
      throw error;
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('@app_config');
      if (data) {
        const savedConfig = JSON.parse(data);
        this.config = { ...this.getDefaultConfig(), ...savedConfig };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      throw error;
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem('@app_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  private async validateConfig(): Promise<void> {
    try {
      // Validate required fields
      const requiredFields = [
        'api.baseUrl',
        'auth.tokenExpiry',
        'sync.interval',
        'storage.maxSize',
        'logging.level',
        'analytics.endpoint',
        'monitoring.endpoint',
      ];

      for (const field of requiredFields) {
        const value = this.getConfigValue(field.split('.'));
        if (value === undefined) {
          throw new Error(`Missing required config field: ${field}`);
        }
      }

      // Validate value types and ranges
      if (this.config.api.timeout < 0) {
        throw new Error('API timeout must be positive');
      }

      if (this.config.auth.tokenExpiry <= 0) {
        throw new Error('Token expiry must be positive');
      }

      if (this.config.sync.interval < 0) {
        throw new Error('Sync interval must be positive');
      }

      if (this.config.storage.maxSize <= 0) {
        throw new Error('Storage max size must be positive');
      }

      if (this.config.analytics.sampleRate < 0 || this.config.analytics.sampleRate > 1) {
        throw new Error('Analytics sample rate must be between 0 and 1');
      }

      if (this.config.monitoring.interval < 0) {
        throw new Error('Monitoring interval must be positive');
      }
    } catch (error) {
      console.error('Failed to validate config:', error);
      throw error;
    }
  }

  getConfig(): Config {
    return { ...this.config };
  }

  getConfigValue(path: string[]): any {
    try {
      let value: any = this.config;
      for (const key of path) {
        value = value[key];
        if (value === undefined) {
          return undefined;
        }
      }
      return value;
    } catch (error) {
      console.error('Failed to get config value:', error);
      return undefined;
    }
  }

  async updateConfig(updates: ConfigUpdate[]): Promise<void> {
    try {
      for (const update of updates) {
        let current: any = this.config;
        for (let i = 0; i < update.path.length - 1; i++) {
          current = current[update.path[i]];
        }
        current[update.path[update.path.length - 1]] = update.value;
      }

      await this.validateConfig();
      await this.saveConfig();
      this.notifyConfigListeners();
    } catch (error) {
      console.error('Failed to update config:', error);
      throw error;
    }
  }

  async resetConfig(): Promise<void> {
    try {
      this.config = this.getDefaultConfig();
      await this.saveConfig();
      this.notifyConfigListeners();
    } catch (error) {
      console.error('Failed to reset config:', error);
      throw error;
    }
  }

  addConfigListener(listener: (config: Config) => void): void {
    this.configListeners.push(listener);
  }

  removeConfigListener(listener: (config: Config) => void): void {
    this.configListeners = this.configListeners.filter(l => l !== listener);
  }

  private notifyConfigListeners(): void {
    const config = this.getConfig();
    this.configListeners.forEach(listener => listener(config));
  }

  async exportConfig(): Promise<string> {
    try {
      return JSON.stringify(this.config, null, 2);
    } catch (error) {
      console.error('Failed to export config:', error);
      throw error;
    }
  }

  async importConfig(configString: string): Promise<void> {
    try {
      const importedConfig = JSON.parse(configString);
      this.config = { ...this.getDefaultConfig(), ...importedConfig };
      await this.validateConfig();
      await this.saveConfig();
      this.notifyConfigListeners();
    } catch (error) {
      console.error('Failed to import config:', error);
      throw error;
    }
  }
} 