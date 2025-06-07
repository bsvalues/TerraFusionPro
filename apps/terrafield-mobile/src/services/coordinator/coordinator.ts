import { ServiceManagerImpl } from '../manager/manager';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface ServiceEvent {
  type: string;
  service: string;
  data?: any;
  timestamp: number;
}

interface ServiceCoordinator {
  initialize(): Promise<void>;
  startService(key: string): Promise<void>;
  stopService(key: string): Promise<void>;
  restartService(key: string): Promise<void>;
  getServiceStatus(key: string): string;
  getAllServiceStatuses(): Map<string, string>;
  onServiceEvent(event: string, listener: (event: ServiceEvent) => void): void;
  offServiceEvent(event: string, listener: (event: ServiceEvent) => void): void;
  emitServiceEvent(event: ServiceEvent): void;
}

export class ServiceCoordinatorImpl implements ServiceCoordinator {
  private static instance: ServiceCoordinatorImpl;
  private manager: ServiceManagerImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private serviceStatuses: Map<string, string> = new Map();
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.manager = ServiceManagerImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
  }

  static getInstance(): ServiceCoordinatorImpl {
    if (!ServiceCoordinatorImpl.instance) {
      ServiceCoordinatorImpl.instance = new ServiceCoordinatorImpl();
    }
    return ServiceCoordinatorImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeCoordinator();
    await this.initializationPromise;
  }

  private async initializeCoordinator(): Promise<void> {
    try {
      await this.manager.initialize();
      await this.initializeServiceStatuses();
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize service coordinator:', error);
      throw error;
    }
  }

  private async initializeServiceStatuses(): Promise<void> {
    try {
      const services = this.registry.getAllServices();
      for (const [key] of services) {
        this.serviceStatuses.set(key, 'stopped');
      }
    } catch (error) {
      console.error('Failed to initialize service statuses:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    this.eventEmitter.on('service:started', (event: ServiceEvent) => {
      this.serviceStatuses.set(event.service, 'running');
    });

    this.eventEmitter.on('service:stopped', (event: ServiceEvent) => {
      this.serviceStatuses.set(event.service, 'stopped');
    });

    this.eventEmitter.on('service:error', (event: ServiceEvent) => {
      this.serviceStatuses.set(event.service, 'error');
    });
  }

  async startService(key: string): Promise<void> {
    try {
      const service = this.manager.getService(key);
      if (typeof service['start'] === 'function') {
        await service['start']();
        this.emitServiceEvent({
          type: 'service:started',
          service: key,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      this.emitServiceEvent({
        type: 'service:error',
        service: key,
        data: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  async stopService(key: string): Promise<void> {
    try {
      const service = this.manager.getService(key);
      if (typeof service['stop'] === 'function') {
        await service['stop']();
        this.emitServiceEvent({
          type: 'service:stopped',
          service: key,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      this.emitServiceEvent({
        type: 'service:error',
        service: key,
        data: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  async restartService(key: string): Promise<void> {
    try {
      await this.stopService(key);
      await this.startService(key);
    } catch (error) {
      console.error(`Failed to restart service ${key}:`, error);
      throw error;
    }
  }

  getServiceStatus(key: string): string {
    return this.serviceStatuses.get(key) || 'unknown';
  }

  getAllServiceStatuses(): Map<string, string> {
    return new Map(this.serviceStatuses);
  }

  onServiceEvent(event: string, listener: (event: ServiceEvent) => void): void {
    this.eventEmitter.on(event, listener);
  }

  offServiceEvent(event: string, listener: (event: ServiceEvent) => void): void {
    this.eventEmitter.off(event, listener);
  }

  emitServiceEvent(event: ServiceEvent): void {
    this.eventEmitter.emit(event.type, event);
  }

  async startAllServices(): Promise<void> {
    try {
      const services = this.registry.getAllServices();
      for (const [key] of services) {
        await this.startService(key);
      }
    } catch (error) {
      console.error('Failed to start all services:', error);
      throw error;
    }
  }

  async stopAllServices(): Promise<void> {
    try {
      const services = this.registry.getAllServices();
      for (const [key] of services) {
        await this.stopService(key);
      }
    } catch (error) {
      console.error('Failed to stop all services:', error);
      throw error;
    }
  }

  async restartAllServices(): Promise<void> {
    try {
      await this.stopAllServices();
      await this.startAllServices();
    } catch (error) {
      console.error('Failed to restart all services:', error);
      throw error;
    }
  }

  getServiceHealth(key: string): { status: string; lastError?: string } {
    const status = this.getServiceStatus(key);
    const state = this.manager.getServiceState(key);
    return {
      status,
      lastError: state?.error,
    };
  }

  getAllServiceHealth(): Map<string, { status: string; lastError?: string }> {
    const health = new Map<string, { status: string; lastError?: string }>();
    const services = this.registry.getAllServices();
    for (const [key] of services) {
      health.set(key, this.getServiceHealth(key));
    }
    return health;
  }
} 