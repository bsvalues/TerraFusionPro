import { ServiceFactoryImpl } from '../factory/factory';
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

interface ServiceManager {
  initialize(): Promise<void>;
  getService<T>(key: string): T;
  hasService(key: string): boolean;
  reset(): Promise<void>;
  isInitialized(): boolean;
  getInitializedServices(): string[];
}

interface ServiceState {
  status: 'initializing' | 'initialized' | 'error';
  error?: string;
  dependencies: string[];
  dependents: string[];
}

export class ServiceManagerImpl implements ServiceManager {
  private static instance: ServiceManagerImpl;
  private factory: ServiceFactoryImpl;
  private registry: ServiceRegistry;
  private diService: DIService;
  private serviceStates: Map<string, ServiceState> = new Map();
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.factory = ServiceFactoryImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.diService = DIService.getInstance();
  }

  static getInstance(): ServiceManagerImpl {
    if (!ServiceManagerImpl.instance) {
      ServiceManagerImpl.instance = new ServiceManagerImpl();
    }
    return ServiceManagerImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeServices();
    await this.initializationPromise;
  }

  private async initializeServices(): Promise<void> {
    try {
      await this.factory.initialize();
      await this.initializeServiceStates();
      await this.initializeCoreServices();
      await this.initializeDependentServices();
    } catch (error) {
      console.error('Failed to initialize services:', error);
      throw error;
    }
  }

  private async initializeServiceStates(): Promise<void> {
    try {
      const services = this.registry.getAllServices();
      for (const [key, service] of services) {
        const dependencies = this.registry.getServiceDependencies(key);
        const dependents = this.registry.getDependentServices(key);
        this.serviceStates.set(key, {
          status: 'initializing',
          dependencies,
          dependents,
        });
      }
    } catch (error) {
      console.error('Failed to initialize service states:', error);
      throw error;
    }
  }

  private async initializeCoreServices(): Promise<void> {
    try {
      // Initialize core services in order
      const coreServices = ['config', 'settings', 'error', 'network', 'logging'];
      for (const key of coreServices) {
        await this.initializeService(key);
      }
    } catch (error) {
      console.error('Failed to initialize core services:', error);
      throw error;
    }
  }

  private async initializeDependentServices(): Promise<void> {
    try {
      // Initialize dependent services in order
      const dependentServices = [
        'analytics',
        'monitoring',
        'storage',
        'sync',
        'security',
        'notifications',
        'auth',
      ];
      for (const key of dependentServices) {
        await this.initializeService(key);
      }
    } catch (error) {
      console.error('Failed to initialize dependent services:', error);
      throw error;
    }
  }

  private async initializeService(key: string): Promise<void> {
    try {
      const state = this.serviceStates.get(key);
      if (!state) {
        throw new Error(`Service state not found for ${key}`);
      }

      if (state.status === 'initialized') {
        return;
      }

      // Check dependencies
      for (const dependency of state.dependencies) {
        const dependencyState = this.serviceStates.get(dependency);
        if (!dependencyState || dependencyState.status !== 'initialized') {
          throw new Error(`Dependency ${dependency} not initialized for ${key}`);
        }
      }

      // Initialize service
      await this.factory.createService(key);
      state.status = 'initialized';
    } catch (error) {
      const state = this.serviceStates.get(key);
      if (state) {
        state.status = 'error';
        state.error = error instanceof Error ? error.message : 'Unknown error';
      }
      throw error;
    }
  }

  getService<T>(key: string): T {
    const state = this.serviceStates.get(key);
    if (!state) {
      throw new Error(`Service ${key} not found`);
    }
    if (state.status !== 'initialized') {
      throw new Error(`Service ${key} not initialized: ${state.error || 'Unknown error'}`);
    }
    return this.factory.getService<T>(key);
  }

  hasService(key: string): boolean {
    return this.factory.hasService(key);
  }

  async reset(): Promise<void> {
    try {
      await this.factory.reset();
      this.serviceStates.clear();
      this.initializationPromise = null;
      await this.initialize();
    } catch (error) {
      console.error('Failed to reset service manager:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.factory.isInitialized();
  }

  getInitializedServices(): string[] {
    return Array.from(this.serviceStates.entries())
      .filter(([_, state]) => state.status === 'initialized')
      .map(([key]) => key);
  }

  getServiceState(key: string): ServiceState | undefined {
    return this.serviceStates.get(key);
  }

  getAllServiceStates(): Map<string, ServiceState> {
    return new Map(this.serviceStates);
  }

  getServiceDependencies(key: string): string[] {
    const state = this.serviceStates.get(key);
    if (!state) {
      throw new Error(`Service ${key} not found`);
    }
    return state.dependencies;
  }

  getServiceDependents(key: string): string[] {
    const state = this.serviceStates.get(key);
    if (!state) {
      throw new Error(`Service ${key} not found`);
    }
    return state.dependents;
  }

  getServiceError(key: string): string | undefined {
    const state = this.serviceStates.get(key);
    if (!state) {
      throw new Error(`Service ${key} not found`);
    }
    return state.error;
  }
} 