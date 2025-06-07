import { ServiceRouterImpl } from '../router/router';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface ProxyRequest {
  id: string;
  service: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  timeout: number;
}

interface ProxyResponse {
  id: string;
  request: ProxyRequest;
  status: number;
  headers: Record<string, string>;
  body?: any;
  error?: string;
  duration: number;
}

interface ServiceProxy {
  initialize(): Promise<void>;
  proxyRequest(request: ProxyRequest): Promise<ProxyResponse>;
  getRequestHistory(): Map<string, ProxyResponse>;
  onRequestComplete(listener: (response: ProxyResponse) => void): void;
  offRequestComplete(listener: (response: ProxyResponse) => void): void;
}

export class ServiceProxyImpl implements ServiceProxy {
  private static instance: ServiceProxyImpl;
  private router: ServiceRouterImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private requestHistory: Map<string, ProxyResponse> = new Map();
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.router = ServiceRouterImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
  }

  static getInstance(): ServiceProxyImpl {
    if (!ServiceProxyImpl.instance) {
      ServiceProxyImpl.instance = new ServiceProxyImpl();
    }
    return ServiceProxyImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeProxy();
    await this.initializationPromise;
  }

  private async initializeProxy(): Promise<void> {
    try {
      await this.router.initialize();
    } catch (error) {
      console.error('Failed to initialize service proxy:', error);
      throw error;
    }
  }

  async proxyRequest(request: ProxyRequest): Promise<ProxyResponse> {
    try {
      const endpoint = this.router.getNextEndpoint(request.service);
      this.router.incrementConnectionCount(endpoint.id);

      const startTime = Date.now();
      const response = await this.executeRequest(endpoint, request);
      const duration = Date.now() - startTime;

      const proxyResponse: ProxyResponse = {
        id: request.id,
        request,
        status: response.status,
        headers: response.headers,
        body: response.body,
        duration,
      };

      this.requestHistory.set(request.id, proxyResponse);
      this.emitRequestComplete(proxyResponse);

      return proxyResponse;
    } catch (error) {
      const proxyResponse: ProxyResponse = {
        id: request.id,
        request,
        status: 500,
        headers: {},
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - request.timestamp,
      };

      this.requestHistory.set(request.id, proxyResponse);
      this.emitRequestComplete(proxyResponse);

      throw error;
    } finally {
      const endpoint = this.router.getEndpoint(request.service);
      this.router.decrementConnectionCount(endpoint.id);
    }
  }

  private async executeRequest(
    endpoint: any,
    request: ProxyRequest
  ): Promise<any> {
    const url = new URL(request.path, endpoint.url);
    const options: RequestInit = {
      method: request.method,
      headers: request.headers,
      body: request.body ? JSON.stringify(request.body) : undefined,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), request.timeout);

    try {
      const response = await fetch(url.toString(), {
        ...options,
        signal: controller.signal,
      });

      const body = await response.json();
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private emitRequestComplete(response: ProxyResponse): void {
    this.eventEmitter.emit('request:complete', response);
  }

  getRequestHistory(): Map<string, ProxyResponse> {
    return new Map(this.requestHistory);
  }

  onRequestComplete(listener: (response: ProxyResponse) => void): void {
    this.eventEmitter.on('request:complete', listener);
  }

  offRequestComplete(listener: (response: ProxyResponse) => void): void {
    this.eventEmitter.off('request:complete', listener);
  }

  getRequestById(requestId: string): ProxyResponse | undefined {
    return this.requestHistory.get(requestId);
  }

  clearRequestHistory(): void {
    this.requestHistory.clear();
  }

  getRequestCount(): number {
    return this.requestHistory.size;
  }

  getAverageResponseTime(): number {
    if (this.requestHistory.size === 0) {
      return 0;
    }

    const totalDuration = Array.from(this.requestHistory.values()).reduce(
      (sum, response) => sum + response.duration,
      0
    );
    return totalDuration / this.requestHistory.size;
  }

  getErrorCount(): number {
    return Array.from(this.requestHistory.values()).filter(
      (response) => response.status >= 400
    ).length;
  }

  getErrorRate(): number {
    if (this.requestHistory.size === 0) {
      return 0;
    }
    return this.getErrorCount() / this.requestHistory.size;
  }
} 