import { ServiceOrchestratorImpl } from '../orchestrator/orchestrator';
import { ServiceMonitorImpl } from '../monitor/monitor';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface ScheduledTask {
  id: string;
  name: string;
  service: string;
  action: string;
  params?: any;
  schedule: string;
  lastRun?: number;
  nextRun?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  retryCount?: number;
  timeout?: number;
}

interface ServiceScheduler {
  initialize(): Promise<void>;
  scheduleTask(task: ScheduledTask): Promise<void>;
  cancelTask(taskId: string): Promise<void>;
  getTaskStatus(taskId: string): ScheduledTask;
  getAllTaskStatuses(): Map<string, ScheduledTask>;
  onTaskUpdate(listener: (task: ScheduledTask) => void): void;
  offTaskUpdate(listener: (task: ScheduledTask) => void): void;
}

export class ServiceSchedulerImpl implements ServiceScheduler {
  private static instance: ServiceSchedulerImpl;
  private orchestrator: ServiceOrchestratorImpl;
  private monitor: ServiceMonitorImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private tasks: Map<string, ScheduledTask> = new Map();
  private schedulerInterval: NodeJS.Timeout | null = null;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.orchestrator = ServiceOrchestratorImpl.getInstance();
    this.monitor = ServiceMonitorImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
  }

  static getInstance(): ServiceSchedulerImpl {
    if (!ServiceSchedulerImpl.instance) {
      ServiceSchedulerImpl.instance = new ServiceSchedulerImpl();
    }
    return ServiceSchedulerImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeScheduler();
    await this.initializationPromise;
  }

  private async initializeScheduler(): Promise<void> {
    try {
      await this.orchestrator.initialize();
      await this.monitor.initialize();
      this.setupEventListeners();
      this.startScheduler();
    } catch (error) {
      console.error('Failed to initialize service scheduler:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    this.monitor.onHealthUpdate((health) => {
      this.checkTaskHealth(health);
    });
  }

  private checkTaskHealth(health: Map<string, any>): void {
    for (const [taskId, task] of this.tasks) {
      if (task.status === 'running') {
        const serviceHealth = health.get(task.service);
        if (serviceHealth && serviceHealth.status === 'error') {
          this.handleTaskError(taskId, `Service ${task.service} is in error state`);
        }
      }
    }
  }

  private startScheduler(): void {
    if (this.schedulerInterval) {
      return;
    }

    this.schedulerInterval = setInterval(async () => {
      try {
        await this.processScheduledTasks();
      } catch (error) {
        console.error('Failed to process scheduled tasks:', error);
      }
    }, 1000);
  }

  private async processScheduledTasks(): Promise<void> {
    const now = Date.now();
    for (const [taskId, task] of this.tasks) {
      if (task.status === 'pending' && task.nextRun && task.nextRun <= now) {
        await this.executeTask(taskId);
      }
    }
  }

  private async executeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return;
    }

    try {
      task.status = 'running';
      task.lastRun = Date.now();
      this.emitTaskUpdate(task);

      const workflow = {
        id: taskId,
        name: task.name,
        steps: [
          {
            service: task.service,
            action: task.action,
            params: task.params,
            retryCount: task.retryCount,
            timeout: task.timeout,
          },
        ],
        status: 'running',
        currentStep: 0,
      };

      await this.orchestrator.startWorkflow(workflow);
      this.scheduleNextRun(taskId);
    } catch (error) {
      this.handleTaskError(taskId, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private scheduleNextRun(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      return;
    }

    try {
      const nextRun = this.calculateNextRun(task.schedule);
      task.nextRun = nextRun;
      task.status = 'pending';
      this.emitTaskUpdate(task);
    } catch (error) {
      this.handleTaskError(taskId, `Failed to schedule next run: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateNextRun(schedule: string): number {
    const now = new Date();
    const parts = schedule.split(' ');
    if (parts.length !== 5) {
      throw new Error('Invalid schedule format. Expected format: "minute hour day month weekday"');
    }

    const [minute, hour, day, month, weekday] = parts;
    const nextRun = new Date(now);

    if (minute !== '*') {
      nextRun.setMinutes(parseInt(minute));
    }
    if (hour !== '*') {
      nextRun.setHours(parseInt(hour));
    }
    if (day !== '*') {
      nextRun.setDate(parseInt(day));
    }
    if (month !== '*') {
      nextRun.setMonth(parseInt(month) - 1);
    }
    if (weekday !== '*') {
      nextRun.setDate(now.getDate() + ((parseInt(weekday) - now.getDay() + 7) % 7));
    }

    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun.getTime();
  }

  private handleTaskError(taskId: string, error: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'failed';
      task.error = error;
      this.emitTaskUpdate(task);
    }
  }

  private emitTaskUpdate(task: ScheduledTask): void {
    this.eventEmitter.emit('task:update', task);
  }

  async scheduleTask(task: ScheduledTask): Promise<void> {
    try {
      if (this.tasks.has(task.id)) {
        throw new Error(`Task ${task.id} already exists`);
      }

      task.status = 'pending';
      task.nextRun = this.calculateNextRun(task.schedule);
      this.tasks.set(task.id, task);
      this.emitTaskUpdate(task);
    } catch (error) {
      console.error(`Failed to schedule task ${task.id}:`, error);
      throw error;
    }
  }

  async cancelTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'running') {
      await this.orchestrator.stopWorkflow(taskId);
      task.status = 'failed';
      task.error = 'Task cancelled by user';
      this.emitTaskUpdate(task);
    }
  }

  getTaskStatus(taskId: string): ScheduledTask {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    return task;
  }

  getAllTaskStatuses(): Map<string, ScheduledTask> {
    return new Map(this.tasks);
  }

  onTaskUpdate(listener: (task: ScheduledTask) => void): void {
    this.eventEmitter.on('task:update', listener);
  }

  offTaskUpdate(listener: (task: ScheduledTask) => void): void {
    this.eventEmitter.off('task:update', listener);
  }

  getTaskNextRun(taskId: string): number | undefined {
    const task = this.getTaskStatus(taskId);
    return task.nextRun;
  }

  getTaskLastRun(taskId: string): number | undefined {
    const task = this.getTaskStatus(taskId);
    return task.lastRun;
  }

  getTaskSchedule(taskId: string): string {
    const task = this.getTaskStatus(taskId);
    return task.schedule;
  }

  updateTaskSchedule(taskId: string, schedule: string): void {
    const task = this.getTaskStatus(taskId);
    task.schedule = schedule;
    task.nextRun = this.calculateNextRun(schedule);
    this.emitTaskUpdate(task);
  }

  getTaskService(taskId: string): string {
    const task = this.getTaskStatus(taskId);
    return task.service;
  }

  getTaskAction(taskId: string): string {
    const task = this.getTaskStatus(taskId);
    return task.action;
  }

  getTaskParams(taskId: string): any {
    const task = this.getTaskStatus(taskId);
    return task.params;
  }

  updateTaskParams(taskId: string, params: any): void {
    const task = this.getTaskStatus(taskId);
    task.params = params;
    this.emitTaskUpdate(task);
  }
} 