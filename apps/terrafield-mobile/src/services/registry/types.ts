import { Service } from '../../types';

export interface ServiceMetadata {
  name: string;
  version: string;
  dependencies: string[];
  status: 'initialized' | 'error' | 'unknown';
  error?: string;
}

export interface ServiceInfo {
  metadata: ServiceMetadata;
  instance: Service;
}

export interface ServiceRegistry {
  getService<T extends Service>(name: string): T | undefined;
  getServices(): Map<string, Service>;
  registerService(name: string, service: Service): void;
  unregisterService(name: string): void;
  getServiceMetadata(key: string): ServiceMetadata;
  getAllServices(): Map<string, ServiceInfo>;
  getServiceStatus(key: string): ServiceMetadata['status'];
  addServiceListener(listener: (serviceName: string, status: ServiceMetadata['status']) => void): void;
  removeServiceListener(listener: (serviceName: string, status: ServiceMetadata['status']) => void): void;
  reset(): Promise<void>;
  isInitialized(): boolean;
  getInitializedServices(): string[];
  getServiceDependencies(key: string): string[];
  getDependentServices(key: string): string[];
} 