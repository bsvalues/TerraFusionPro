import { ServiceLoggerImpl } from '../logger/logger';
import { ServiceMetricsImpl } from '../metrics/metrics';
import { ServiceAnalyzerImpl } from '../analyzer/analyzer';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface ReportData {
  timestamp: number;
  metrics: {
    cpu: number;
    memory: number;
    heap: number;
    eventLoop: number;
    gc: number;
  };
  analysis: {
    health: number;
    performance: number;
    reliability: number;
  };
  logs: {
    total: number;
    errors: number;
    warnings: number;
  };
  recommendations: string[];
}

interface ReportConfig {
  interval: number;
  retention: number;
  maxReports: number;
  format: 'json' | 'text' | 'html';
}

interface ServiceReporter {
  initialize(): Promise<void>;
  startReporting(): void;
  stopReporting(): void;
  getReports(): ReportData[];
  getLatestReport(): ReportData;
  generateReport(): Promise<ReportData>;
  onReport(listener: (report: ReportData) => void): void;
  offReport(listener: (report: ReportData) => void): void;
}

export class ServiceReporterImpl implements ServiceReporter {
  private static instance: ServiceReporterImpl;
  private logger: ServiceLoggerImpl;
  private metrics: ServiceMetricsImpl;
  private analyzer: ServiceAnalyzerImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private reports: ReportData[] = [];
  private config: ReportConfig;
  private reportingInterval: NodeJS.Timeout | null = null;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.logger = ServiceLoggerImpl.getInstance();
    this.metrics = ServiceMetricsImpl.getInstance();
    this.analyzer = ServiceAnalyzerImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
    this.config = {
      interval: 300000,
      retention: 604800000,
      maxReports: 2016,
      format: 'json',
    };
  }

  static getInstance(): ServiceReporterImpl {
    if (!ServiceReporterImpl.instance) {
      ServiceReporterImpl.instance = new ServiceReporterImpl();
    }
    return ServiceReporterImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeReporter();
    await this.initializationPromise;
  }

  private async initializeReporter(): Promise<void> {
    try {
      await this.logger.initialize();
      await this.metrics.initialize();
      await this.analyzer.initialize();
    } catch (error) {
      console.error('Failed to initialize service reporter:', error);
      throw error;
    }
  }

  private emitReport(report: ReportData): void {
    this.eventEmitter.emit('report', report);
  }

  private async collectMetrics(): Promise<ReportData['metrics']> {
    const cpu = await this.metrics.getMetric('cpu_usage');
    const memory = await this.metrics.getMetric('memory_usage');
    const heap = await this.metrics.getMetric('heap_usage');
    const eventLoop = await this.metrics.getMetric('event_loop_lag');
    const gc = await this.metrics.getMetric('gc_duration');

    return {
      cpu: cpu?.values?.cpuUsage || 0,
      memory: memory?.values?.memoryUsage || 0,
      heap: heap?.values?.heapUsage || 0,
      eventLoop: eventLoop?.values?.networkLatency || 0,
      gc: gc?.values?.gcDuration || 0,
    };
  }

  private async collectAnalysis(): Promise<ReportData['analysis']> {
    const services = this.registry.getServices();
    let totalHealth = 0;
    let totalPerformance = 0;
    let totalReliability = 0;

    for (const service of services) {
      totalHealth += await this.analyzer.getHealthScore(service.id);
      totalPerformance += await this.analyzer.getPerformanceScore(service.id);
      totalReliability += await this.analyzer.getReliabilityScore(service.id);
    }

    const count = services.length || 1;
    return {
      health: totalHealth / count,
      performance: totalPerformance / count,
      reliability: totalReliability / count,
    };
  }

  private async collectLogs(): Promise<ReportData['logs']> {
    const total = await this.metrics.getMetric('log_total');
    const errors = await this.metrics.getMetric('log_errors');
    const warnings = await this.metrics.getMetric('log_warnings');

    return {
      total: total?.values?.total || 0,
      errors: errors?.values?.errorRate || 0,
      warnings: warnings?.values?.warningRate || 0,
    };
  }

  private async collectRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];
    const services = this.registry.getServices();

    for (const service of services) {
      const result = await this.analyzer.getLatestResult(service.id);
      recommendations.push(...result.health.recommendations);
      recommendations.push(...result.performance.recommendations);
      recommendations.push(...result.reliability.recommendations);
    }

    return [...new Set(recommendations)];
  }

  private formatReport(report: ReportData): string {
    switch (this.config.format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'text':
        return this.formatReportAsText(report);
      case 'html':
        return this.formatReportAsHtml(report);
      default:
        return JSON.stringify(report);
    }
  }

  private formatReportAsText(report: ReportData): string {
    const lines: string[] = [];

    lines.push(`Report generated at ${new Date(report.timestamp).toISOString()}`);
    lines.push('');

    lines.push('Metrics:');
    lines.push(`  CPU Usage: ${report.metrics.cpu.toFixed(2)}%`);
    lines.push(`  Memory Usage: ${report.metrics.memory.toFixed(2)}%`);
    lines.push(`  Heap Usage: ${report.metrics.heap.toFixed(2)}%`);
    lines.push(`  Event Loop Lag: ${report.metrics.eventLoop.toFixed(2)}ms`);
    lines.push(`  GC Duration: ${report.metrics.gc.toFixed(2)}ms`);
    lines.push('');

    lines.push('Analysis:');
    lines.push(`  Health Score: ${report.analysis.health.toFixed(2)}`);
    lines.push(`  Performance Score: ${report.analysis.performance.toFixed(2)}`);
    lines.push(`  Reliability Score: ${report.analysis.reliability.toFixed(2)}`);
    lines.push('');

    lines.push('Logs:');
    lines.push(`  Total: ${report.logs.total}`);
    lines.push(`  Errors: ${report.logs.errors}`);
    lines.push(`  Warnings: ${report.logs.warnings}`);
    lines.push('');

    if (report.recommendations.length > 0) {
      lines.push('Recommendations:');
      report.recommendations.forEach((recommendation) => {
        lines.push(`  - ${recommendation}`);
      });
    }

    return lines.join('\n');
  }

  private formatReportAsHtml(report: ReportData): string {
    const lines: string[] = [];

    lines.push('<!DOCTYPE html>');
    lines.push('<html>');
    lines.push('<head>');
    lines.push('  <title>Service Report</title>');
    lines.push('  <style>');
    lines.push('    body { font-family: Arial, sans-serif; margin: 20px; }');
    lines.push('    h1 { color: #333; }');
    lines.push('    h2 { color: #666; margin-top: 20px; }');
    lines.push('    .metric { margin: 10px 0; }');
    lines.push('    .recommendation { margin: 5px 0; }');
    lines.push('  </style>');
    lines.push('</head>');
    lines.push('<body>');

    lines.push(`<h1>Service Report</h1>`);
    lines.push(`<p>Generated at ${new Date(report.timestamp).toISOString()}</p>`);

    lines.push('<h2>Metrics</h2>');
    lines.push(`<div class="metric">CPU Usage: ${report.metrics.cpu.toFixed(2)}%</div>`);
    lines.push(`<div class="metric">Memory Usage: ${report.metrics.memory.toFixed(2)}%</div>`);
    lines.push(`<div class="metric">Heap Usage: ${report.metrics.heap.toFixed(2)}%</div>`);
    lines.push(`<div class="metric">Event Loop Lag: ${report.metrics.eventLoop.toFixed(2)}ms</div>`);
    lines.push(`<div class="metric">GC Duration: ${report.metrics.gc.toFixed(2)}ms</div>`);

    lines.push('<h2>Analysis</h2>');
    lines.push(`<div class="metric">Health Score: ${report.analysis.health.toFixed(2)}</div>`);
    lines.push(`<div class="metric">Performance Score: ${report.analysis.performance.toFixed(2)}</div>`);
    lines.push(`<div class="metric">Reliability Score: ${report.analysis.reliability.toFixed(2)}</div>`);

    lines.push('<h2>Logs</h2>');
    lines.push(`<div class="metric">Total: ${report.logs.total}</div>`);
    lines.push(`<div class="metric">Errors: ${report.logs.errors.toFixed(2)}%</div>`);
    lines.push(`<div class="metric">Warnings: ${report.logs.warnings.toFixed(2)}%</div>`);

    if (report.recommendations.length > 0) {
      lines.push('<h2>Recommendations</h2>');
      report.recommendations.forEach((recommendation) => {
        lines.push(`<div class="recommendation">- ${recommendation}</div>`);
      });
    }

    lines.push('</body>');
    lines.push('</html>');

    return lines.join('\n');
  }

  startReporting(): void {
    if (this.reportingInterval) {
      return;
    }

    this.reportingInterval = setInterval(async () => {
      const report = await this.generateReport();
      this.emitReport(report);
    }, this.config.interval);
  }

  stopReporting(): void {
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }
  }

  getReports(): ReportData[] {
    return this.reports;
  }

  getLatestReport(): ReportData {
    return this.reports[this.reports.length - 1];
  }

  async generateReport(): Promise<ReportData> {
    const timestamp = Date.now();
    const metrics = await this.collectMetrics();
    const analysis = await this.collectAnalysis();
    const logs = await this.collectLogs();
    const recommendations = await this.collectRecommendations();

    const report: ReportData = {
      timestamp,
      metrics,
      analysis,
      logs,
      recommendations,
    };

    this.reports.push(report);
    return report;
  }

  onReport(listener: (report: ReportData) => void): void {
    this.eventEmitter.on('report', listener);
  }

  offReport(listener: (report: ReportData) => void): void {
    this.eventEmitter.off('report', listener);
  }
}