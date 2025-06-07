import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingsService } from '../settings/settings';

interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  timestamp: string;
  type: 'error' | 'warning' | 'info';
  metadata?: Record<string, any>;
}

interface ErrorReport {
  id: string;
  logs: ErrorLog[];
  deviceInfo: {
    platform: string;
    version: string;
    model: string;
    appVersion: string;
  };
  timestamp: string;
  status: 'pending' | 'sent' | 'failed';
}

export class ErrorService {
  private static instance: ErrorService;
  private settingsService: SettingsService;
  private logsKey = '@error_logs';
  private reportsKey = '@error_reports';
  private maxLogs = 1000;
  private maxReports = 100;

  private constructor() {
    this.settingsService = SettingsService.getInstance();
  }

  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Set up global error handlers
      if (Platform.OS === 'web') {
        window.onerror = (message, source, lineno, colno, error) => {
          this.logError(error || new Error(message as string), {
            source,
            lineno,
            colno,
          });
        };
      }

      // Set up unhandled promise rejection handler
      window.onunhandledrejection = (event) => {
        this.logError(event.reason, { type: 'unhandledRejection' });
      };

      // Set up React error boundary
      // TODO: Implement React error boundary
    } catch (error) {
      console.error('Failed to initialize error service:', error);
      throw error;
    }
  }

  async logError(error: Error, metadata?: Record<string, any>): Promise<void> {
    try {
      const log: ErrorLog = {
        id: this.generateId(),
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        type: 'error',
        metadata,
      };

      await this.saveLog(log);
      await this.checkAndCreateReport();
    } catch (err) {
      console.error('Failed to log error:', err);
    }
  }

  async logWarning(message: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const log: ErrorLog = {
        id: this.generateId(),
        message,
        timestamp: new Date().toISOString(),
        type: 'warning',
        metadata,
      };

      await this.saveLog(log);
    } catch (error) {
      console.error('Failed to log warning:', error);
    }
  }

  async logInfo(message: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const log: ErrorLog = {
        id: this.generateId(),
        message,
        timestamp: new Date().toISOString(),
        type: 'info',
        metadata,
      };

      await this.saveLog(log);
    } catch (error) {
      console.error('Failed to log info:', error);
    }
  }

  private async saveLog(log: ErrorLog): Promise<void> {
    try {
      const logs = await this.getLogs();
      logs.unshift(log);

      // Keep only the most recent logs
      if (logs.length > this.maxLogs) {
        logs.length = this.maxLogs;
      }

      await AsyncStorage.setItem(this.logsKey, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save log:', error);
      throw error;
    }
  }

  async getLogs(): Promise<ErrorLog[]> {
    try {
      const data = await AsyncStorage.getItem(this.logsKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get logs:', error);
      return [];
    }
  }

  async clearLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.logsKey);
    } catch (error) {
      console.error('Failed to clear logs:', error);
      throw error;
    }
  }

  private async checkAndCreateReport(): Promise<void> {
    try {
      const settings = await this.settingsService.getSettings();
      if (!settings.errorReporting) return;

      const logs = await this.getLogs();
      const recentErrors = logs.filter(
        log => log.type === 'error' &&
        new Date(log.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
      );

      if (recentErrors.length >= 5) {
        await this.createReport(recentErrors);
      }
    } catch (error) {
      console.error('Failed to check and create report:', error);
    }
  }

  private async createReport(logs: ErrorLog[]): Promise<void> {
    try {
      const report: ErrorReport = {
        id: this.generateId(),
        logs,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version.toString(),
          model: Platform.constants.Model || 'unknown',
          appVersion: '1.0.0', // TODO: Get from app config
        },
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      await this.saveReport(report);
      await this.sendReport(report);
    } catch (error) {
      console.error('Failed to create report:', error);
    }
  }

  private async saveReport(report: ErrorReport): Promise<void> {
    try {
      const reports = await this.getReports();
      reports.unshift(report);

      // Keep only the most recent reports
      if (reports.length > this.maxReports) {
        reports.length = this.maxReports;
      }

      await AsyncStorage.setItem(this.reportsKey, JSON.stringify(reports));
    } catch (error) {
      console.error('Failed to save report:', error);
      throw error;
    }
  }

  async getReports(): Promise<ErrorReport[]> {
    try {
      const data = await AsyncStorage.getItem(this.reportsKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get reports:', error);
      return [];
    }
  }

  async clearReports(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.reportsKey);
    } catch (error) {
      console.error('Failed to clear reports:', error);
      throw error;
    }
  }

  private async sendReport(report: ErrorReport): Promise<void> {
    try {
      // TODO: Implement report sending to backend
      report.status = 'sent';
      await this.saveReport(report);
    } catch (error) {
      console.error('Failed to send report:', error);
      report.status = 'failed';
      await this.saveReport(report);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
} 