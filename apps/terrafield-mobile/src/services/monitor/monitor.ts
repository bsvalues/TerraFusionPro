import { ServiceLoggerImpl } from '../logger/logger';
import { ServiceMetricsImpl } from '../metrics/metrics';
import { ServiceAnalyzerImpl } from '../analyzer/analyzer';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface MonitorConfig {
  interval: number;
  retention: number;
  maxSamples: number;
  thresholds: {
    cpu: number;
    memory: number;
    heap: number;
    eventLoop: number;
    gc: number;
  };
}

interface MonitorSample {
  timestamp: number;
  metrics: {
    cpu: number;
    memory: number;
    heap: number;
    eventLoop: number;
    gc: number;
  };
  services: Map<string, {
    status: string;
    health: number;
    performance: number;
    reliability: number;
  }>;
}

interface ServiceMonitor {
  initialize(): Promise<void>;
  startMonitoring(): void;
  stopMonitoring(): void;
  getSamples(): MonitorSample[];
  getLatestSample(): MonitorSample;
  getServiceStatus(serviceId: string): {
    status: string;
    health: number;
    performance: number;
    reliability: number;
  };
  onSample(listener: (sample: MonitorSample) => void): void;
  offSample(listener: (sample: MonitorSample) => void): void;
}

export class ServiceMonitorImpl implements ServiceMonitor {
  private static instance: ServiceMonitorImpl;
  private logger: ServiceLoggerImpl;
  private metrics: ServiceMetricsImpl;
  private analyzer: ServiceAnalyzerImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private samples: MonitorSample[] = [];
  private config: MonitorConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.logger = ServiceLoggerImpl.getInstance();
    this.metrics = ServiceMetricsImpl.getInstance();
    this.analyzer = ServiceAnalyzerImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
    this.config = {
      interval: 5000,
      retention: 3600000,
      maxSamples: 1000,
      thresholds: {
        cpu: 80,
        memory: 80,
        heap: 80,
        eventLoop: 100,
        gc: 1000,
      },
    };
  }

  static getInstance(): ServiceMonitorImpl {
    if (!ServiceMonitorImpl.instance) {
      ServiceMonitorImpl.instance = new ServiceMonitorImpl();
    }
    return ServiceMonitorImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeMonitor();
    await this.initializationPromise;
  }

  private async initializeMonitor(): Promise<void> {
    try {
      await this.logger.initialize();
      await this.metrics.initialize();
      await this.analyzer.initialize();
    } catch (error) {
      console.error('Failed to initialize service monitor:', error);
      throw error;
    }
  }

  private emitSample(sample: MonitorSample): void {
    this.eventEmitter.emit('sample', sample);
  }

  private async collectSample(): Promise<MonitorSample> {
    const timestamp = Date.now();
    const metrics = await this.collectMetrics();
    const services = await this.collectServiceStatus();

    const sample: MonitorSample = {
      timestamp,
      metrics,
      services,
    };

    this.samples.push(sample);
    if (this.samples.length > this.config.maxSamples) {
      this.samples = this.samples.slice(-this.config.maxSamples);
    }

    this.emitSample(sample);
    return sample;
  }

  private async collectMetrics(): Promise<MonitorSample['metrics']> {
    const cpu = await this.metrics.getMetric('cpu_usage');
    const memory = await this.metrics.getMetric('memory_usage');
    const heap = await this.metrics.getMetric('heap_usage');
    const eventLoop = await this.metrics.getMetric('event_loop_lag');
    const gc = await this.metrics.getMetric('gc_duration');

    return {
      cpu: cpu?.value || 0,
      memory: memory?.value || 0,
      heap: heap?.value || 0,
      eventLoop: eventLoop?.value || 0,
      gc: gc?.value || 0,
    };
  }

  private async collectServiceStatus(): Promise<MonitorSample['services']> {
    const services = new Map();
    const registeredServices = this.registry.getServices();

    for (const service of registeredServices) {
      const health = await this.analyzer.getHealthScore(service.id);
      const performance = await this.analyzer.getPerformanceScore(service.id);
      const reliability = await this.analyzer.getReliabilityScore(service.id);

      services.set(service.id, {
        status: service.status,
        health,
        performance,
        reliability,
      });
    }

    return services;
  }

  private checkThresholds(sample: MonitorSample): void {
    const { metrics, thresholds } = this.config;

    if (sample.metrics.cpu > thresholds.cpu) {
      this.logger.warn('High CPU usage detected', {
        cpu: sample.metrics.cpu,
        threshold: thresholds.cpu,
      });
    }

    if (sample.metrics.memory > thresholds.memory) {
      this.logger.warn('High memory usage detected', {
        memory: sample.metrics.memory,
        threshold: thresholds.memory,
      });
    }

    if (sample.metrics.heap > thresholds.heap) {
      this.logger.warn('High heap usage detected', {
        heap: sample.metrics.heap,
        threshold: thresholds.heap,
      });
    }

    if (sample.metrics.eventLoop > thresholds.eventLoop) {
      this.logger.warn('High event loop lag detected', {
        eventLoop: sample.metrics.eventLoop,
        threshold: thresholds.eventLoop,
      });
    }

    if (sample.metrics.gc > thresholds.gc) {
      this.logger.warn('High GC duration detected', {
        gc: sample.metrics.gc,
        threshold: thresholds.gc,
      });
    }
  }

  startMonitoring(): void {
    if (this.monitoringInterval) {
      return;
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        const sample = await this.collectSample();
        this.checkThresholds(sample);
      } catch (error) {
        this.logger.error('Failed to collect monitor sample', error);
      }
    }, this.config.interval);

    this.logger.info('Started service monitoring', {
      interval: this.config.interval,
    });
  }

  stopMonitoring(): void {
    if (!this.monitoringInterval) {
      return;
    }

    clearInterval(this.monitoringInterval);
    this.monitoringInterval = null;

    this.logger.info('Stopped service monitoring');
  }

  getSamples(): MonitorSample[] {
    return [...this.samples];
  }

  getLatestSample(): MonitorSample {
    if (this.samples.length === 0) {
      throw new Error('No samples available');
    }
    return this.samples[this.samples.length - 1];
  }

  getServiceStatus(serviceId: string): {
    status: string;
    health: number;
    performance: number;
    reliability: number;
  } {
    const latestSample = this.getLatestSample();
    const serviceStatus = latestSample.services.get(serviceId);

    if (!serviceStatus) {
      throw new Error(`Service ${serviceId} not found`);
    }

    return serviceStatus;
  }

  onSample(listener: (sample: MonitorSample) => void): void {
    this.eventEmitter.on('sample', listener);
  }

  offSample(listener: (sample: MonitorSample) => void): void {
    this.eventEmitter.off('sample', listener);
  }

  setConfig(config: Partial<MonitorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): MonitorConfig {
    return { ...this.config };
  }

  setInterval(interval: number): void {
    this.config.interval = interval;
    if (this.monitoringInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  setRetention(retention: number): void {
    this.config.retention = retention;
  }

  setMaxSamples(maxSamples: number): void {
    this.config.maxSamples = maxSamples;
    if (this.samples.length > maxSamples) {
      this.samples = this.samples.slice(-maxSamples);
    }
  }

  setThresholds(thresholds: Partial<MonitorConfig['thresholds']>): void {
    this.config.thresholds = { ...this.config.thresholds, ...thresholds };
  }

  getMonitorStats(): {
    totalSamples: number;
    oldestSample: number;
    newestSample: number;
    averageMetrics: {
      cpu: number;
      memory: number;
      heap: number;
      eventLoop: number;
      gc: number;
    };
  } {
    if (this.samples.length === 0) {
      return {
        totalSamples: 0,
        oldestSample: 0,
        newestSample: 0,
        averageMetrics: {
          cpu: 0,
          memory: 0,
          heap: 0,
          eventLoop: 0,
          gc: 0,
        },
      };
    }

    const oldestSample = this.samples[0];
    const newestSample = this.samples[this.samples.length - 1];

    const averageMetrics = {
      cpu: 0,
      memory: 0,
      heap: 0,
      eventLoop: 0,
      gc: 0,
    };

    for (const sample of this.samples) {
      averageMetrics.cpu += sample.metrics.cpu;
      averageMetrics.memory += sample.metrics.memory;
      averageMetrics.heap += sample.metrics.heap;
      averageMetrics.eventLoop += sample.metrics.eventLoop;
      averageMetrics.gc += sample.metrics.gc;
    }

    const count = this.samples.length;
    averageMetrics.cpu /= count;
    averageMetrics.memory /= count;
    averageMetrics.heap /= count;
    averageMetrics.eventLoop /= count;
    averageMetrics.gc /= count;

    return {
      totalSamples: this.samples.length,
      oldestSample: oldestSample.timestamp,
      newestSample: newestSample.timestamp,
      averageMetrics,
    };
  }

  clearSamples(): void {
    this.samples = [];
  }
} 