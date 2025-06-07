import { ServiceLoggerImpl } from '../logger/logger';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface TraceSpan {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  service: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'ok' | 'error';
  error?: Error;
  tags: Record<string, string>;
  logs: Array<{
    timestamp: number;
    fields: Record<string, any>;
  }>;
}

interface TraceConfig {
  sampling: number;
  maxSpans: number;
  retention: number;
  tags: Record<string, string>;
}

interface ServiceTracer {
  initialize(): Promise<void>;
  startSpan(name: string, tags?: Record<string, string>): TraceSpan;
  endSpan(span: TraceSpan, status?: 'ok' | 'error', error?: Error): void;
  getTrace(traceId: string): TraceSpan[];
  getSpans(service?: string): TraceSpan[];
  onSpan(listener: (span: TraceSpan) => void): void;
  offSpan(listener: (span: TraceSpan) => void): void;
}

export class ServiceTracerImpl implements ServiceTracer {
  private static instance: ServiceTracerImpl;
  private logger: ServiceLoggerImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private spans: Map<string, TraceSpan> = new Map();
  private config: TraceConfig;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.logger = ServiceLoggerImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
    this.config = {
      sampling: 1.0,
      maxSpans: 10000,
      retention: 86400000,
      tags: {},
    };
  }

  static getInstance(): ServiceTracerImpl {
    if (!ServiceTracerImpl.instance) {
      ServiceTracerImpl.instance = new ServiceTracerImpl();
    }
    return ServiceTracerImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeTracer();
    await this.initializationPromise;
  }

  private async initializeTracer(): Promise<void> {
    try {
      await this.logger.initialize();
      this.cleanup();
    } catch (error) {
      console.error('Failed to initialize service tracer:', error);
      throw error;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, span] of this.spans) {
      if (now - span.startTime > this.config.retention) {
        this.spans.delete(id);
      }
    }

    if (this.spans.size > this.config.maxSpans) {
      const sortedSpans = Array.from(this.spans.values()).sort(
        (a, b) => a.startTime - b.startTime
      );
      const deleteCount = this.spans.size - this.config.maxSpans;
      for (let i = 0; i < deleteCount; i++) {
        this.spans.delete(sortedSpans[i].id);
      }
    }
  }

  private emitSpan(span: TraceSpan): void {
    this.eventEmitter.emit('span', span);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  startSpan(
    name: string,
    tags: Record<string, string> = {}
  ): TraceSpan {
    const service = this.registry.getCurrentService();
    const traceId = this.generateId();
    const spanId = this.generateId();

    const span: TraceSpan = {
      id: spanId,
      traceId,
      name,
      service,
      startTime: Date.now(),
      status: 'ok',
      tags: { ...this.config.tags, ...tags },
      logs: [],
    };

    if (Math.random() <= this.config.sampling) {
      this.spans.set(spanId, span);
      this.emitSpan(span);
      this.logger.debug('Started span', {
        traceId,
        spanId,
        name,
        service,
      });
    }

    return span;
  }

  endSpan(
    span: TraceSpan,
    status: 'ok' | 'error' = 'ok',
    error?: Error
  ): void {
    if (!this.spans.has(span.id)) {
      return;
    }

    const endTime = Date.now();
    const duration = endTime - span.startTime;

    span.endTime = endTime;
    span.duration = duration;
    span.status = status;
    if (error) {
      span.error = error;
    }

    this.emitSpan(span);
    this.logger.debug('Ended span', {
      traceId: span.traceId,
      spanId: span.id,
      name: span.name,
      service: span.service,
      duration,
      status,
    });

    if (error) {
      this.logger.error('Span error', error, {
        traceId: span.traceId,
        spanId: span.id,
        name: span.name,
        service: span.service,
      });
    }
  }

  getTrace(traceId: string): TraceSpan[] {
    return Array.from(this.spans.values()).filter(
      (span) => span.traceId === traceId
    );
  }

  getSpans(service?: string): TraceSpan[] {
    return Array.from(this.spans.values()).filter(
      (span) => !service || span.service === service
    );
  }

  onSpan(listener: (span: TraceSpan) => void): void {
    this.eventEmitter.on('span', listener);
  }

  offSpan(listener: (span: TraceSpan) => void): void {
    this.eventEmitter.off('span', listener);
  }

  setConfig(config: Partial<TraceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): TraceConfig {
    return { ...this.config };
  }

  setSampling(sampling: number): void {
    this.config.sampling = sampling;
  }

  setMaxSpans(maxSpans: number): void {
    this.config.maxSpans = maxSpans;
    this.cleanup();
  }

  setRetention(retention: number): void {
    this.config.retention = retention;
    this.cleanup();
  }

  setTags(tags: Record<string, string>): void {
    this.config.tags = tags;
  }

  addSpanLog(
    span: TraceSpan,
    fields: Record<string, any>
  ): void {
    if (!this.spans.has(span.id)) {
      return;
    }

    span.logs.push({
      timestamp: Date.now(),
      fields,
    });

    this.emitSpan(span);
  }

  addSpanTag(
    span: TraceSpan,
    key: string,
    value: string
  ): void {
    if (!this.spans.has(span.id)) {
      return;
    }

    span.tags[key] = value;
    this.emitSpan(span);
  }

  getSpanStats(): {
    total: number;
    byService: Record<string, number>;
    byStatus: Record<string, number>;
    avgDuration: number;
  } {
    const spans = Array.from(this.spans.values());
    const stats = {
      total: spans.length,
      byService: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      avgDuration: 0,
    };

    let totalDuration = 0;
    for (const span of spans) {
      stats.byService[span.service] = (stats.byService[span.service] || 0) + 1;
      stats.byStatus[span.status] = (stats.byStatus[span.status] || 0) + 1;
      if (span.duration) {
        totalDuration += span.duration;
      }
    }

    stats.avgDuration = spans.length > 0 ? totalDuration / spans.length : 0;
    return stats;
  }

  clearSpans(): void {
    this.spans.clear();
  }
} 