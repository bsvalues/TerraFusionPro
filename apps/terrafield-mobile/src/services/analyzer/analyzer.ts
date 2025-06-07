import { ServiceLoggerImpl } from '../logger/logger';
import { ServiceMetricsImpl } from '../metrics/metrics';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface AnalysisResult {
  timestamp: number;
  serviceId: string;
  health: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  performance: {
    score: number;
    bottlenecks: string[];
    recommendations: string[];
  };
  reliability: {
    score: number;
    risks: string[];
    recommendations: string[];
  };
}

interface AnalysisConfig {
  interval: number;
  retention: number;
  maxResults: number;
  thresholds: {
    health: number;
    performance: number;
    reliability: number;
  };
}

interface ServiceAnalyzer {
  initialize(): Promise<void>;
  startAnalysis(): void;
  stopAnalysis(): void;
  getResults(): AnalysisResult[];
  getLatestResult(serviceId: string): AnalysisResult;
  getHealthScore(serviceId: string): number;
  getPerformanceScore(serviceId: string): number;
  getReliabilityScore(serviceId: string): number;
  onResult(listener: (result: AnalysisResult) => void): void;
  offResult(listener: (result: AnalysisResult) => void): void;
}

export class ServiceAnalyzerImpl implements ServiceAnalyzer {
  private static instance: ServiceAnalyzerImpl;
  private logger: ServiceLoggerImpl;
  private metrics: ServiceMetricsImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private results: Map<string, AnalysisResult[]> = new Map();
  private config: AnalysisConfig;
  private analysisInterval: NodeJS.Timeout | null = null;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.logger = ServiceLoggerImpl.getInstance();
    this.metrics = ServiceMetricsImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
    this.config = {
      interval: 60000,
      retention: 86400000,
      maxResults: 1440,
      thresholds: {
        health: 80,
        performance: 80,
        reliability: 80,
      },
    };
  }

  static getInstance(): ServiceAnalyzerImpl {
    if (!ServiceAnalyzerImpl.instance) {
      ServiceAnalyzerImpl.instance = new ServiceAnalyzerImpl();
    }
    return ServiceAnalyzerImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeAnalyzer();
    await this.initializationPromise;
  }

  private async initializeAnalyzer(): Promise<void> {
    try {
      await this.logger.initialize();
      await this.metrics.initialize();
    } catch (error) {
      console.error('Failed to initialize service analyzer:', error);
      throw error;
    }
  }

  private emitResult(result: AnalysisResult): void {
    this.eventEmitter.emit('result', result);
  }

  private async analyzeService(serviceId: string): Promise<AnalysisResult> {
    const timestamp = Date.now();
    const health = await this.analyzeHealth(serviceId);
    const performance = await this.analyzePerformance(serviceId);
    const reliability = await this.analyzeReliability(serviceId);

    const result: AnalysisResult = {
      timestamp,
      serviceId,
      health,
      performance,
      reliability,
    };

    const serviceResults = this.results.get(serviceId) || [];
    serviceResults.push(result);
    if (serviceResults.length > this.config.maxResults) {
      serviceResults.splice(0, serviceResults.length - this.config.maxResults);
    }
    this.results.set(serviceId, serviceResults);

    this.emitResult(result);
    return result;
  }

  private async analyzeHealth(serviceId: string): Promise<AnalysisResult['health']> {
    const service = this.registry.getService(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check service status
    if (service.status !== 'healthy') {
      issues.push(`Service status is ${service.status}`);
      recommendations.push('Investigate service status issues');
    }

    // Check error rate
    const errorRate = await this.metrics.getMetric('error_rate', { serviceId });
    if (errorRate && errorRate.value > 0.01) {
      issues.push(`High error rate: ${errorRate.value * 100}%`);
      recommendations.push('Investigate error rate issues');
    }

    // Check response time
    const responseTime = await this.metrics.getMetric('response_time', { serviceId });
    if (responseTime && responseTime.value > 1000) {
      issues.push(`High response time: ${responseTime.value}ms`);
      recommendations.push('Optimize response time');
    }

    // Calculate health score
    const score = this.calculateHealthScore(issues);

    return {
      score,
      issues,
      recommendations,
    };
  }

  private async analyzePerformance(serviceId: string): Promise<AnalysisResult['performance']> {
    const bottlenecks: string[] = [];
    const recommendations: string[] = [];

    // Check CPU usage
    const cpuUsage = await this.metrics.getMetric('cpu_usage', { serviceId });
    if (cpuUsage && cpuUsage.value > 80) {
      bottlenecks.push(`High CPU usage: ${cpuUsage.value}%`);
      recommendations.push('Optimize CPU usage');
    }

    // Check memory usage
    const memoryUsage = await this.metrics.getMetric('memory_usage', { serviceId });
    if (memoryUsage && memoryUsage.value > 80) {
      bottlenecks.push(`High memory usage: ${memoryUsage.value}%`);
      recommendations.push('Optimize memory usage');
    }

    // Check event loop lag
    const eventLoopLag = await this.metrics.getMetric('event_loop_lag', { serviceId });
    if (eventLoopLag && eventLoopLag.value > 100) {
      bottlenecks.push(`High event loop lag: ${eventLoopLag.value}ms`);
      recommendations.push('Optimize event loop performance');
    }

    // Calculate performance score
    const score = this.calculatePerformanceScore(bottlenecks);

    return {
      score,
      bottlenecks,
      recommendations,
    };
  }

  private async analyzeReliability(serviceId: string): Promise<AnalysisResult['reliability']> {
    const risks: string[] = [];
    const recommendations: string[] = [];

    // Check uptime
    const uptime = await this.metrics.getMetric('uptime', { serviceId });
    if (uptime && uptime.value < 0.99) {
      risks.push(`Low uptime: ${uptime.value * 100}%`);
      recommendations.push('Improve service reliability');
    }

    // Check error rate
    const errorRate = await this.metrics.getMetric('error_rate', { serviceId });
    if (errorRate && errorRate.value > 0.01) {
      risks.push(`High error rate: ${errorRate.value * 100}%`);
      recommendations.push('Reduce error rate');
    }

    // Check response time consistency
    const responseTimeStdDev = await this.metrics.getMetric('response_time_stddev', { serviceId });
    if (responseTimeStdDev && responseTimeStdDev.value > 100) {
      risks.push(`High response time variability: ${responseTimeStdDev.value}ms`);
      recommendations.push('Improve response time consistency');
    }

    // Calculate reliability score
    const score = this.calculateReliabilityScore(risks);

    return {
      score,
      risks,
      recommendations,
    };
  }

  private calculateHealthScore(issues: string[]): number {
    const baseScore = 100;
    const issuePenalty = 20;
    return Math.max(0, baseScore - issues.length * issuePenalty);
  }

  private calculatePerformanceScore(bottlenecks: string[]): number {
    const baseScore = 100;
    const bottleneckPenalty = 20;
    return Math.max(0, baseScore - bottlenecks.length * bottleneckPenalty);
  }

  private calculateReliabilityScore(risks: string[]): number {
    const baseScore = 100;
    const riskPenalty = 20;
    return Math.max(0, baseScore - risks.length * riskPenalty);
  }

  private checkThresholds(result: AnalysisResult): void {
    const { thresholds } = this.config;

    if (result.health.score < thresholds.health) {
      this.logger.warn('Low health score detected', {
        serviceId: result.serviceId,
        score: result.health.score,
        threshold: thresholds.health,
      });
    }

    if (result.performance.score < thresholds.performance) {
      this.logger.warn('Low performance score detected', {
        serviceId: result.serviceId,
        score: result.performance.score,
        threshold: thresholds.performance,
      });
    }

    if (result.reliability.score < thresholds.reliability) {
      this.logger.warn('Low reliability score detected', {
        serviceId: result.serviceId,
        score: result.reliability.score,
        threshold: thresholds.reliability,
      });
    }
  }

  startAnalysis(): void {
    if (this.analysisInterval) {
      return;
    }

    this.analysisInterval = setInterval(async () => {
      try {
        const services = this.registry.getServices();
        for (const service of services) {
          const result = await this.analyzeService(service.id);
          this.checkThresholds(result);
        }
      } catch (error) {
        this.logger.error('Failed to analyze services', error);
      }
    }, this.config.interval);

    this.logger.info('Started service analysis', {
      interval: this.config.interval,
    });
  }

  stopAnalysis(): void {
    if (!this.analysisInterval) {
      return;
    }

    clearInterval(this.analysisInterval);
    this.analysisInterval = null;

    this.logger.info('Stopped service analysis');
  }

  getResults(): AnalysisResult[] {
    const allResults: AnalysisResult[] = [];
    for (const results of this.results.values()) {
      allResults.push(...results);
    }
    return allResults;
  }

  getLatestResult(serviceId: string): AnalysisResult {
    const serviceResults = this.results.get(serviceId);
    if (!serviceResults || serviceResults.length === 0) {
      throw new Error(`No results available for service ${serviceId}`);
    }
    return serviceResults[serviceResults.length - 1];
  }

  getHealthScore(serviceId: string): number {
    const result = this.getLatestResult(serviceId);
    return result.health.score;
  }

  getPerformanceScore(serviceId: string): number {
    const result = this.getLatestResult(serviceId);
    return result.performance.score;
  }

  getReliabilityScore(serviceId: string): number {
    const result = this.getLatestResult(serviceId);
    return result.reliability.score;
  }

  onResult(listener: (result: AnalysisResult) => void): void {
    this.eventEmitter.on('result', listener);
  }

  offResult(listener: (result: AnalysisResult) => void): void {
    this.eventEmitter.off('result', listener);
  }

  setConfig(config: Partial<AnalysisConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AnalysisConfig {
    return { ...this.config };
  }

  setInterval(interval: number): void {
    this.config.interval = interval;
    if (this.analysisInterval) {
      this.stopAnalysis();
      this.startAnalysis();
    }
  }

  setRetention(retention: number): void {
    this.config.retention = retention;
  }

  setMaxResults(maxResults: number): void {
    this.config.maxResults = maxResults;
    for (const [serviceId, results] of this.results.entries()) {
      if (results.length > maxResults) {
        this.results.set(serviceId, results.slice(-maxResults));
      }
    }
  }

  setThresholds(thresholds: Partial<AnalysisConfig['thresholds']>): void {
    this.config.thresholds = { ...this.config.thresholds, ...thresholds };
  }

  getAnalyzerStats(): {
    totalResults: number;
    services: number;
    averageScores: {
      health: number;
      performance: number;
      reliability: number;
    };
  } {
    const stats = {
      totalResults: 0,
      services: this.results.size,
      averageScores: {
        health: 0,
        performance: 0,
        reliability: 0,
      },
    };

    let totalHealth = 0;
    let totalPerformance = 0;
    let totalReliability = 0;

    for (const results of this.results.values()) {
      stats.totalResults += results.length;
      for (const result of results) {
        totalHealth += result.health.score;
        totalPerformance += result.performance.score;
        totalReliability += result.reliability.score;
      }
    }

    if (stats.totalResults > 0) {
      stats.averageScores.health = totalHealth / stats.totalResults;
      stats.averageScores.performance = totalPerformance / stats.totalResults;
      stats.averageScores.reliability = totalReliability / stats.totalResults;
    }

    return stats;
  }

  clearResults(): void {
    this.results.clear();
  }
} 