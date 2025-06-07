import { Service } from '../../types';

export class DIService {
  private static instance: DIService;
  private services: Map<string, Service> = new Map();

  private constructor() {}

  static getInstance(): DIService {
    if (!DIService.instance) {
      DIService.instance = new DIService();
    }
    return DIService.instance;
  }

  async initialize(): Promise<void> {
    // Initialize any required resources
  }

  async waitForService(name: string): Promise<Service> {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service;
  }

  registerService(name: string, service: Service): void {
    this.services.set(name, service);
  }

  getService<T extends Service>(name: string): T | undefined {
    return this.services.get(name) as T | undefined;
  }

  async reset(): Promise<void> {
    this.services.clear();
  }

  isInitialized(): boolean {
    return this.services.size > 0;
  }
} 