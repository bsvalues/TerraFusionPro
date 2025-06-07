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
}

interface ServiceRoute {
  service: string;
  endpoints: ServiceEndpoint[];
  strategy: 'round-robin' | 'weighted' | 'least-connections' | 'health-based';
  currentIndex: number;
  connectionCounts: Map<string, number>;
}

interface ServiceRouter {
  initialize(): Promise<void>;
  addEndpoint(endpoint: ServiceEndpoint): Promise<void>;
  removeEndpoint(endpointId: string): Promise<void>;
  getEndpoint(endpointId: string): ServiceEndpoint;
  getAllEndpoints(): Map<string, ServiceEndpoint>;
  getNextEndpoint(service: string): ServiceEndpoint;
  onEndpointUpdate(listener: (endpoint: ServiceEndpoint) => void): void;
  offEndpointUpdate(listener: (endpoint: ServiceEndpoint) => void): void;
}

export class ServiceRouterImpl implements ServiceRouter {
  private static instance: ServiceRouterImpl;
  private monitor: ServiceMonitorImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private endpoints: Map<string, ServiceEndpoint> = new Map();
  private routes: Map<string, ServiceRoute> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.monitor = ServiceMonitorImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
  }

  static getInstance(): ServiceRouterImpl {
    if (!ServiceRouterImpl.instance) {
      ServiceRouterImpl.instance = new ServiceRouterImpl();
    }
    return ServiceRouterImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeRouter();
    await this.initializationPromise;
  }

  private async initializeRouter(): Promise<void> {
    try {
      await this.monitor.initialize();
      this.setupEventListeners();
      this.startHealthChecks();
    } catch (error) {
      console.error('Failed to initialize service router:', error);
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
        } else {
          endpoint.status = 'error';
          endpoint.error = `Health check failed with status ${response.status}`;
        }
      } catch (error) {
        endpoint.status = 'error';
        endpoint.error = error instanceof Error ? error.message : 'Unknown error';
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
      this.updateServiceRoute(endpoint.service);
      this.emitEndpointUpdate(endpoint);
    } catch (error) {
      console.error(`Failed to add endpoint ${endpoint.id}:`, error);
      throw error;
    }
  }

  private updateServiceRoute(service: string): void {
    const endpoints = Array.from(this.endpoints.values()).filter(
      (e) => e.service === service
    );
    if (endpoints.length === 0) {
      this.routes.delete(service);
      return;
    }

    const route = this.routes.get(service) || {
      service,
      endpoints: [],
      strategy: 'health-based',
      currentIndex: 0,
      connectionCounts: new Map(),
    };

    route.endpoints = endpoints;
    this.routes.set(service, route);
  }

  async removeEndpoint(endpointId: string): Promise<void> {
    const endpoint = this.endpoints.get(endpointId);
    if (endpoint) {
      this.endpoints.delete(endpointId);
      this.updateServiceRoute(endpoint.service);
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
    const route = this.routes.get(service);
    if (!route || route.endpoints.length === 0) {
      throw new Error(`No endpoints available for service ${service}`);
    }

    const activeEndpoints = route.endpoints.filter(
      (e) => e.status === 'active'
    );
    if (activeEndpoints.length === 0) {
      throw new Error(`No active endpoints available for service ${service}`);
    }

    switch (route.strategy) {
      case 'round-robin':
        return this.getNextRoundRobin(route);
      case 'weighted':
        return this.getNextWeighted(route);
      case 'least-connections':
        return this.getNextLeastConnections(route);
      case 'health-based':
        return this.getNextHealthBased(route);
      default:
        return this.getNextHealthBased(route);
    }
  }

  private getNextRoundRobin(route: ServiceRoute): ServiceEndpoint {
    const activeEndpoints = route.endpoints.filter(
      (e) => e.status === 'active'
    );
    route.currentIndex = (route.currentIndex + 1) % activeEndpoints.length;
    return activeEndpoints[route.currentIndex];
  }

  private getNextWeighted(route: ServiceRoute): ServiceEndpoint {
    const activeEndpoints = route.endpoints.filter(
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

  private getNextLeastConnections(route: ServiceRoute): ServiceEndpoint {
    const activeEndpoints = route.endpoints.filter(
      (e) => e.status === 'active'
    );
    return activeEndpoints.reduce((min, current) => {
      const minCount = route.connectionCounts.get(min.id) || 0;
      const currentCount = route.connectionCounts.get(current.id) || 0;
      return currentCount < minCount ? current : min;
    });
  }

  private getNextHealthBased(route: ServiceRoute): ServiceEndpoint {
    const activeEndpoints = route.endpoints.filter(
      (e) => e.status === 'active'
    );
    return activeEndpoints.reduce((best, current) => {
      return current.health < best.health ? current : best;
    });
  }

  onEndpointUpdate(listener: (endpoint: ServiceEndpoint) => void): void {
    this.eventEmitter.on('endpoint:update', listener);
  }

  offEndpointUpdate(listener: (endpoint: ServiceEndpoint) => void): void {
    this.eventEmitter.off('endpoint:update', listener);
  }

  incrementConnectionCount(endpointId: string): void {
    const endpoint = this.getEndpoint(endpointId);
    const route = this.routes.get(endpoint.service);
    if (route) {
      const count = route.connectionCounts.get(endpointId) || 0;
      route.connectionCounts.set(endpointId, count + 1);
    }
  }

  decrementConnectionCount(endpointId: string): void {
    const endpoint = this.getEndpoint(endpointId);
    const route = this.routes.get(endpoint.service);
    if (route) {
      const count = route.connectionCounts.get(endpointId) || 0;
      if (count > 0) {
        route.connectionCounts.set(endpointId, count - 1);
      }
    }
  }

  getConnectionCount(endpointId: string): number {
    const endpoint = this.getEndpoint(endpointId);
    const route = this.routes.get(endpoint.service);
    if (route) {
      return route.connectionCounts.get(endpointId) || 0;
    }
    return 0;
  }

  setRoutingStrategy(service: string, strategy: ServiceRoute['strategy']): void {
    const route = this.routes.get(service);
    if (route) {
      route.strategy = strategy;
    }
  }

  getRoutingStrategy(service: string): ServiceRoute['strategy'] {
    const route = this.routes.get(service);
    if (!route) {
      throw new Error(`No route found for service ${service}`);
    }
    return route.strategy;
  }
} 