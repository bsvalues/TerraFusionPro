import { Service, ServiceRegistry } from '../../types';

interface ServiceMetadata {
  name: string;
  version: string;
  dependencies: string[];
  status: 'initialized' | 'error' | 'unknown';
  error?: string;
}

interface ServiceInfo {
  metadata: ServiceMetadata;
  instance: Service;
}

export type { ServiceRegistry };

export class ServiceRegistryImpl implements ServiceRegistry {
  private static instance: ServiceRegistryImpl;
  private services: Map<string, Service> = new Map();
  private serviceListeners: ((serviceName: string, status: ServiceMetadata['status']) => void)[] = [];

  private constructor() {}

  static getInstance(): ServiceRegistryImpl {
    if (!ServiceRegistryImpl.instance) {
      ServiceRegistryImpl.instance = new ServiceRegistryImpl();
    }
    return ServiceRegistryImpl.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.registerServices();
    } catch (error) {
      console.error('Failed to initialize service registry:', error);
      throw error;
    }
  }

  private async registerServices(): Promise<void> {
    try {
      // Register core services
      await this.registerService('config', {
        name: 'ConfigService',
        initialize: async () => {},
        shutdown: async () => {},
      });

      await this.registerService('settings', {
        name: 'SettingsService',
        initialize: async () => {},
        shutdown: async () => {},
      });

      await this.registerService('error', {
        name: 'ErrorService',
        initialize: async () => {},
        shutdown: async () => {},
      });

      await this.registerService('network', {
        name: 'NetworkService',
        initialize: async () => {},
        shutdown: async () => {},
      });

      await this.registerService('logging', {
        name: 'LoggingService',
        initialize: async () => {},
        shutdown: async () => {},
      });

      // Register dependent services
      await this.registerService('analytics', {
        name: 'AnalyticsService',
        initialize: async () => {},
        shutdown: async () => {},
      });

      await this.registerService('monitoring', {
        name: 'MonitoringService',
        initialize: async () => {},
        shutdown: async () => {},
      });

      await this.registerService('storage', {
        name: 'StorageService',
        initialize: async () => {},
        shutdown: async () => {},
      });

      await this.registerService('sync', {
        name: 'SyncService',
        initialize: async () => {},
        shutdown: async () => {},
      });

      await this.registerService('security', {
        name: 'SecurityService',
        initialize: async () => {},
        shutdown: async () => {},
      });

      await this.registerService('notifications', {
        name: 'NotificationService',
        initialize: async () => {},
        shutdown: async () => {},
      });

      await this.registerService('auth', {
        name: 'AuthService',
        initialize: async () => {},
        shutdown: async () => {},
      });
    } catch (error) {
      console.error('Failed to register services:', error);
      throw error;
    }
  }

  registerService(name: string, service: Service): void {
    if (this.services.has(name)) {
      throw new Error(`Service ${name} is already registered`);
    }
    this.services.set(name, service);
    this.notifyServiceListeners(name, 'initialized');
  }

  getService<T extends Service>(name: string): T | undefined {
    return this.services.get(name) as T | undefined;
  }

  getServices(): Map<string, Service> {
    return this.services;
  }

  unregisterService(name: string): void {
    this.services.delete(name);
  }

  getServiceMetadata(key: string): ServiceMetadata {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not found`);
    }
    return {
      name: key,
      version: '1.0.0',
      dependencies: [],
      status: 'initialized',
    };
  }

  getAllServices(): Map<string, ServiceInfo> {
    const result = new Map<string, ServiceInfo>();
    this.services.forEach((service, key) => {
      result.set(key, {
        metadata: this.getServiceMetadata(key),
        instance: service,
      });
    });
    return result;
  }

  getServiceStatus(key: string): ServiceMetadata['status'] {
    const service = this.services.get(key);
    if (!service) {
      return 'unknown';
    }
    return 'initialized';
  }

  addServiceListener(listener: (serviceName: string, status: ServiceMetadata['status']) => void): void {
    this.serviceListeners.push(listener);
  }

  removeServiceListener(listener: (serviceName: string, status: ServiceMetadata['status']) => void): void {
    this.serviceListeners = this.serviceListeners.filter(l => l !== listener);
  }

  private notifyServiceListeners(serviceName: string, status: ServiceMetadata['status']): void {
    this.serviceListeners.forEach(listener => listener(serviceName, status));
  }

  async reset(): Promise<void> {
    try {
      this.services.clear();
      await this.registerServices();
    } catch (error) {
      console.error('Failed to reset service registry:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.services.size > 0;
  }

  getInitializedServices(): string[] {
    return Array.from(this.services.keys());
  }

  getServiceDependencies(key: string): string[] {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not found`);
    }
    return [];
  }

  getDependentServices(key: string): string[] {
    return [];
  }
} 