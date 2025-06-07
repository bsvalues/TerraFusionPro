import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingsService } from '../settings/settings';
import { ErrorService } from '../error/error';
import { NetworkService } from '../network/network';
import { AnalyticsService } from '../analytics/analytics';

interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  context: Record<string, any>;
  stack?: string;
}

interface LoggingConfig {
  maxEntries: number;
  retentionPeriod: number;
  endpoint: string;
  batchSize: number;
  flushInterval: number;
}

export class LoggingService {
  private static instance: LoggingService;
  private settingsService: SettingsService;
  private errorService: ErrorService;
  private networkService: NetworkService;
  private analyticsService: AnalyticsService;
  private config: LoggingConfig;
  private logs: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.settingsService = SettingsService.getInstance();
    this.errorService = ErrorService.getInstance();
    this.networkService = NetworkService.getInstance();
    this.analyticsService = AnalyticsService.getInstance();
    this.config = {
      maxEntries: 1000,
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      endpoint: 'https://logging.terrafield.com', // TODO: Get from environment
      batchSize: 100,
      flushInterval: 60 * 1000, // 1 minute
    };
  }

  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.loadLogs();
      await this.startFlushInterval();
    } catch (error) {
      console.error('Failed to initialize logging service:', error);
      throw error;
    }
  }

  private async loadLogs(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('@logging_entries');
      if (data) {
        this.logs = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
      throw error;
    }
  }

  private async saveLogs(): Promise<void> {
    try {
      await AsyncStorage.setItem('@logging_entries', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save logs:', error);
      throw error;
    }
  }

  private async startFlushInterval(): Promise<void> {
    try {
      if (this.flushInterval) {
        clearInterval(this.flushInterval);
      }

      this.flushInterval = setInterval(
        () => this.flush(),
        this.config.flushInterval
      );
    } catch (error) {
      console.error('Failed to start flush interval:', error);
      throw error;
    }
  }

  async debug(message: string, context: Record<string, any> = {}): Promise<void> {
    await this.log('debug', message, context);
  }

  async info(message: string, context: Record<string, any> = {}): Promise<void> {
    await this.log('info', message, context);
  }

  async warn(message: string, context: Record<string, any> = {}): Promise<void> {
    await this.log('warn', message, context);
  }

  async error(message: string, error?: Error, context: Record<string, any> = {}): Promise<void> {
    await this.log('error', message, {
      ...context,
      stack: error?.stack,
    });
  }

  private async log(level: LogEntry['level'], message: string, context: Record<string, any> = {}): Promise<void> {
    try {
      const settings = await this.settingsService.getSettings();
      if (!settings.logging) return;

      const entry: LogEntry = {
        id: this.generateId(),
        level,
        message,
        timestamp: new Date().toISOString(),
        context,
      };

      this.logs.push(entry);
      if (this.logs.length >= this.config.maxEntries) {
        await this.cleanupOldLogs();
      }

      if (this.logs.length >= this.config.batchSize) {
        await this.flush();
      }

      await this.saveLogs();
    } catch (error) {
      console.error('Failed to log entry:', error);
      throw error;
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    try {
      const cutoff = new Date().getTime() - this.config.retentionPeriod;
      this.logs = this.logs.filter(
        log => new Date(log.timestamp).getTime() > cutoff
      );
      await this.saveLogs();
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
      throw error;
    }
  }

  private async flush(): Promise<void> {
    try {
      if (this.logs.length === 0) return;

      const isConnected = await this.networkService.isConnected();
      if (!isConnected) return;

      const batch = this.logs.slice(0, this.config.batchSize);
      await this.sendLogs(batch);

      this.logs = this.logs.slice(this.config.batchSize);
      await this.saveLogs();
    } catch (error) {
      console.error('Failed to flush logs:', error);
      throw error;
    }
  }

  private async sendLogs(logs: LogEntry[]): Promise<void> {
    try {
      await this.networkService.request(this.config.endpoint, {
        method: 'POST',
        body: { logs },
      });
    } catch (error) {
      console.error('Failed to send logs:', error);
      throw error;
    }
  }

  async getLogs(): Promise<LogEntry[]> {
    try {
      return [...this.logs];
    } catch (error) {
      console.error('Failed to get logs:', error);
      return [];
    }
  }

  async getLogsByLevel(level: LogEntry['level']): Promise<LogEntry[]> {
    try {
      return this.logs.filter(log => log.level === level);
    } catch (error) {
      console.error('Failed to get logs by level:', error);
      return [];
    }
  }

  async getLatestLogs(count: number = 10): Promise<LogEntry[]> {
    try {
      return this.logs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, count);
    } catch (error) {
      console.error('Failed to get latest logs:', error);
      return [];
    }
  }

  async clearLogs(): Promise<void> {
    try {
      this.logs = [];
      await this.saveLogs();
    } catch (error) {
      console.error('Failed to clear logs:', error);
      throw error;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
} 