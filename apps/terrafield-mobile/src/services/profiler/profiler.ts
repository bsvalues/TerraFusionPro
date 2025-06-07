import { ServiceLoggerImpl } from '../logger/logger';
import { ServiceMetricsImpl } from '../metrics/metrics';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface ProfileSample {
  timestamp: number;
  cpu: {
    user: number;
    system: number;
    total: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  };
  eventLoop: {
    lag: number;
    utilization: number;
  };
  gc: {
    type: string;
    duration: number;
    before: number;
    after: number;
  };
}

interface ProfileConfig {
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

interface ServiceProfiler {
  initialize(): Promise<void>;
  startProfiling(): void;
  stopProfiling(): void;
  getSamples(): ProfileSample[];
  getLatestSample(): ProfileSample;
  onSample(listener: (sample: ProfileSample) => void): void;
  offSample(listener: (sample: ProfileSample) => void): void;
}

export class ServiceProfilerImpl implements ServiceProfiler {
  private static instance: ServiceProfilerImpl;
  private logger: ServiceLoggerImpl;
  private metrics: ServiceMetricsImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private samples: ProfileSample[] = [];
  private config: ProfileConfig;
  private profilingInterval: NodeJS.Timeout | null = null;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.logger = ServiceLoggerImpl.getInstance();
    this.metrics = ServiceMetricsImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
    this.config = {
      interval: 1000,
      retention: 3600000,
      maxSamples: 3600,
      thresholds: {
        cpu: 80,
        memory: 80,
        heap: 80,
        eventLoop: 100,
        gc: 1000,
      },
    };
  }

  static getInstance(): ServiceProfilerImpl {
    if (!ServiceProfilerImpl.instance) {
      ServiceProfilerImpl.instance = new ServiceProfilerImpl();
    }
    return ServiceProfilerImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeProfiler();
    await this.initializationPromise;
  }

  private async initializeProfiler(): Promise<void> {
    try {
      await this.logger.initialize();
      await this.metrics.initialize();
    } catch (error) {
      console.error('Failed to initialize service profiler:', error);
      throw error;
    }
  }

  private emitSample(sample: ProfileSample): void {
    this.eventEmitter.emit('sample', sample);
  }

  private async collectSample(): Promise<ProfileSample> {
    const timestamp = Date.now();
    const cpu = await this.collectCpuMetrics();
    const memory = await this.collectMemoryMetrics();
    const eventLoop = await this.collectEventLoopMetrics();
    const gc = await this.collectGcMetrics();

    const sample: ProfileSample = {
      timestamp,
      cpu,
      memory,
      eventLoop,
      gc,
    };

    this.samples.push(sample);
    if (this.samples.length > this.config.maxSamples) {
      this.samples = this.samples.slice(-this.config.maxSamples);
    }

    this.emitSample(sample);
    return sample;
  }

  private async collectCpuMetrics(): Promise<ProfileSample['cpu']> {
    const cpuUsage = process.cpuUsage();
    const total = cpuUsage.user + cpuUsage.system;

    return {
      user: cpuUsage.user,
      system: cpuUsage.system,
      total,
    };
  }

  private async collectMemoryMetrics(): Promise<ProfileSample['memory']> {
    const memoryUsage = process.memoryUsage();

    return {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers,
    };
  }

  private async collectEventLoopMetrics(): Promise<ProfileSample['eventLoop']> {
    const start = process.hrtime();
    await new Promise((resolve) => setImmediate(resolve));
    const [seconds, nanoseconds] = process.hrtime(start);
    const lag = seconds * 1000 + nanoseconds / 1000000;

    const utilization = await this.calculateEventLoopUtilization();

    return {
      lag,
      utilization,
    };
  }

  private async calculateEventLoopUtilization(): Promise<number> {
    const start = process.hrtime();
    await new Promise((resolve) => setImmediate(resolve));
    const [seconds, nanoseconds] = process.hrtime(start);
    const idle = seconds * 1000 + nanoseconds / 1000000;

    return Math.max(0, 100 - (idle / this.config.interval) * 100);
  }

  private async collectGcMetrics(): Promise<ProfileSample['gc']> {
    const gcStats = await this.getGcStats();

    return {
      type: gcStats.type,
      duration: gcStats.duration,
      before: gcStats.before,
      after: gcStats.after,
    };
  }

  private async getGcStats(): Promise<{
    type: string;
    duration: number;
    before: number;
    after: number;
  }> {
    // Implement GC stats collection
    return {
      type: 'unknown',
      duration: 0,
      before: 0,
      after: 0,
    };
  }

  private checkThresholds(sample: ProfileSample): void {
    const { thresholds } = this.config;

    if (sample.cpu.total > thresholds.cpu) {
      this.logger.warn('High CPU usage detected', {
        cpu: sample.cpu.total,
        threshold: thresholds.cpu,
      });
    }

    if (sample.memory.heapUsed / sample.memory.heapTotal > thresholds.memory / 100) {
      this.logger.warn('High memory usage detected', {
        memory: (sample.memory.heapUsed / sample.memory.heapTotal) * 100,
        threshold: thresholds.memory,
      });
    }

    if (sample.eventLoop.lag > thresholds.eventLoop) {
      this.logger.warn('High event loop lag detected', {
        lag: sample.eventLoop.lag,
        threshold: thresholds.eventLoop,
      });
    }

    if (sample.gc.duration > thresholds.gc) {
      this.logger.warn('High GC duration detected', {
        duration: sample.gc.duration,
        threshold: thresholds.gc,
      });
    }
  }

  startProfiling(): void {
    if (this.profilingInterval) {
      return;
    }

    this.profilingInterval = setInterval(async () => {
      try {
        const sample = await this.collectSample();
        this.checkThresholds(sample);
      } catch (error) {
        this.logger.error('Failed to collect profile sample', error);
      }
    }, this.config.interval);

    this.logger.info('Started service profiling', {
      interval: this.config.interval,
    });
  }

  stopProfiling(): void {
    if (!this.profilingInterval) {
      return;
    }

    clearInterval(this.profilingInterval);
    this.profilingInterval = null;

    this.logger.info('Stopped service profiling');
  }

  getSamples(): ProfileSample[] {
    return [...this.samples];
  }

  getLatestSample(): ProfileSample {
    if (this.samples.length === 0) {
      throw new Error('No samples available');
    }
    return this.samples[this.samples.length - 1];
  }

  onSample(listener: (sample: ProfileSample) => void): void {
    this.eventEmitter.on('sample', listener);
  }

  offSample(listener: (sample: ProfileSample) => void): void {
    this.eventEmitter.off('sample', listener);
  }

  setConfig(config: Partial<ProfileConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ProfileConfig {
    return { ...this.config };
  }

  setInterval(interval: number): void {
    this.config.interval = interval;
    if (this.profilingInterval) {
      this.stopProfiling();
      this.startProfiling();
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

  setThresholds(thresholds: Partial<ProfileConfig['thresholds']>): void {
    this.config.thresholds = { ...this.config.thresholds, ...thresholds };
  }

  getProfilerStats(): {
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
      averageMetrics.cpu += sample.cpu.total;
      averageMetrics.memory += (sample.memory.heapUsed / sample.memory.heapTotal) * 100;
      averageMetrics.heap += (sample.memory.heapUsed / sample.memory.heapTotal) * 100;
      averageMetrics.eventLoop += sample.eventLoop.lag;
      averageMetrics.gc += sample.gc.duration;
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