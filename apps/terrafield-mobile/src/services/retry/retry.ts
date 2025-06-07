import { ServiceMonitorImpl } from '../monitor/monitor';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;
  jitter: boolean;
  timeout: number;
}

interface RetryState {
  attempts: number;
  lastAttempt: number;
  nextDelay: number;
  errors: Error[];
}

interface RetryResult<T> {
  result: T;
  attempts: number;
  duration: number;
  errors: Error[];
}

interface ServiceRetry {
  initialize(): Promise<void>;
  execute<T>(service: string, operation: () => Promise<T>): Promise<RetryResult<T>>;
  getConfig(service: string): RetryConfig;
  setConfig(service: string, config: RetryConfig): void;
  onRetry(listener: (service: string, attempt: number, error: Error) => void): void;
  offRetry(listener: (service: string, attempt: number, error: Error) => void): void;
}

export class ServiceRetryImpl implements ServiceRetry {
  private static instance: ServiceRetryImpl;
  private monitor: ServiceMonitorImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private configs: Map<string, RetryConfig> = new Map();
  private states: Map<string, RetryState> = new Map();
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.monitor = ServiceMonitorImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
  }

  static getInstance(): ServiceRetryImpl {
    if (!ServiceRetryImpl.instance) {
      ServiceRetryImpl.instance = new ServiceRetryImpl();
    }
    return ServiceRetryImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeRetry();
    await this.initializationPromise;
  }

  private async initializeRetry(): Promise<void> {
    try {
      await this.monitor.initialize();
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize service retry:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    this.monitor.onHealthUpdate((health) => {
      this.updateRetryStates(health);
    });
  }

  private updateRetryStates(health: Map<string, any>): void {
    for (const [service, serviceHealth] of health) {
      if (serviceHealth.status === 'error') {
        this.resetRetryState(service);
      }
    }
  }

  private getOrCreateConfig(service: string): RetryConfig {
    let config = this.configs.get(service);
    if (!config) {
      config = {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        factor: 2,
        jitter: true,
        timeout: 30000,
      };
      this.configs.set(service, config);
    }
    return config;
  }

  private getOrCreateState(service: string): RetryState {
    let state = this.states.get(service);
    if (!state) {
      state = {
        attempts: 0,
        lastAttempt: 0,
        nextDelay: 0,
        errors: [],
      };
      this.states.set(service, state);
    }
    return state;
  }

  private resetRetryState(service: string): void {
    const state = this.getOrCreateState(service);
    state.attempts = 0;
    state.lastAttempt = 0;
    state.nextDelay = 0;
    state.errors = [];
  }

  private emitRetry(service: string, attempt: number, error: Error): void {
    this.eventEmitter.emit('retry', service, attempt, error);
  }

  async execute<T>(service: string, operation: () => Promise<T>): Promise<RetryResult<T>> {
    const config = this.getOrCreateConfig(service);
    const state = this.getOrCreateState(service);
    const startTime = Date.now();

    while (state.attempts < config.maxAttempts) {
      try {
        const result = await this.executeWithTimeout(operation, config.timeout);
        return {
          result,
          attempts: state.attempts + 1,
          duration: Date.now() - startTime,
          errors: state.errors,
        };
      } catch (error) {
        state.attempts++;
        state.lastAttempt = Date.now();
        state.errors.push(error as Error);

        if (state.attempts >= config.maxAttempts) {
          throw new Error(
            `Operation failed after ${state.attempts} attempts: ${error}`
          );
        }

        this.emitRetry(service, state.attempts, error as Error);
        await this.delay(state, config);
      }
    }

    throw new Error('Retry execution failed');
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      return await operation();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async delay(state: RetryState, config: RetryConfig): Promise<void> {
    const delay = this.calculateDelay(state, config);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private calculateDelay(state: RetryState, config: RetryConfig): number {
    let delay = Math.min(
      config.initialDelay * Math.pow(config.factor, state.attempts - 1),
      config.maxDelay
    );

    if (config.jitter) {
      const jitter = Math.random() * 0.3 + 0.85;
      delay *= jitter;
    }

    return Math.floor(delay);
  }

  getConfig(service: string): RetryConfig {
    const config = this.configs.get(service);
    if (!config) {
      throw new Error(`No retry config found for service ${service}`);
    }
    return config;
  }

  setConfig(service: string, config: RetryConfig): void {
    this.configs.set(service, config);
  }

  onRetry(listener: (service: string, attempt: number, error: Error) => void): void {
    this.eventEmitter.on('retry', listener);
  }

  offRetry(listener: (service: string, attempt: number, error: Error) => void): void {
    this.eventEmitter.off('retry', listener);
  }

  getRetryState(service: string): RetryState {
    const state = this.states.get(service);
    if (!state) {
      throw new Error(`No retry state found for service ${service}`);
    }
    return state;
  }

  getAllRetryStates(): Map<string, RetryState> {
    return new Map(this.states);
  }

  resetRetryState(service: string): void {
    this.states.delete(service);
  }

  resetAllRetryStates(): void {
    this.states.clear();
  }

  getRetryCount(service: string): number {
    const state = this.getRetryState(service);
    return state.attempts;
  }

  getLastRetry(service: string): number {
    const state = this.getRetryState(service);
    return state.lastAttempt;
  }

  getRetryErrors(service: string): Error[] {
    const state = this.getRetryState(service);
    return state.errors;
  }

  isRetrying(service: string): boolean {
    const state = this.getRetryState(service);
    return state.attempts > 0 && state.attempts < this.getConfig(service).maxAttempts;
  }

  hasRetriesLeft(service: string): boolean {
    const state = this.getRetryState(service);
    const config = this.getConfig(service);
    return state.attempts < config.maxAttempts;
  }
} 