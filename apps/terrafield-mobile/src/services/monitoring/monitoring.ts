import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingsService } from '../settings/settings';
import { ErrorService } from '../error/error';
import { NetworkService } from '../network/network';
import { AnalyticsService } from '../analytics/analytics';

interface Metric {
  id: string;
  name: string;
  value: number;
  timestamp: string;
  tags: Record<string, string>;
}

interface PerformanceData {
  cpu: number;
  memory: number;
  battery: number;
  network: {
    type: string;
    strength: number;
  };
  storage: {
    used: number;
    total: number;
  };
}

interface MonitoringConfig {
  interval: number;
  endpoint: string;
  maxMetrics: number;
  retentionPeriod: number;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private settingsService: SettingsService;
  private errorService: ErrorService;
  private networkService: NetworkService;
  private analyticsService: AnalyticsService;
  private config: MonitoringConfig;
  private metrics: Metric[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.settingsService = SettingsService.getInstance();
    this.errorService = ErrorService.getInstance();
    this.networkService = NetworkService.getInstance();
    this.analyticsService = AnalyticsService.getInstance();
    this.config = {
      interval: 60 * 1000, // 1 minute
      endpoint: 'https://monitoring.terrafield.com', // TODO: Get from environment
      maxMetrics: 1000,
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.loadMetrics();
      await this.startMonitoring();
    } catch (error) {
      console.error('Failed to initialize monitoring service:', error);
      throw error;
    }
  }

  private async loadMetrics(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('@monitoring_metrics');
      if (data) {
        this.metrics = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
      throw error;
    }
  }

  private async saveMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem('@monitoring_metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Failed to save metrics:', error);
      throw error;
    }
  }

  private async startMonitoring(): Promise<void> {
    try {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
      }

      this.monitoringInterval = setInterval(
        () => this.collectMetrics(),
        this.config.interval
      );
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      throw error;
    }
  }

  private async collectMetrics(): Promise<void> {
    try {
      const performanceData = await this.getPerformanceData();
      await this.recordMetrics(performanceData);
      await this.cleanupOldMetrics();
    } catch (error) {
      console.error('Failed to collect metrics:', error);
      throw error;
    }
  }

  private async getPerformanceData(): Promise<PerformanceData> {
    try {
      // TODO: Implement actual performance data collection
      return {
        cpu: 0,
        memory: 0,
        battery: 0,
        network: {
          type: 'unknown',
          strength: 0,
        },
        storage: {
          used: 0,
          total: 0,
        },
      };
    } catch (error) {
      console.error('Failed to get performance data:', error);
      throw error;
    }
  }

  private async recordMetrics(data: PerformanceData): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const metrics: Metric[] = [
        {
          id: this.generateId(),
          name: 'cpu_usage',
          value: data.cpu,
          timestamp,
          tags: { type: 'system' },
        },
        {
          id: this.generateId(),
          name: 'memory_usage',
          value: data.memory,
          timestamp,
          tags: { type: 'system' },
        },
        {
          id: this.generateId(),
          name: 'battery_level',
          value: data.battery,
          timestamp,
          tags: { type: 'system' },
        },
        {
          id: this.generateId(),
          name: 'network_strength',
          value: data.network.strength,
          timestamp,
          tags: { type: 'network', networkType: data.network.type },
        },
        {
          id: this.generateId(),
          name: 'storage_usage',
          value: data.storage.used,
          timestamp,
          tags: { type: 'storage' },
        },
      ];

      this.metrics.push(...metrics);
      await this.saveMetrics();
      await this.sendMetrics(metrics);
    } catch (error) {
      console.error('Failed to record metrics:', error);
      throw error;
    }
  }

  private async cleanupOldMetrics(): Promise<void> {
    try {
      const cutoff = new Date().getTime() - this.config.retentionPeriod;
      this.metrics = this.metrics.filter(
        metric => new Date(metric.timestamp).getTime() > cutoff
      );
      await this.saveMetrics();
    } catch (error) {
      console.error('Failed to cleanup old metrics:', error);
      throw error;
    }
  }

  private async sendMetrics(metrics: Metric[]): Promise<void> {
    try {
      const isConnected = await this.networkService.isConnected();
      if (!isConnected) return;

      await this.networkService.request(this.config.endpoint, {
        method: 'POST',
        body: { metrics },
      });
    } catch (error) {
      console.error('Failed to send metrics:', error);
      throw error;
    }
  }

  async getMetrics(): Promise<Metric[]> {
    try {
      return [...this.metrics];
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return [];
    }
  }

  async getMetricsByType(type: string): Promise<Metric[]> {
    try {
      return this.metrics.filter(metric => metric.tags.type === type);
    } catch (error) {
      console.error('Failed to get metrics by type:', error);
      return [];
    }
  }

  async getLatestMetrics(): Promise<Metric[]> {
    try {
      return this.metrics
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    } catch (error) {
      console.error('Failed to get latest metrics:', error);
      return [];
    }
  }

  async clearMetrics(): Promise<void> {
    try {
      this.metrics = [];
      await this.saveMetrics();
    } catch (error) {
      console.error('Failed to clear metrics:', error);
      throw error;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
} 