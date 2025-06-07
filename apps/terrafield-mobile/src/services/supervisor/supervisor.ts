import { ServiceCoordinatorImpl } from '../coordinator/coordinator';
import { ServiceMonitorImpl } from '../monitor/monitor';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface ServiceState {
  status: string;
  lastError?: string;
  restartCount: number;
  lastRestart?: number;
  recoveryAttempts: number;
  maxRecoveryAttempts: number;
  recoveryWindow: number;
  recoveryWindowStart?: number;
}

interface ServiceSupervisor {
  initialize(): Promise<void>;
  startSupervision(): Promise<void>;
  stopSupervision(): Promise<void>;
  getServiceState(key: string): ServiceState;
  getAllServiceStates(): Map<string, ServiceState>;
  onStateUpdate(listener: (state: Map<string, ServiceState>) => void): void;
  offStateUpdate(listener: (state: Map<string, ServiceState>) => void): void;
}

export class ServiceSupervisorImpl implements ServiceSupervisor {
  private static instance: ServiceSupervisorImpl;
  private coordinator: ServiceCoordinatorImpl;
  private monitor: ServiceMonitorImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private serviceStates: Map<string, ServiceState> = new Map();
  private supervisionInterval: NodeJS.Timeout | null = null;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.coordinator = ServiceCoordinatorImpl.getInstance();
    this.monitor = ServiceMonitorImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
  }

  static getInstance(): ServiceSupervisorImpl {
    if (!ServiceSupervisorImpl.instance) {
      ServiceSupervisorImpl.instance = new ServiceSupervisorImpl();
    }
    return ServiceSupervisorImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeSupervisor();
    await this.initializationPromise;
  }

  private async initializeSupervisor(): Promise<void> {
    try {
      await this.coordinator.initialize();
      await this.monitor.initialize();
      await this.initializeServiceStates();
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize service supervisor:', error);
      throw error;
    }
  }

  private async initializeServiceStates(): Promise<void> {
    try {
      const services = this.registry.getAllServices();
      for (const [key] of services) {
        this.serviceStates.set(key, {
          status: 'unknown',
          restartCount: 0,
          recoveryAttempts: 0,
          maxRecoveryAttempts: 3,
          recoveryWindow: 3600000,
        });
      }
    } catch (error) {
      console.error('Failed to initialize service states:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    this.monitor.onHealthUpdate((health) => {
      this.checkServiceHealth(health);
    });
  }

  private checkServiceHealth(health: Map<string, any>): void {
    for (const [key, serviceHealth] of health) {
      const state = this.serviceStates.get(key);
      if (state && serviceHealth.status === 'error') {
        this.handleServiceError(key, serviceHealth.error);
      }
    }
  }

  private async handleServiceError(key: string, error?: string): Promise<void> {
    const state = this.serviceStates.get(key);
    if (!state) {
      return;
    }

    state.status = 'error';
    state.lastError = error;
    this.emitStateUpdate();

    if (this.shouldAttemptRecovery(state)) {
      await this.attemptRecovery(key);
    }
  }

  private shouldAttemptRecovery(state: ServiceState): boolean {
    const now = Date.now();
    if (!state.recoveryWindowStart) {
      state.recoveryWindowStart = now;
      return true;
    }

    if (now - state.recoveryWindowStart > state.recoveryWindow) {
      state.recoveryAttempts = 0;
      state.recoveryWindowStart = now;
      return true;
    }

    return state.recoveryAttempts < state.maxRecoveryAttempts;
  }

  private async attemptRecovery(key: string): Promise<void> {
    const state = this.serviceStates.get(key);
    if (!state) {
      return;
    }

    try {
      state.recoveryAttempts++;
      state.lastRestart = Date.now();
      state.restartCount++;

      await this.coordinator.restartService(key);
      state.status = 'running';
      this.emitStateUpdate();
    } catch (error) {
      state.status = 'error';
      state.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.emitStateUpdate();
    }
  }

  private emitStateUpdate(): void {
    this.eventEmitter.emit('state:update', new Map(this.serviceStates));
  }

  async startSupervision(): Promise<void> {
    if (this.supervisionInterval) {
      return;
    }

    this.supervisionInterval = setInterval(async () => {
      try {
        await this.checkRecoveryWindows();
      } catch (error) {
        console.error('Failed to check recovery windows:', error);
      }
    }, 60000);
  }

  private async checkRecoveryWindows(): Promise<void> {
    const now = Date.now();
    for (const [key, state] of this.serviceStates) {
      if (state.recoveryWindowStart && now - state.recoveryWindowStart > state.recoveryWindow) {
        state.recoveryAttempts = 0;
        state.recoveryWindowStart = undefined;
        if (state.status === 'error') {
          await this.attemptRecovery(key);
        }
      }
    }
  }

  async stopSupervision(): Promise<void> {
    if (this.supervisionInterval) {
      clearInterval(this.supervisionInterval);
      this.supervisionInterval = null;
    }
  }

  getServiceState(key: string): ServiceState {
    const state = this.serviceStates.get(key);
    if (!state) {
      throw new Error(`Service ${key} not found`);
    }
    return state;
  }

  getAllServiceStates(): Map<string, ServiceState> {
    return new Map(this.serviceStates);
  }

  onStateUpdate(listener: (state: Map<string, ServiceState>) => void): void {
    this.eventEmitter.on('state:update', listener);
  }

  offStateUpdate(listener: (state: Map<string, ServiceState>) => void): void {
    this.eventEmitter.off('state:update', listener);
  }

  getServiceRestartCount(key: string): number {
    const state = this.getServiceState(key);
    return state.restartCount;
  }

  getServiceLastRestart(key: string): number | undefined {
    const state = this.getServiceState(key);
    return state.lastRestart;
  }

  getServiceRecoveryAttempts(key: string): number {
    const state = this.getServiceState(key);
    return state.recoveryAttempts;
  }

  getServiceMaxRecoveryAttempts(key: string): number {
    const state = this.getServiceState(key);
    return state.maxRecoveryAttempts;
  }

  setServiceMaxRecoveryAttempts(key: string, maxAttempts: number): void {
    const state = this.getServiceState(key);
    state.maxRecoveryAttempts = maxAttempts;
    this.emitStateUpdate();
  }

  getServiceRecoveryWindow(key: string): number {
    const state = this.getServiceState(key);
    return state.recoveryWindow;
  }

  setServiceRecoveryWindow(key: string, window: number): void {
    const state = this.getServiceState(key);
    state.recoveryWindow = window;
    this.emitStateUpdate();
  }

  resetServiceRecoveryState(key: string): void {
    const state = this.getServiceState(key);
    state.recoveryAttempts = 0;
    state.recoveryWindowStart = undefined;
    this.emitStateUpdate();
  }
} 