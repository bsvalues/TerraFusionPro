import { ServiceMonitorImpl } from '../monitor/monitor';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface RateLimitConfig {
  window: number;
  maxRequests: number;
  blockDuration: number;
  strategy: 'fixed' | 'sliding' | 'token-bucket';
  tokensPerSecond?: number;
  bucketSize?: number;
}

interface RateLimitState {
  count: number;
  reset: number;
  blocked: boolean;
  blockUntil: number;
  tokens: number;
  lastRefill: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  blocked: boolean;
  blockUntil: number;
}

interface ServiceRateLimiter {
  initialize(): Promise<void>;
  checkLimit(service: string, key: string): Promise<RateLimitResult>;
  resetLimit(service: string, key: string): Promise<void>;
  getLimitState(service: string, key: string): RateLimitState;
  onLimitExceeded(listener: (service: string, key: string) => void): void;
  offLimitExceeded(listener: (service: string, key: string) => void): void;
}

export class ServiceRateLimiterImpl implements ServiceRateLimiter {
  private static instance: ServiceRateLimiterImpl;
  private monitor: ServiceMonitorImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private configs: Map<string, RateLimitConfig> = new Map();
  private states: Map<string, Map<string, RateLimitState>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.monitor = ServiceMonitorImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
  }

  static getInstance(): ServiceRateLimiterImpl {
    if (!ServiceRateLimiterImpl.instance) {
      ServiceRateLimiterImpl.instance = new ServiceRateLimiterImpl();
    }
    return ServiceRateLimiterImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeRateLimiter();
    await this.initializationPromise;
  }

  private async initializeRateLimiter(): Promise<void> {
    try {
      await this.monitor.initialize();
      this.setupEventListeners();
      this.startCleanupInterval();
    } catch (error) {
      console.error('Failed to initialize service rate limiter:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    this.monitor.onHealthUpdate((health) => {
      this.updateRateLimitStates(health);
    });
  }

  private updateRateLimitStates(health: Map<string, any>): void {
    for (const [service, serviceHealth] of health) {
      if (serviceHealth.status === 'error') {
        this.resetServiceLimits(service);
      }
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
        console.error('Failed to cleanup rate limiter:', error);
      }
    }, 60000);
  }

  private async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [service, states] of this.states) {
      for (const [key, state] of states) {
        if (state.reset <= now && !state.blocked) {
          states.delete(key);
        }
      }
      if (states.size === 0) {
        this.states.delete(service);
      }
    }
  }

  private getOrCreateConfig(service: string): RateLimitConfig {
    let config = this.configs.get(service);
    if (!config) {
      config = {
        window: 60000,
        maxRequests: 100,
        blockDuration: 300000,
        strategy: 'fixed',
      };
      this.configs.set(service, config);
    }
    return config;
  }

  private getOrCreateState(service: string, key: string): RateLimitState {
    let serviceStates = this.states.get(service);
    if (!serviceStates) {
      serviceStates = new Map();
      this.states.set(service, serviceStates);
    }

    let state = serviceStates.get(key);
    if (!state) {
      const config = this.getOrCreateConfig(service);
      state = {
        count: 0,
        reset: Date.now() + config.window,
        blocked: false,
        blockUntil: 0,
        tokens: config.bucketSize || config.maxRequests,
        lastRefill: Date.now(),
      };
      serviceStates.set(key, state);
    }
    return state;
  }

  private emitLimitExceeded(service: string, key: string): void {
    this.eventEmitter.emit('limit:exceeded', service, key);
  }

  async checkLimit(service: string, key: string): Promise<RateLimitResult> {
    const config = this.getOrCreateConfig(service);
    const state = this.getOrCreateState(service, key);
    const now = Date.now();

    if (state.blocked) {
      if (now >= state.blockUntil) {
        state.blocked = false;
        state.blockUntil = 0;
        state.count = 0;
        state.reset = now + config.window;
      } else {
        return {
          allowed: false,
          remaining: 0,
          reset: state.blockUntil,
          blocked: true,
          blockUntil: state.blockUntil,
        };
      }
    }

    switch (config.strategy) {
      case 'fixed':
        return this.checkFixedWindow(state, config, now);
      case 'sliding':
        return this.checkSlidingWindow(state, config, now);
      case 'token-bucket':
        return this.checkTokenBucket(state, config, now);
      default:
        return this.checkFixedWindow(state, config, now);
    }
  }

  private checkFixedWindow(
    state: RateLimitState,
    config: RateLimitConfig,
    now: number
  ): RateLimitResult {
    if (now >= state.reset) {
      state.count = 0;
      state.reset = now + config.window;
    }

    if (state.count >= config.maxRequests) {
      state.blocked = true;
      state.blockUntil = now + config.blockDuration;
      this.emitLimitExceeded(state.service, state.key);
      return {
        allowed: false,
        remaining: 0,
        reset: state.blockUntil,
        blocked: true,
        blockUntil: state.blockUntil,
      };
    }

    state.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - state.count,
      reset: state.reset,
      blocked: false,
      blockUntil: 0,
    };
  }

  private checkSlidingWindow(
    state: RateLimitState,
    config: RateLimitConfig,
    now: number
  ): RateLimitResult {
    const windowStart = now - config.window;
    if (state.reset <= windowStart) {
      state.count = 0;
      state.reset = now + config.window;
    }

    if (state.count >= config.maxRequests) {
      state.blocked = true;
      state.blockUntil = now + config.blockDuration;
      this.emitLimitExceeded(state.service, state.key);
      return {
        allowed: false,
        remaining: 0,
        reset: state.blockUntil,
        blocked: true,
        blockUntil: state.blockUntil,
      };
    }

    state.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - state.count,
      reset: state.reset,
      blocked: false,
      blockUntil: 0,
    };
  }

  private checkTokenBucket(
    state: RateLimitState,
    config: RateLimitConfig,
    now: number
  ): RateLimitResult {
    if (!config.tokensPerSecond || !config.bucketSize) {
      throw new Error('Token bucket configuration is incomplete');
    }

    const timePassed = now - state.lastRefill;
    const newTokens = Math.floor(timePassed / 1000 * config.tokensPerSecond);
    state.tokens = Math.min(
      state.tokens + newTokens,
      config.bucketSize
    );
    state.lastRefill = now;

    if (state.tokens < 1) {
      state.blocked = true;
      state.blockUntil = now + config.blockDuration;
      this.emitLimitExceeded(state.service, state.key);
      return {
        allowed: false,
        remaining: 0,
        reset: state.blockUntil,
        blocked: true,
        blockUntil: state.blockUntil,
      };
    }

    state.tokens--;
    return {
      allowed: true,
      remaining: Math.floor(state.tokens),
      reset: now + 1000 / config.tokensPerSecond,
      blocked: false,
      blockUntil: 0,
    };
  }

  async resetLimit(service: string, key: string): Promise<void> {
    const serviceStates = this.states.get(service);
    if (serviceStates) {
      serviceStates.delete(key);
      if (serviceStates.size === 0) {
        this.states.delete(service);
      }
    }
  }

  getLimitState(service: string, key: string): RateLimitState {
    const state = this.getOrCreateState(service, key);
    return { ...state };
  }

  onLimitExceeded(listener: (service: string, key: string) => void): void {
    this.eventEmitter.on('limit:exceeded', listener);
  }

  offLimitExceeded(listener: (service: string, key: string) => void): void {
    this.eventEmitter.off('limit:exceeded', listener);
  }

  setConfig(service: string, config: RateLimitConfig): void {
    this.configs.set(service, config);
  }

  getConfig(service: string): RateLimitConfig {
    const config = this.configs.get(service);
    if (!config) {
      throw new Error(`No rate limit config found for service ${service}`);
    }
    return config;
  }

  resetServiceLimits(service: string): void {
    this.states.delete(service);
  }

  resetAllLimits(): void {
    this.states.clear();
  }

  getServiceLimitCount(service: string): number {
    const serviceStates = this.states.get(service);
    return serviceStates ? serviceStates.size : 0;
  }

  getAllLimitCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const [service, states] of this.states) {
      counts.set(service, states.size);
    }
    return counts;
  }

  getBlockedKeys(service: string): string[] {
    const serviceStates = this.states.get(service);
    if (!serviceStates) {
      return [];
    }

    return Array.from(serviceStates.entries())
      .filter(([_, state]) => state.blocked)
      .map(([key]) => key);
  }

  getAllBlockedKeys(): Map<string, string[]> {
    const blocked = new Map<string, string[]>();
    for (const [service, states] of this.states) {
      const blockedKeys = Array.from(states.entries())
        .filter(([_, state]) => state.blocked)
        .map(([key]) => key);
      if (blockedKeys.length > 0) {
        blocked.set(service, blockedKeys);
      }
    }
    return blocked;
  }
} 