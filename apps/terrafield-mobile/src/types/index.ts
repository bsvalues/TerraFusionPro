export interface Metric {
  name: string;
  value?: number;
  values?: { [key: string]: number | string | boolean };
  timestamp: number;
}

export interface Service {
  name: string;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

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

export interface SettingsState {
  theme: string;
  language: string;
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
  logging: {
    level: string;
    enabled: boolean;
  };
}

export interface RootState {
  settings: SettingsState;
}

export interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  buildNumber: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
  preferences: {
    theme: string;
    language: string;
    notifications: boolean;
  };
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
} 