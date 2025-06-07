import { ServiceMonitorImpl } from '../monitor/monitor';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

export interface Metric {
  name: string;
  value?: number;
  values?: {
    [key: string]: number | string | boolean;
  };
  timestamp: number;
  tags?: {
    [key: string]: string;
  };
}

interface MetricConfig {
  retention: number;
  interval: number;
  aggregation: 'min' | 'max' | 'avg' | 'sum' | 'count';
  labels: string[];
}

interface MetricResult {
  name: string;
  type: string;
  value: number;
  timestamp: number;
  labels: Record<string, string>;
}

interface ServiceMetrics {
  initialize(): Promise<void>;
  recordMetric(name: string, value: number, labels?: Record<string, string>): Promise<void>;
  getMetric(name: string): Metric;
  getAllMetrics(): Map<string, Metric>;
  getMetricValue(name: string, labels?: Record<string, string>): number;
  onMetricUpdate(listener: (metric: MetricResult) => void): void;
  offMetricUpdate(listener: (metric: MetricResult) => void): void;
}

export class ServiceMetricsImpl implements ServiceMetrics {
  private static instance: ServiceMetricsImpl;
  private monitor: ServiceMonitorImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private metrics: Map<string, Metric> = new Map();
  private configs: Map<string, MetricConfig> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.monitor = ServiceMonitorImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
  }

  static getInstance(): ServiceMetricsImpl {
    if (!ServiceMetricsImpl.instance) {
      ServiceMetricsImpl.instance = new ServiceMetricsImpl();
    }
    return ServiceMetricsImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeMetrics();
    await this.initializationPromise;
  }

  private async initializeMetrics(): Promise<void> {
    try {
      await this.monitor.initialize();
      this.setupEventListeners();
      this.startCleanupInterval();
    } catch (error) {
      console.error('Failed to initialize service metrics:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    this.monitor.onHealthUpdate((health) => {
      this.updateMetrics(health);
    });
  }

  private updateMetrics(health: Map<string, any>): void {
    for (const [service, serviceHealth] of health) {
      this.recordMetric('service_health', serviceHealth.status === 'error' ? 0 : 1, {
        service,
      });
      this.recordMetric('service_response_time', serviceHealth.metrics?.responseTime || 0, {
        service,
      });
      this.recordMetric('service_error_rate', serviceHealth.metrics?.errorRate || 0, {
        service,
      });
    }
  }

  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        console.error('Failed to cleanup metrics:', error);
      }
    }, 60000);
  }

  private async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [name, metric] of this.metrics) {
      const config = this.getOrCreateConfig(name);
      metric.values = metric.values.filter(
        (value) => now - value.timestamp <= config.retention
      );
    }
  }

  private getOrCreateConfig(name: string): MetricConfig {
    let config = this.configs.get(name);
    if (!config) {
      config = {
        retention: 3600000,
        interval: 60000,
        aggregation: 'avg',
        labels: [],
      };
      this.configs.set(name, config);
    }
    return config;
  }

  private getOrCreateMetric(name: string, type: Metric['type']): Metric {
    let metric = this.metrics.get(name);
    if (!metric) {
      metric = {
        name,
        type,
        description: '',
        values: [],
      };
      this.metrics.set(name, metric);
    }
    return metric;
  }

  private emitMetricUpdate(metric: MetricResult): void {
    this.eventEmitter.emit('metric:update', metric);
  }

  async recordMetric(
    name: string,
    value: number,
    labels: Record<string, string> = {}
  ): Promise<void> {
    const metric = this.getOrCreateMetric(name, 'gauge');
    const now = Date.now();

    const metricValue: MetricValue = {
      value,
      timestamp: now,
      labels,
    };

    metric.values.push(metricValue);
    this.emitMetricUpdate({
      name,
      type: metric.type,
      value,
      timestamp: now,
      labels,
    });

    if (metric.type === 'histogram') {
      this.updateHistogram(metric, value);
    } else if (metric.type === 'summary') {
      this.updateSummary(metric, value);
    }
  }

  private updateHistogram(metric: Metric, value: number): void {
    if (!metric.buckets) {
      metric.buckets = [0.1, 0.5, 1, 2.5, 5, 10];
    }

    for (const bucket of metric.buckets) {
      if (value <= bucket) {
        this.recordMetric(`${metric.name}_bucket`, 1, {
          le: bucket.toString(),
        });
      }
    }

    this.recordMetric(`${metric.name}_sum`, value);
    this.recordMetric(`${metric.name}_count`, 1);
  }

  private updateSummary(metric: Metric, value: number): void {
    if (!metric.quantiles) {
      metric.quantiles = [0.5, 0.9, 0.95, 0.99];
    }

    const values = metric.values.map((v) => v.value).sort((a, b) => a - b);
    for (const quantile of metric.quantiles) {
      const index = Math.floor(values.length * quantile);
      this.recordMetric(`${metric.name}_quantile`, values[index], {
        quantile: quantile.toString(),
      });
    }

    this.recordMetric(`${metric.name}_sum`, value);
    this.recordMetric(`${metric.name}_count`, 1);
  }

  getMetric(name: string): Metric {
    const metric = this.metrics.get(name);
    if (!metric) {
      throw new Error(`Metric ${name} not found`);
    }
    return metric;
  }

  getAllMetrics(): Map<string, Metric> {
    return new Map(this.metrics);
  }

  getMetricValue(
    name: string,
    labels: Record<string, string> = {}
  ): number {
    const metric = this.getMetric(name);
    const config = this.getOrCreateConfig(name);
    const now = Date.now();

    const values = metric.values.filter(
      (value) =>
        now - value.timestamp <= config.retention &&
        this.matchLabels(value.labels, labels)
    );

    if (values.length === 0) {
      return 0;
    }

    switch (config.aggregation) {
      case 'min':
        return Math.min(...values.map((v) => v.value));
      case 'max':
        return Math.max(...values.map((v) => v.value));
      case 'sum':
        return values.reduce((sum, v) => sum + v.value, 0);
      case 'count':
        return values.length;
      case 'avg':
      default:
        return values.reduce((sum, v) => sum + v.value, 0) / values.length;
    }
  }

  private matchLabels(
    valueLabels: Record<string, string>,
    queryLabels: Record<string, string>
  ): boolean {
    return Object.entries(queryLabels).every(
      ([key, value]) => valueLabels[key] === value
    );
  }

  onMetricUpdate(listener: (metric: MetricResult) => void): void {
    this.eventEmitter.on('metric:update', listener);
  }

  offMetricUpdate(listener: (metric: MetricResult) => void): void {
    this.eventEmitter.off('metric:update', listener);
  }

  setConfig(name: string, config: MetricConfig): void {
    this.configs.set(name, config);
  }

  getConfig(name: string): MetricConfig {
    const config = this.configs.get(name);
    if (!config) {
      throw new Error(`No metric config found for ${name}`);
    }
    return config;
  }

  createCounter(name: string, description: string): void {
    const metric = this.getOrCreateMetric(name, 'counter');
    metric.description = description;
  }

  createGauge(name: string, description: string): void {
    const metric = this.getOrCreateMetric(name, 'gauge');
    metric.description = description;
  }

  createHistogram(
    name: string,
    description: string,
    buckets: number[]
  ): void {
    const metric = this.getOrCreateMetric(name, 'histogram');
    metric.description = description;
    metric.buckets = buckets;
  }

  createSummary(
    name: string,
    description: string,
    quantiles: number[]
  ): void {
    const metric = this.getOrCreateMetric(name, 'summary');
    metric.description = description;
    metric.quantiles = quantiles;
  }

  incrementCounter(name: string, labels: Record<string, string> = {}): void {
    this.recordMetric(name, 1, labels);
  }

  decrementCounter(name: string, labels: Record<string, string> = {}): void {
    this.recordMetric(name, -1, labels);
  }

  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    this.recordMetric(name, value, labels);
  }

  observeHistogram(
    name: string,
    value: number,
    labels: Record<string, string> = {}
  ): void {
    this.recordMetric(name, value, labels);
  }

  observeSummary(
    name: string,
    value: number,
    labels: Record<string, string> = {}
  ): void {
    this.recordMetric(name, value, labels);
  }

  getMetricValues(
    name: string,
    labels: Record<string, string> = {}
  ): MetricValue[] {
    const metric = this.getMetric(name);
    const config = this.getOrCreateConfig(name);
    const now = Date.now();

    return metric.values.filter(
      (value) =>
        now - value.timestamp <= config.retention &&
        this.matchLabels(value.labels, labels)
    );
  }

  getMetricStats(name: string): {
    min: number;
    max: number;
    avg: number;
    sum: number;
    count: number;
  } {
    const values = this.getMetricValues(name).map((v) => v.value);
    if (values.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        sum: 0,
        count: 0,
      };
    }

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      sum: values.reduce((sum, v) => sum + v, 0),
      count: values.length,
    };
  }
} 