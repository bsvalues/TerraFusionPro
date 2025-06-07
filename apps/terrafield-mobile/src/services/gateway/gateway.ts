import { ServiceProxyImpl } from '../proxy/proxy';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface GatewayRoute {
  path: string;
  service: string;
  method: string;
  auth: boolean;
  rateLimit: number;
  timeout: number;
  cache: boolean;
  cacheTTL: number;
}

interface GatewayRequest {
  id: string;
  path: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
}

interface GatewayResponse {
  id: string;
  request: GatewayRequest;
  status: number;
  headers: Record<string, string>;
  body?: any;
  error?: string;
  duration: number;
}

interface ServiceGateway {
  initialize(): Promise<void>;
  addRoute(route: GatewayRoute): Promise<void>;
  removeRoute(path: string): Promise<void>;
  getRoute(path: string): GatewayRoute;
  getAllRoutes(): Map<string, GatewayRoute>;
  handleRequest(request: GatewayRequest): Promise<GatewayResponse>;
  onRequestComplete(listener: (response: GatewayResponse) => void): void;
  offRequestComplete(listener: (response: GatewayResponse) => void): void;
}

export class ServiceGatewayImpl implements ServiceGateway {
  private static instance: ServiceGatewayImpl;
  private proxy: ServiceProxyImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private routes: Map<string, GatewayRoute> = new Map();
  private requestCache: Map<string, { response: GatewayResponse; expiry: number }> = new Map();
  private rateLimits: Map<string, { count: number; reset: number }> = new Map();
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.proxy = ServiceProxyImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
  }

  static getInstance(): ServiceGatewayImpl {
    if (!ServiceGatewayImpl.instance) {
      ServiceGatewayImpl.instance = new ServiceGatewayImpl();
    }
    return ServiceGatewayImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeGateway();
    await this.initializationPromise;
  }

  private async initializeGateway(): Promise<void> {
    try {
      await this.proxy.initialize();
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize service gateway:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    this.proxy.onRequestComplete((response) => {
      this.handleProxyResponse(response);
    });
  }

  private handleProxyResponse(response: any): void {
    const gatewayResponse: GatewayResponse = {
      id: response.id,
      request: response.request,
      status: response.status,
      headers: response.headers,
      body: response.body,
      error: response.error,
      duration: response.duration,
    };

    this.emitRequestComplete(gatewayResponse);
  }

  async addRoute(route: GatewayRoute): Promise<void> {
    try {
      if (this.routes.has(route.path)) {
        throw new Error(`Route ${route.path} already exists`);
      }

      this.routes.set(route.path, route);
    } catch (error) {
      console.error(`Failed to add route ${route.path}:`, error);
      throw error;
    }
  }

  async removeRoute(path: string): Promise<void> {
    this.routes.delete(path);
  }

  getRoute(path: string): GatewayRoute {
    const route = this.routes.get(path);
    if (!route) {
      throw new Error(`Route ${path} not found`);
    }
    return route;
  }

  getAllRoutes(): Map<string, GatewayRoute> {
    return new Map(this.routes);
  }

  async handleRequest(request: GatewayRequest): Promise<GatewayResponse> {
    try {
      const route = this.findMatchingRoute(request.path);
      if (!route) {
        throw new Error(`No route found for path ${request.path}`);
      }

      if (route.auth) {
        await this.validateAuth(request);
      }

      if (route.rateLimit) {
        await this.checkRateLimit(request.path);
      }

      if (route.cache) {
        const cachedResponse = this.getCachedResponse(request);
        if (cachedResponse) {
          return cachedResponse;
        }
      }

      const proxyRequest = this.createProxyRequest(request, route);
      const proxyResponse = await this.proxy.proxyRequest(proxyRequest);

      const gatewayResponse: GatewayResponse = {
        id: request.id,
        request,
        status: proxyResponse.status,
        headers: proxyResponse.headers,
        body: proxyResponse.body,
        error: proxyResponse.error,
        duration: proxyResponse.duration,
      };

      if (route.cache) {
        this.cacheResponse(request, gatewayResponse, route.cacheTTL);
      }

      return gatewayResponse;
    } catch (error) {
      const gatewayResponse: GatewayResponse = {
        id: request.id,
        request,
        status: 500,
        headers: {},
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - request.timestamp,
      };

      this.emitRequestComplete(gatewayResponse);
      throw error;
    }
  }

  private findMatchingRoute(path: string): GatewayRoute | undefined {
    return Array.from(this.routes.values()).find((route) => {
      const pattern = new RegExp(
        '^' + route.path.replace(/:\w+/g, '[^/]+') + '$'
      );
      return pattern.test(path);
    });
  }

  private async validateAuth(request: GatewayRequest): Promise<void> {
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      throw new Error('Authentication required');
    }

    // Implement your authentication logic here
    // For example, validate JWT token, check permissions, etc.
  }

  private async checkRateLimit(path: string): Promise<void> {
    const now = Date.now();
    const limit = this.rateLimits.get(path);

    if (limit && now < limit.reset) {
      if (limit.count >= this.getRoute(path).rateLimit) {
        throw new Error('Rate limit exceeded');
      }
      limit.count++;
    } else {
      this.rateLimits.set(path, {
        count: 1,
        reset: now + 60000, // Reset after 1 minute
      });
    }
  }

  private getCachedResponse(request: GatewayRequest): GatewayResponse | undefined {
    const cacheKey = this.getCacheKey(request);
    const cached = this.requestCache.get(cacheKey);

    if (cached && Date.now() < cached.expiry) {
      return cached.response;
    }

    this.requestCache.delete(cacheKey);
    return undefined;
  }

  private cacheResponse(
    request: GatewayRequest,
    response: GatewayResponse,
    ttl: number
  ): void {
    const cacheKey = this.getCacheKey(request);
    this.requestCache.set(cacheKey, {
      response,
      expiry: Date.now() + ttl,
    });
  }

  private getCacheKey(request: GatewayRequest): string {
    return `${request.method}:${request.path}:${JSON.stringify(request.body)}`;
  }

  private createProxyRequest(
    request: GatewayRequest,
    route: GatewayRoute
  ): any {
    return {
      id: request.id,
      service: route.service,
      method: route.method,
      path: request.path,
      headers: request.headers,
      body: request.body,
      timestamp: request.timestamp,
      timeout: route.timeout,
    };
  }

  private emitRequestComplete(response: GatewayResponse): void {
    this.eventEmitter.emit('request:complete', response);
  }

  onRequestComplete(listener: (response: GatewayResponse) => void): void {
    this.eventEmitter.on('request:complete', listener);
  }

  offRequestComplete(listener: (response: GatewayResponse) => void): void {
    this.eventEmitter.off('request:complete', listener);
  }

  clearCache(): void {
    this.requestCache.clear();
  }

  clearRateLimits(): void {
    this.rateLimits.clear();
  }

  getCacheSize(): number {
    return this.requestCache.size;
  }

  getRateLimitCount(path: string): number {
    const limit = this.rateLimits.get(path);
    return limit ? limit.count : 0;
  }
} 