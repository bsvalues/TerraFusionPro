import { ServiceRegistry } from '../registry/registry';
import { DIService } from '../di/di';
import { ConfigService } from '../config/config';
import { SettingsService } from '../settings/settings';
import { ErrorService } from '../error/error';
import { NetworkService } from '../network/network';
import { LoggingService } from '../logging/logging';
import { AnalyticsService } from '../analytics/analytics';
import { MonitoringService } from '../monitoring/monitoring';
import { StorageService } from '../storage/storage';
import { SyncService } from '../sync/sync';
import { SecurityService } from '../security/security';
import { NotificationService } from '../notifications/notifications';
import { AuthService } from '../auth/auth';

interface ServiceFactory {
  createService<T>(key: string): Promise<T>;
  destroyService(key: string): Promise<void>;
  getService<T>(key: string): T;
  hasService(key: string): boolean;
}

interface ServiceLifecycle {
  initialize(): Promise<void>;
  destroy(): Promise<void>;
}

export class ServiceFactoryImpl implements ServiceFactory {
  private static instance: ServiceFactoryImpl;
  private registry: ServiceRegistry;
  private diService: DIService;
  private services: Map<string, any> = new Map();
  private serviceLifecycles: Map<string, ServiceLifecycle> = new Map();

  private constructor() {
    this.registry = ServiceRegistry.getInstance();
    this.diService = DIService.getInstance();
  }

  static getInstance(): ServiceFactoryImpl {
    if (!ServiceFactoryImpl.instance) {
      ServiceFactoryImpl.instance = new ServiceFactoryImpl();
    }
    return ServiceFactoryImpl.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.registry.initialize();
      await this.initializeServices();
    } catch (error) {
      console.error('Failed to initialize service factory:', error);
      throw error;
    }
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize core services
      await this.createService<ConfigService>('config');
      await this.createService<SettingsService>('settings');
      await this.createService<ErrorService>('error');
      await this.createService<NetworkService>('network');
      await this.createService<LoggingService>('logging');

      // Initialize dependent services
      await this.createService<AnalyticsService>('analytics');
      await this.createService<MonitoringService>('monitoring');
      await this.createService<StorageService>('storage');
      await this.createService<SyncService>('sync');
      await this.createService<SecurityService>('security');
      await this.createService<NotificationService>('notifications');
      await this.createService<AuthService>('auth');
    } catch (error) {
      console.error('Failed to initialize services:', error);
      throw error;
    }
  }

  async createService<T>(key: string): Promise<T> {
    try {
      if (this.hasService(key)) {
        return this.getService<T>(key);
      }

      const service = await this.registry.getService<T>(key);
      this.services.set(key, service);

      if (this.isServiceLifecycle(service)) {
        this.serviceLifecycles.set(key, service);
        await service.initialize();
      }

      return service;
    } catch (error) {
      console.error(`Failed to create service ${key}:`, error);
      throw error;
    }
  }

  async destroyService(key: string): Promise<void> {
    try {
      const service = this.services.get(key);
      if (!service) {
        return;
      }

      const lifecycle = this.serviceLifecycles.get(key);
      if (lifecycle) {
        await lifecycle.destroy();
        this.serviceLifecycles.delete(key);
      }

      this.services.delete(key);
    } catch (error) {
      console.error(`Failed to destroy service ${key}:`, error);
      throw error;
    }
  }

  getService<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not found`);
    }
    return service as T;
  }

  hasService(key: string): boolean {
    return this.services.has(key);
  }

  private isServiceLifecycle(service: any): service is ServiceLifecycle {
    return (
      typeof service === 'object' &&
      service !== null &&
      typeof service.initialize === 'function' &&
      typeof service.destroy === 'function'
    );
  }

  async reset(): Promise<void> {
    try {
      // Destroy services in reverse dependency order
      const services = Array.from(this.services.keys());
      for (const key of services.reverse()) {
        await this.destroyService(key);
      }

      await this.registry.reset();
      await this.initializeServices();
    } catch (error) {
      console.error('Failed to reset service factory:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.registry.isInitialized();
  }

  getInitializedServices(): string[] {
    return Array.from(this.services.keys());
  }

  getServiceDependencies(key: string): string[] {
    return this.registry.getServiceDependencies(key);
  }

  getDependentServices(key: string): string[] {
    return this.registry.getDependentServices(key);
  }
} 