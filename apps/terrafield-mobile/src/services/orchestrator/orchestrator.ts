import { ServiceCoordinatorImpl } from '../coordinator/coordinator';
import { ServiceMonitorImpl } from '../monitor/monitor';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface WorkflowStep {
  service: string;
  action: string;
  params?: any;
  retryCount?: number;
  timeout?: number;
  dependsOn?: string[];
}

interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentStep?: number;
  error?: string;
  startTime?: number;
  endTime?: number;
}

interface ServiceOrchestrator {
  initialize(): Promise<void>;
  startWorkflow(workflow: Workflow): Promise<void>;
  stopWorkflow(workflowId: string): Promise<void>;
  getWorkflowStatus(workflowId: string): Workflow;
  getAllWorkflowStatuses(): Map<string, Workflow>;
  onWorkflowUpdate(listener: (workflow: Workflow) => void): void;
  offWorkflowUpdate(listener: (workflow: Workflow) => void): void;
}

export class ServiceOrchestratorImpl implements ServiceOrchestrator {
  private static instance: ServiceOrchestratorImpl;
  private coordinator: ServiceCoordinatorImpl;
  private monitor: ServiceMonitorImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private workflows: Map<string, Workflow> = new Map();
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.coordinator = ServiceCoordinatorImpl.getInstance();
    this.monitor = ServiceMonitorImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
  }

  static getInstance(): ServiceOrchestratorImpl {
    if (!ServiceOrchestratorImpl.instance) {
      ServiceOrchestratorImpl.instance = new ServiceOrchestratorImpl();
    }
    return ServiceOrchestratorImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeOrchestrator();
    await this.initializationPromise;
  }

  private async initializeOrchestrator(): Promise<void> {
    try {
      await this.coordinator.initialize();
      await this.monitor.initialize();
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize service orchestrator:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    this.monitor.onHealthUpdate((health) => {
      this.checkWorkflowHealth(health);
    });
  }

  private checkWorkflowHealth(health: Map<string, any>): void {
    for (const [workflowId, workflow] of this.workflows) {
      if (workflow.status === 'running' && workflow.currentStep !== undefined) {
        const step = workflow.steps[workflow.currentStep];
        const serviceHealth = health.get(step.service);
        if (serviceHealth && serviceHealth.status === 'error') {
          this.handleWorkflowError(workflowId, `Service ${step.service} is in error state`);
        }
      }
    }
  }

  async startWorkflow(workflow: Workflow): Promise<void> {
    try {
      if (this.workflows.has(workflow.id)) {
        throw new Error(`Workflow ${workflow.id} already exists`);
      }

      workflow.status = 'running';
      workflow.startTime = Date.now();
      workflow.currentStep = 0;
      this.workflows.set(workflow.id, workflow);

      await this.executeWorkflowStep(workflow);
    } catch (error) {
      this.handleWorkflowError(workflow.id, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async executeWorkflowStep(workflow: Workflow): Promise<void> {
    try {
      if (workflow.currentStep === undefined || workflow.currentStep >= workflow.steps.length) {
        this.completeWorkflow(workflow.id);
        return;
      }

      const step = workflow.steps[workflow.currentStep];
      if (step.dependsOn) {
        await this.waitForDependencies(workflow.id, step.dependsOn);
      }

      const service = this.coordinator.getService(step.service);
      if (typeof service[step.action] !== 'function') {
        throw new Error(`Action ${step.action} not found in service ${step.service}`);
      }

      await this.executeWithRetry(workflow.id, step);
      workflow.currentStep++;
      await this.executeWorkflowStep(workflow);
    } catch (error) {
      this.handleWorkflowError(workflow.id, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async waitForDependencies(workflowId: string, dependencies: string[]): Promise<void> {
    for (const dependency of dependencies) {
      const dependentWorkflow = Array.from(this.workflows.values()).find(
        (w) => w.steps.some((s) => s.service === dependency)
      );
      if (dependentWorkflow && dependentWorkflow.status === 'running') {
        await new Promise((resolve) => {
          const listener = (workflow: Workflow) => {
            if (workflow.id === dependentWorkflow.id && workflow.status !== 'running') {
              this.eventEmitter.off('workflow:update', listener);
              resolve(undefined);
            }
          };
          this.eventEmitter.on('workflow:update', listener);
        });
      }
    }
  }

  private async executeWithRetry(workflowId: string, step: WorkflowStep): Promise<void> {
    const maxRetries = step.retryCount || 3;
    const timeout = step.timeout || 30000;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const service = this.coordinator.getService(step.service);
        await Promise.race([
          service[step.action](step.params),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
          ),
        ]);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError;
  }

  private completeWorkflow(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.status = 'completed';
      workflow.endTime = Date.now();
      this.emitWorkflowUpdate(workflow);
    }
  }

  private handleWorkflowError(workflowId: string, error: string): void {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.status = 'failed';
      workflow.error = error;
      workflow.endTime = Date.now();
      this.emitWorkflowUpdate(workflow);
    }
  }

  private emitWorkflowUpdate(workflow: Workflow): void {
    this.eventEmitter.emit('workflow:update', workflow);
  }

  async stopWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (workflow && workflow.status === 'running') {
      workflow.status = 'failed';
      workflow.error = 'Workflow stopped by user';
      workflow.endTime = Date.now();
      this.emitWorkflowUpdate(workflow);
    }
  }

  getWorkflowStatus(workflowId: string): Workflow {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    return workflow;
  }

  getAllWorkflowStatuses(): Map<string, Workflow> {
    return new Map(this.workflows);
  }

  onWorkflowUpdate(listener: (workflow: Workflow) => void): void {
    this.eventEmitter.on('workflow:update', listener);
  }

  offWorkflowUpdate(listener: (workflow: Workflow) => void): void {
    this.eventEmitter.off('workflow:update', listener);
  }

  getWorkflowProgress(workflowId: string): number {
    const workflow = this.getWorkflowStatus(workflowId);
    if (workflow.currentStep === undefined) {
      return 0;
    }
    return (workflow.currentStep / workflow.steps.length) * 100;
  }

  getWorkflowDuration(workflowId: string): number {
    const workflow = this.getWorkflowStatus(workflowId);
    if (!workflow.startTime) {
      return 0;
    }
    return (workflow.endTime || Date.now()) - workflow.startTime;
  }

  getWorkflowDependencies(workflowId: string): string[] {
    const workflow = this.getWorkflowStatus(workflowId);
    const dependencies = new Set<string>();
    for (const step of workflow.steps) {
      if (step.dependsOn) {
        step.dependsOn.forEach((dep) => dependencies.add(dep));
      }
    }
    return Array.from(dependencies);
  }

  getWorkflowDependents(workflowId: string): string[] {
    const workflow = this.getWorkflowStatus(workflowId);
    const dependents = new Set<string>();
    for (const [id, w] of this.workflows) {
      if (id !== workflowId) {
        for (const step of w.steps) {
          if (step.dependsOn?.includes(workflowId)) {
            dependents.add(id);
          }
        }
      }
    }
    return Array.from(dependents);
  }
} 