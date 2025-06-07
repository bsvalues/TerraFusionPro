import { ServiceMetricsImpl } from '../metrics/metrics';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  service: string;
  traceId?: string;
  spanId?: string;
  labels: Record<string, string>;
  error?: Error;
}

interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  retention: number;
  maxSize: number;
  labels: Record<string, string>;
}

interface ServiceLogger {
  initialize(): Promise<void>;
  debug(message: string, labels?: Record<string, string>): void;
  info(message: string, labels?: Record<string, string>): void;
  warn(message: string, labels?: Record<string, string>): void;
  error(message: string, error?: Error, labels?: Record<string, string>): void;
  getLogs(level?: string, service?: string): LogEntry[];
  onLog(listener: (entry: LogEntry) => void): void;
  offLog(listener: (entry: LogEntry) => void): void;
}

export class ServiceLoggerImpl implements ServiceLogger {
  private static instance: ServiceLoggerImpl;
  private metrics: ServiceMetricsImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private logs: LogEntry[] = [];
  private config: LogConfig;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.metrics = ServiceMetricsImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
    this.config = {
      level: 'info',
      format: 'json',
      retention: 86400000,
      maxSize: 10000,
      labels: {},
    };
  }

  static getInstance(): ServiceLoggerImpl {
    if (!ServiceLoggerImpl.instance) {
      ServiceLoggerImpl.instance = new ServiceLoggerImpl();
    }
    return ServiceLoggerImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeLogger();
    await this.initializationPromise;
  }

  private async initializeLogger(): Promise<void> {
    try {
      await this.metrics.initialize();
      this.setupMetrics();
      this.cleanup();
    } catch (error) {
      console.error('Failed to initialize service logger:', error);
      throw error;
    }
  }

  private setupMetrics(): void {
    this.metrics.createCounter('log_entries_total', 'Total number of log entries');
    this.metrics.createCounter('log_errors_total', 'Total number of error log entries');
  }

  private cleanup(): void {
    const now = Date.now();
    this.logs = this.logs.filter(
      (entry) => now - entry.timestamp <= this.config.retention
    );

    if (this.logs.length > this.config.maxSize) {
      this.logs = this.logs.slice(-this.config.maxSize);
    }
  }

  private emitLog(entry: LogEntry): void {
    this.eventEmitter.emit('log', entry);
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    labels: Record<string, string> = {},
    error?: Error
  ): LogEntry {
    const service = this.registry.getCurrentService();
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();

    return {
      level,
      message,
      timestamp: Date.now(),
      service,
      traceId,
      spanId,
      labels: { ...this.config.labels, ...labels },
      error,
    };
  }

  private generateTraceId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private generateSpanId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  private formatLogEntry(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify(entry);
    }

    const timestamp = new Date(entry.timestamp).toISOString();
    const labels = Object.entries(entry.labels)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');

    return `[${timestamp}] ${entry.level.toUpperCase()} ${entry.service}: ${entry.message} ${
      labels ? `(${labels})` : ''
    }${entry.error ? `\n${entry.error.stack}` : ''}`;
  }

  debug(message: string, labels: Record<string, string> = {}): void {
    if (this.config.level === 'debug') {
      const entry = this.createLogEntry('debug', message, labels);
      this.logs.push(entry);
      this.emitLog(entry);
      this.metrics.incrementCounter('log_entries_total', {
        level: 'debug',
        service: entry.service,
      });
      console.debug(this.formatLogEntry(entry));
    }
  }

  info(message: string, labels: Record<string, string> = {}): void {
    if (['debug', 'info'].includes(this.config.level)) {
      const entry = this.createLogEntry('info', message, labels);
      this.logs.push(entry);
      this.emitLog(entry);
      this.metrics.incrementCounter('log_entries_total', {
        level: 'info',
        service: entry.service,
      });
      console.info(this.formatLogEntry(entry));
    }
  }

  warn(message: string, labels: Record<string, string> = {}): void {
    if (['debug', 'info', 'warn'].includes(this.config.level)) {
      const entry = this.createLogEntry('warn', message, labels);
      this.logs.push(entry);
      this.emitLog(entry);
      this.metrics.incrementCounter('log_entries_total', {
        level: 'warn',
        service: entry.service,
      });
      console.warn(this.formatLogEntry(entry));
    }
  }

  error(
    message: string,
    error?: Error,
    labels: Record<string, string> = {}
  ): void {
    if (['debug', 'info', 'warn', 'error'].includes(this.config.level)) {
      const entry = this.createLogEntry('error', message, labels, error);
      this.logs.push(entry);
      this.emitLog(entry);
      this.metrics.incrementCounter('log_entries_total', {
        level: 'error',
        service: entry.service,
      });
      this.metrics.incrementCounter('log_errors_total', {
        service: entry.service,
      });
      console.error(this.formatLogEntry(entry));
    }
  }

  getLogs(level?: string, service?: string): LogEntry[] {
    return this.logs.filter(
      (entry) =>
        (!level || entry.level === level) &&
        (!service || entry.service === service)
    );
  }

  onLog(listener: (entry: LogEntry) => void): void {
    this.eventEmitter.on('log', listener);
  }

  offLog(listener: (entry: LogEntry) => void): void {
    this.eventEmitter.off('log', listener);
  }

  setConfig(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): LogConfig {
    return { ...this.config };
  }

  setLevel(level: LogConfig['level']): void {
    this.config.level = level;
  }

  setFormat(format: LogConfig['format']): void {
    this.config.format = format;
  }

  setRetention(retention: number): void {
    this.config.retention = retention;
    this.cleanup();
  }

  setMaxSize(maxSize: number): void {
    this.config.maxSize = maxSize;
    this.cleanup();
  }

  setLabels(labels: Record<string, string>): void {
    this.config.labels = labels;
  }

  getLogStats(): {
    total: number;
    byLevel: Record<string, number>;
    byService: Record<string, number>;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<string, number>,
      byService: {} as Record<string, number>,
    };

    for (const entry of this.logs) {
      stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;
      stats.byService[entry.service] = (stats.byService[entry.service] || 0) + 1;
    }

    return stats;
  }

  clearLogs(): void {
    this.logs = [];
  }
} 