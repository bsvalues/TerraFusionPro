import { ServiceMonitorImpl } from '../monitor/monitor';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface ServiceEndpoint {
  id: string;
  service: string;
  url: string;
  weight: number;
  health: number;
  lastCheck: number;
  status: 'active' | 'inactive' | 'error';
  error?: string;
  connections: number;
  responseTime: number;
  errorRate: number;
}

interface ServicePool {
  service: string;
  endpoints: ServiceEndpoint[];
  strategy: 'round-robin' | 'weighted' | 'least-connections' | 'health-based';
  currentIndex: number;
  failoverThreshold: number;
  retryCount: number;
  retryDelay: number;
}

interface ServiceBalancer {
  initialize(): Promise<void>;
  addEndpoint(endpoint: ServiceEndpoint): Promise<void>;
  removeEndpoint(endpointId: string): Promise<void>;
  getEndpoint(endpointId: string): ServiceEndpoint;
  getAllEndpoints(): Map<string, ServiceEndpoint>;
  getNextEndpoint(service: string): ServiceEndpoint;
  onEndpointUpdate(listener: (endpoint: ServiceEndpoint) => void): void;
  offEndpointUpdate(listener: (endpoint: ServiceEndpoint) => void): void;
}

export class ServiceBalancerImpl implements ServiceBalancer {
  private static instance: ServiceBalancerImpl;
  private monitor: ServiceMonitorImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private endpoints: Map<string, ServiceEndpoint> = new Map();
  private pools: Map<string, ServicePool> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.monitor = ServiceMonitorImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
  }

  static getInstance(): ServiceBalancerImpl {
    if (!ServiceBalancerImpl.instance) {
      ServiceBalancerImpl.instance = new ServiceBalancerImpl();
    }
    return ServiceBalancerImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeBalancer();
    await this.initializationPromise;
  }

  private async initializeBalancer(): Promise<void> {
    try {
      await this.monitor.initialize();
      this.setupEventListeners();
      this.startHealthChecks();
    } catch (error) {
      console.error('Failed to initialize service balancer:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    this.monitor.onHealthUpdate((health) => {
      this.updateEndpointHealth(health);
    });
  }

  private updateEndpointHealth(health: Map<string, any>): void {
    for (const [key, serviceHealth] of health) {
      const endpoint = Array.from(this.endpoints.values()).find(
        (e) => e.service === key
      );
      if (endpoint) {
        endpoint.health = serviceHealth.metrics?.responseTime || 0;
        endpoint.lastCheck = Date.now();
        endpoint.status = serviceHealth.status === 'error' ? 'error' : 'active';
        endpoint.error = serviceHealth.error;
        endpoint.responseTime = serviceHealth.metrics?.responseTime || 0;
        endpoint.errorRate = serviceHealth.metrics?.errorRate || 0;
        this.emitEndpointUpdate(endpoint);
      }
    }
  }

  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      return;
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkEndpointHealth();
      } catch (error) {
        console.error('Failed to check endpoint health:', error);
      }
    }, 30000);
  }

  private async checkEndpointHealth(): Promise<void> {
    for (const [id, endpoint] of this.endpoints) {
      try {
        const response = await fetch(endpoint.url + '/health');
        if (response.ok) {
          const health = await response.json();
          endpoint.health = health.responseTime || 0;
          endpoint.status = 'active';
          endpoint.error = undefined;
          endpoint.responseTime = health.responseTime || 0;
          endpoint.errorRate = health.errorRate || 0;
        } else {
          endpoint.status = 'error';
          endpoint.error = `Health check failed with status ${response.status}`;
          endpoint.errorRate = 1;
        }
      } catch (error) {
        endpoint.status = 'error';
        endpoint.error = error instanceof Error ? error.message : 'Unknown error';
        endpoint.errorRate = 1;
      }
      endpoint.lastCheck = Date.now();
      this.emitEndpointUpdate(endpoint);
    }
  }

  private emitEndpointUpdate(endpoint: ServiceEndpoint): void {
    this.eventEmitter.emit('endpoint:update', endpoint);
  }

  async addEndpoint(endpoint: ServiceEndpoint): Promise<void> {
    try {
      if (this.endpoints.has(endpoint.id)) {
        throw new Error(`Endpoint ${endpoint.id} already exists`);
      }

      this.endpoints.set(endpoint.id, endpoint);
      this.updateServicePool(endpoint.service);
      this.emitEndpointUpdate(endpoint);
    } catch (error) {
      console.error(`Failed to add endpoint ${endpoint.id}:`, error);
      throw error;
    }
  }

  private updateServicePool(service: string): void {
    const endpoints = Array.from(this.endpoints.values()).filter(
      (e) => e.service === service
    );
    if (endpoints.length === 0) {
      this.pools.delete(service);
      return;
    }

    const pool = this.pools.get(service) || {
      service,
      endpoints: [],
      strategy: 'health-based',
      currentIndex: 0,
      failoverThreshold: 3,
      retryCount: 3,
      retryDelay: 1000,
    };

    pool.endpoints = endpoints;
    this.pools.set(service, pool);
  }

  async removeEndpoint(endpointId: string): Promise<void> {
    const endpoint = this.endpoints.get(endpointId);
    if (endpoint) {
      this.endpoints.delete(endpointId);
      this.updateServicePool(endpoint.service);
    }
  }

  getEndpoint(endpointId: string): ServiceEndpoint {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointId} not found`);
    }
    return endpoint;
  }

  getAllEndpoints(): Map<string, ServiceEndpoint> {
    return new Map(this.endpoints);
  }

  getNextEndpoint(service: string): ServiceEndpoint {
    const pool = this.pools.get(service);
    if (!pool || pool.endpoints.length === 0) {
      throw new Error(`No endpoints available for service ${service}`);
    }

    const activeEndpoints = pool.endpoints.filter(
      (e) => e.status === 'active'
    );
    if (activeEndpoints.length === 0) {
      throw new Error(`No active endpoints available for service ${service}`);
    }

    switch (pool.strategy) {
      case 'round-robin':
        return this.getNextRoundRobin(pool);
      case 'weighted':
        return this.getNextWeighted(pool);
      case 'least-connections':
        return this.getNextLeastConnections(pool);
      case 'health-based':
        return this.getNextHealthBased(pool);
      default:
        return this.getNextHealthBased(pool);
    }
  }

  private getNextRoundRobin(pool: ServicePool): ServiceEndpoint {
    const activeEndpoints = pool.endpoints.filter(
      (e) => e.status === 'active'
    );
    pool.currentIndex = (pool.currentIndex + 1) % activeEndpoints.length;
    return activeEndpoints[pool.currentIndex];
  }

  private getNextWeighted(pool: ServicePool): ServiceEndpoint {
    const activeEndpoints = pool.endpoints.filter(
      (e) => e.status === 'active'
    );
    const totalWeight = activeEndpoints.reduce(
      (sum, e) => sum + e.weight,
      0
    );
    let random = Math.random() * totalWeight;
    for (const endpoint of activeEndpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }
    return activeEndpoints[0];
  }

  private getNextLeastConnections(pool: ServicePool): ServiceEndpoint {
    const activeEndpoints = pool.endpoints.filter(
      (e) => e.status === 'active'
    );
    return activeEndpoints.reduce((min, current) => {
      return current.connections < min.connections ? current : min;
    });
  }

  private getNextHealthBased(pool: ServicePool): ServiceEndpoint {
    const activeEndpoints = pool.endpoints.filter(
      (e) => e.status === 'active'
    );
    return activeEndpoints.reduce((best, current) => {
      const bestScore = this.calculateHealthScore(best);
      const currentScore = this.calculateHealthScore(current);
      return currentScore > bestScore ? current : best;
    });
  }

  private calculateHealthScore(endpoint: ServiceEndpoint): number {
    const responseTimeScore = 1 - Math.min(endpoint.responseTime / 1000, 1);
    const errorRateScore = 1 - endpoint.errorRate;
    const connectionScore = 1 - Math.min(endpoint.connections / 100, 1);
    return (responseTimeScore + errorRateScore + connectionScore) / 3;
  }

  onEndpointUpdate(listener: (endpoint: ServiceEndpoint) => void): void {
    this.eventEmitter.on('endpoint:update', listener);
  }

  offEndpointUpdate(listener: (endpoint: ServiceEndpoint) => void): void {
    this.eventEmitter.off('endpoint:update', listener);
  }

  incrementConnectionCount(endpointId: string): void {
    const endpoint = this.getEndpoint(endpointId);
    endpoint.connections++;
    this.emitEndpointUpdate(endpoint);
  }

  decrementConnectionCount(endpointId: string): void {
    const endpoint = this.getEndpoint(endpointId);
    if (endpoint.connections > 0) {
      endpoint.connections--;
      this.emitEndpointUpdate(endpoint);
    }
  }

  getConnectionCount(endpointId: string): number {
    const endpoint = this.getEndpoint(endpointId);
    return endpoint.connections;
  }

  setLoadBalancingStrategy(
    service: string,
    strategy: ServicePool['strategy']
  ): void {
    const pool = this.pools.get(service);
    if (pool) {
      pool.strategy = strategy;
    }
  }

  getLoadBalancingStrategy(service: string): ServicePool['strategy'] {
    const pool = this.pools.get(service);
    if (!pool) {
      throw new Error(`No pool found for service ${service}`);
    }
    return pool.strategy;
  }

  setFailoverThreshold(service: string, threshold: number): void {
    const pool = this.pools.get(service);
    if (pool) {
      pool.failoverThreshold = threshold;
    }
  }

  getFailoverThreshold(service: string): number {
    const pool = this.pools.get(service);
    if (!pool) {
      throw new Error(`No pool found for service ${service}`);
    }
    return pool.failoverThreshold;
  }

  setRetryConfig(
    service: string,
    count: number,
    delay: number
  ): void {
    const pool = this.pools.get(service);
    if (pool) {
      pool.retryCount = count;
      pool.retryDelay = delay;
    }
  }

  getRetryConfig(service: string): { count: number; delay: number } {
    const pool = this.pools.get(service);
    if (!pool) {
      throw new Error(`No pool found for service ${service}`);
    }
    return {
      count: pool.retryCount,
      delay: pool.retryDelay,
    };
  }
} 