import { ServiceMonitorImpl } from '../monitor/monitor';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface CircuitState {
  status: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailure: number;
  lastSuccess: number;
  resetTimeout: number;
  threshold: number;
  timeout: number;
  window: number;
}

interface CircuitBreaker {
  initialize(): Promise<void>;
  execute<T>(service: string, operation: () => Promise<T>): Promise<T>;
  getState(service: string): CircuitState;
  getAllStates(): Map<string, CircuitState>;
  onStateChange(listener: (service: string, state: CircuitState) => void): void;
  offStateChange(listener: (service: string, state: CircuitState) => void): void;
}

export class CircuitBreakerImpl implements CircuitBreaker {
  private static instance: CircuitBreakerImpl;
  private monitor: ServiceMonitorImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private states: Map<string, CircuitState> = new Map();
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.monitor = ServiceMonitorImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
  }

  static getInstance(): CircuitBreakerImpl {
    if (!CircuitBreakerImpl.instance) {
      CircuitBreakerImpl.instance = new CircuitBreakerImpl();
    }
    return CircuitBreakerImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeCircuitBreaker();
    await this.initializationPromise;
  }

  private async initializeCircuitBreaker(): Promise<void> {
    try {
      await this.monitor.initialize();
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize circuit breaker:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    this.monitor.onHealthUpdate((health) => {
      this.updateCircuitStates(health);
    });
  }

  private updateCircuitStates(health: Map<string, any>): void {
    for (const [service, serviceHealth] of health) {
      const state = this.getOrCreateState(service);
      if (serviceHealth.status === 'error') {
        this.handleFailure(service);
      } else {
        this.handleSuccess(service);
      }
    }
  }

  private getOrCreateState(service: string): CircuitState {
    let state = this.states.get(service);
    if (!state) {
      state = {
        status: 'closed',
        failureCount: 0,
        lastFailure: 0,
        lastSuccess: Date.now(),
        resetTimeout: 30000,
        threshold: 5,
        timeout: 60000,
        window: 60000,
      };
      this.states.set(service, state);
    }
    return state;
  }

  private handleFailure(service: string): void {
    const state = this.getOrCreateState(service);
    state.failureCount++;
    state.lastFailure = Date.now();

    if (state.status === 'closed' && state.failureCount >= state.threshold) {
      state.status = 'open';
      this.emitStateChange(service, state);
    }
  }

  private handleSuccess(service: string): void {
    const state = this.getOrCreateState(service);
    state.lastSuccess = Date.now();

    if (state.status === 'half-open') {
      state.status = 'closed';
      state.failureCount = 0;
      this.emitStateChange(service, state);
    }
  }

  private emitStateChange(service: string, state: CircuitState): void {
    this.eventEmitter.emit('state:change', service, state);
  }

  async execute<T>(service: string, operation: () => Promise<T>): Promise<T> {
    const state = this.getOrCreateState(service);

    if (state.status === 'open') {
      if (Date.now() - state.lastFailure >= state.timeout) {
        state.status = 'half-open';
        this.emitStateChange(service, state);
      } else {
        throw new Error(`Circuit breaker is open for service ${service}`);
      }
    }

    try {
      const result = await operation();
      this.handleSuccess(service);
      return result;
    } catch (error) {
      this.handleFailure(service);
      throw error;
    }
  }

  getState(service: string): CircuitState {
    const state = this.states.get(service);
    if (!state) {
      throw new Error(`No circuit state found for service ${service}`);
    }
    return state;
  }

  getAllStates(): Map<string, CircuitState> {
    return new Map(this.states);
  }

  onStateChange(listener: (service: string, state: CircuitState) => void): void {
    this.eventEmitter.on('state:change', listener);
  }

  offStateChange(listener: (service: string, state: CircuitState) => void): void {
    this.eventEmitter.off('state:change', listener);
  }

  setThreshold(service: string, threshold: number): void {
    const state = this.getOrCreateState(service);
    state.threshold = threshold;
    this.emitStateChange(service, state);
  }

  getThreshold(service: string): number {
    const state = this.getState(service);
    return state.threshold;
  }

  setTimeout(service: string, timeout: number): void {
    const state = this.getOrCreateState(service);
    state.timeout = timeout;
    this.emitStateChange(service, state);
  }

  getTimeout(service: string): number {
    const state = this.getState(service);
    return state.timeout;
  }

  setWindow(service: string, window: number): void {
    const state = this.getOrCreateState(service);
    state.window = window;
    this.emitStateChange(service, state);
  }

  getWindow(service: string): number {
    const state = this.getState(service);
    return state.window;
  }

  reset(service: string): void {
    const state = this.getOrCreateState(service);
    state.status = 'closed';
    state.failureCount = 0;
    state.lastFailure = 0;
    state.lastSuccess = Date.now();
    this.emitStateChange(service, state);
  }

  forceOpen(service: string): void {
    const state = this.getOrCreateState(service);
    state.status = 'open';
    this.emitStateChange(service, state);
  }

  forceClosed(service: string): void {
    const state = this.getOrCreateState(service);
    state.status = 'closed';
    state.failureCount = 0;
    this.emitStateChange(service, state);
  }

  isOpen(service: string): boolean {
    const state = this.getState(service);
    return state.status === 'open';
  }

  isHalfOpen(service: string): boolean {
    const state = this.getState(service);
    return state.status === 'half-open';
  }

  isClosed(service: string): boolean {
    const state = this.getState(service);
    return state.status === 'closed';
  }

  getFailureCount(service: string): number {
    const state = this.getState(service);
    return state.failureCount;
  }

  getLastFailure(service: string): number {
    const state = this.getState(service);
    return state.lastFailure;
  }

  getLastSuccess(service: string): number {
    const state = this.getState(service);
    return state.lastSuccess;
  }
} 