import { ServiceLoggerImpl } from '../logger/logger';
import { ServiceMetricsImpl } from '../metrics/metrics';
import { ServiceAnalyzerImpl } from '../analyzer/analyzer';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'neq' | 'gte' | 'lte';
    value: number;
    duration: number;
  };
  severity: 'info' | 'warning' | 'error' | 'critical';
  actions: {
    type: 'log' | 'notification' | 'webhook';
    config: Record<string, any>;
  }[];
  enabled: boolean;
}

interface AlertConfig {
  checkInterval: number;
  retention: number;
  cooldown: number;
  defaultActions: {
    type: 'log' | 'notification' | 'webhook';
    config: Record<string, any>;
  }[];
}

interface ServiceAlert {
  initialize(): Promise<void>;
  startAlerting(): void;
  stopAlerting(): void;
  addRule(rule: AlertRule): void;
  removeRule(ruleId: string): void;
  updateRule(ruleId: string, config: Partial<AlertRule>): void;
  getRules(): AlertRule[];
  onAlert(listener: (alert: any) => void): void;
  offAlert(listener: (alert: any) => void): void;
}

export class ServiceAlertImpl implements ServiceAlert {
  private static instance: ServiceAlertImpl;
  private logger: ServiceLoggerImpl;
  private metrics: ServiceMetricsImpl;
  private analyzer: ServiceAnalyzerImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private rules: Map<string, AlertRule> = new Map();
  private config: AlertConfig;
  private alertingInterval: NodeJS.Timeout | null = null;
  private initializationPromise: Promise<void> | null = null;
  private lastAlerts: Map<string, number> = new Map();

  private constructor() {
    this.logger = ServiceLoggerImpl.getInstance();
    this.metrics = ServiceMetricsImpl.getInstance();
    this.analyzer = ServiceAnalyzerImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
    this.config = {
      checkInterval: 10000,
      retention: 86400000,
      cooldown: 300000,
      defaultActions: [
        {
          type: 'log',
          config: {},
        },
      ],
    };
  }

  static getInstance(): ServiceAlertImpl {
    if (!ServiceAlertImpl.instance) {
      ServiceAlertImpl.instance = new ServiceAlertImpl();
    }
    return ServiceAlertImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeAlert();
    await this.initializationPromise;
  }

  private async initializeAlert(): Promise<void> {
    try {
      await this.logger.initialize();
      await this.metrics.initialize();
      await this.analyzer.initialize();
      this.setupDefaultRules();
    } catch (error) {
      console.error('Failed to initialize service alert:', error);
      throw error;
    }
  }

  private setupDefaultRules(): void {
    this.addRule({
      id: 'high-cpu',
      name: 'High CPU Usage',
      description: 'Alert when CPU usage is high',
      condition: {
        metric: 'cpu_usage',
        operator: 'gt',
        value: 80,
        duration: 300000,
      },
      severity: 'warning',
      actions: [
        {
          type: 'log',
          config: {},
        },
        {
          type: 'notification',
          config: {
            title: 'High CPU Usage',
            message: 'CPU usage is above 80%',
          },
        },
      ],
      enabled: true,
    });

    this.addRule({
      id: 'high-memory',
      name: 'High Memory Usage',
      description: 'Alert when memory usage is high',
      condition: {
        metric: 'memory_usage',
        operator: 'gt',
        value: 80,
        duration: 300000,
      },
      severity: 'warning',
      actions: [
        {
          type: 'log',
          config: {},
        },
        {
          type: 'notification',
          config: {
            title: 'High Memory Usage',
            message: 'Memory usage is above 80%',
          },
        },
      ],
      enabled: true,
    });

    this.addRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      description: 'Alert when error rate is high',
      condition: {
        metric: 'error_rate',
        operator: 'gt',
        value: 5,
        duration: 300000,
      },
      severity: 'error',
      actions: [
        {
          type: 'log',
          config: {},
        },
        {
          type: 'notification',
          config: {
            title: 'High Error Rate',
            message: 'Error rate is above 5%',
          },
        },
      ],
      enabled: true,
    });
  }

  private emitAlert(alert: any): void {
    this.eventEmitter.emit('alert', alert);
  }

  private async checkRule(rule: AlertRule): Promise<void> {
    if (!rule.enabled) {
      return;
    }

    const now = Date.now();
    const lastAlert = this.lastAlerts.get(rule.id) || 0;
    if (now - lastAlert < this.config.cooldown) {
      return;
    }

    const value = this.metrics.getMetricValue(rule.condition.metric);
    const triggered = this.evaluateCondition(
      value,
      rule.condition.operator,
      rule.condition.value
    );

    if (triggered) {
      const alert = {
        id: this.generateAlertId(),
        ruleId: rule.id,
        timestamp: now,
        severity: rule.severity,
        metric: rule.condition.metric,
        value,
        threshold: rule.condition.value,
      };

      await this.handleAlert(alert, rule);
      this.lastAlerts.set(rule.id, now);
    }
  }

  private evaluateCondition(
    value: number,
    operator: AlertRule['condition']['operator'],
    threshold: number
  ): boolean {
    switch (operator) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'eq':
        return value === threshold;
      case 'neq':
        return value !== threshold;
      case 'gte':
        return value >= threshold;
      case 'lte':
        return value <= threshold;
      default:
        return false;
    }
  }

  private async handleAlert(alert: any, rule: AlertRule): Promise<void> {
    this.emitAlert(alert);
    this.logger.warn(`Alert triggered: ${rule.name}`, {
      ruleId: rule.id,
      severity: rule.severity,
      metric: rule.condition.metric,
      value: alert.value,
      threshold: rule.condition.value,
    });

    for (const action of rule.actions) {
      try {
        await this.executeAction(action, alert);
      } catch (error) {
        this.logger.error('Failed to execute alert action', error, {
          ruleId: rule.id,
          actionType: action.type,
        });
      }
    }
  }

  private async executeAction(
    action: AlertRule['actions'][0],
    alert: any
  ): Promise<void> {
    switch (action.type) {
      case 'log':
        this.logger.info('Alert action: log', {
          alertId: alert.id,
          ruleId: alert.ruleId,
          severity: alert.severity,
        });
        break;
      case 'notification':
        await this.sendNotification(action.config, alert);
        break;
      case 'webhook':
        await this.sendWebhook(action.config, alert);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async sendNotification(
    config: Record<string, any>,
    alert: any
  ): Promise<void> {
    // Implement notification sending logic
    console.log('Sending notification:', config, alert);
  }

  private async sendWebhook(
    config: Record<string, any>,
    alert: any
  ): Promise<void> {
    // Implement webhook sending logic
    console.log('Sending webhook:', config, alert);
  }

  private generateAlertId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  startAlerting(): void {
    if (this.alertingInterval) {
      return;
    }

    this.alertingInterval = setInterval(async () => {
      try {
        for (const rule of this.rules.values()) {
          await this.checkRule(rule);
        }
      } catch (error) {
        this.logger.error('Failed to check alert rules', error);
      }
    }, this.config.checkInterval);
  }

  stopAlerting(): void {
    if (this.alertingInterval) {
      clearInterval(this.alertingInterval);
      this.alertingInterval = null;
    }
  }

  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    this.lastAlerts.delete(ruleId);
  }

  updateRule(ruleId: string, config: Partial<AlertRule>): void {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    const updatedRule = { ...rule, ...config };
    this.rules.set(ruleId, updatedRule);
  }

  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  onAlert(listener: (alert: any) => void): void {
    this.eventEmitter.on('alert', listener);
  }

  offAlert(listener: (alert: any) => void): void {
    this.eventEmitter.off('alert', listener);
  }

  setConfig(config: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AlertConfig {
    return { ...this.config };
  }

  setCheckInterval(interval: number): void {
    this.config.checkInterval = interval;
    if (this.alertingInterval) {
      this.stopAlerting();
      this.startAlerting();
    }
  }

  setRetention(retention: number): void {
    this.config.retention = retention;
  }

  setCooldown(cooldown: number): void {
    this.config.cooldown = cooldown;
  }

  setDefaultActions(actions: AlertConfig['defaultActions']): void {
    this.config.defaultActions = actions;
  }

  getRuleStats(): {
    totalRules: number;
    bySeverity: Record<string, number>;
    byMetric: Record<string, number>;
    enabledRules: number;
  } {
    const stats = {
      totalRules: this.rules.size,
      bySeverity: {} as Record<string, number>,
      byMetric: {} as Record<string, number>,
      enabledRules: 0,
    };

    for (const rule of this.rules.values()) {
      stats.bySeverity[rule.severity] = (stats.bySeverity[rule.severity] || 0) + 1;
      stats.byMetric[rule.condition.metric] =
        (stats.byMetric[rule.condition.metric] || 0) + 1;
      if (rule.enabled) {
        stats.enabledRules++;
      }
    }

    return stats;
  }

  clearRules(): void {
    this.rules.clear();
    this.lastAlerts.clear();
  }
} 