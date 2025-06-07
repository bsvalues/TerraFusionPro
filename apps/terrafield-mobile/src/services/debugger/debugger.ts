import { ServiceLoggerImpl } from '../logger/logger';
import { ServiceMetricsImpl } from '../metrics/metrics';
import { ServiceInspectorImpl } from '../inspector/inspector';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface DebugSession {
  id: string;
  name: string;
  description: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'paused' | 'stopped';
  breakpoints: Breakpoint[];
  watches: Watch[];
  logs: DebugLog[];
  stack: StackFrame[];
  variables: Record<string, any>;
}

interface Breakpoint {
  id: string;
  line: number;
  column: number;
  condition?: string;
  hitCount: number;
  enabled: boolean;
}

interface Watch {
  id: string;
  expression: string;
  value: any;
  type: string;
}

interface DebugLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

interface StackFrame {
  id: string;
  name: string;
  line: number;
  column: number;
  source: string;
  variables: Record<string, any>;
}

interface DebugConfig {
  timeout: number;
  maxBreakpoints: number;
  maxWatches: number;
  maxLogs: number;
  defaultActions: {
    type: 'log' | 'metrics' | 'inspect';
    config: Record<string, any>;
  }[];
}

interface ServiceDebugger {
  initialize(): Promise<void>;
  startSession(name: string, description?: string): Promise<DebugSession>;
  stopSession(sessionId: string): void;
  pauseSession(sessionId: string): void;
  resumeSession(sessionId: string): void;
  addBreakpoint(sessionId: string, breakpoint: Breakpoint): void;
  removeBreakpoint(sessionId: string, breakpointId: string): void;
  addWatch(sessionId: string, watch: Watch): void;
  removeWatch(sessionId: string, watchId: string): void;
  getSession(sessionId: string): DebugSession;
  getSessions(): DebugSession[];
  onDebug(listener: (event: any) => void): void;
  offDebug(listener: (event: any) => void): void;
}

export class ServiceDebuggerImpl implements ServiceDebugger {
  private static instance: ServiceDebuggerImpl;
  private logger: ServiceLoggerImpl;
  private metrics: ServiceMetricsImpl;
  private inspector: ServiceInspectorImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private sessions: Map<string, DebugSession> = new Map();
  private config: DebugConfig;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.logger = ServiceLoggerImpl.getInstance();
    this.metrics = ServiceMetricsImpl.getInstance();
    this.inspector = ServiceInspectorImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
    this.config = {
      timeout: 30000,
      maxBreakpoints: 100,
      maxWatches: 50,
      maxLogs: 1000,
      defaultActions: [
        {
          type: 'log',
          config: {},
        },
      ],
    };
  }

  static getInstance(): ServiceDebuggerImpl {
    if (!ServiceDebuggerImpl.instance) {
      ServiceDebuggerImpl.instance = new ServiceDebuggerImpl();
    }
    return ServiceDebuggerImpl.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeDebugger();
    await this.initializationPromise;
  }

  private async initializeDebugger(): Promise<void> {
    try {
      await this.logger.initialize();
      await this.metrics.initialize();
      await this.inspector.initialize();
    } catch (error) {
      console.error('Failed to initialize service debugger:', error);
      throw error;
    }
  }

  private emitDebug(event: any): void {
    this.eventEmitter.emit('debug', event);
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private generateBreakpointId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  private generateWatchId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  private generateStackFrameId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  private async startDebugging(session: DebugSession): Promise<void> {
    try {
      this.logger.info('Starting debug session', {
        sessionId: session.id,
        name: session.name,
      });

      this.emitDebug({
        type: 'session_started',
        sessionId: session.id,
        timestamp: Date.now(),
      });

      await this.setupBreakpoints(session);
      await this.setupWatches(session);
      await this.collectInitialState(session);
    } catch (error) {
      this.logger.error('Failed to start debug session', error, {
        sessionId: session.id,
      });
      throw error;
    }
  }

  private async setupBreakpoints(session: DebugSession): Promise<void> {
    for (const breakpoint of session.breakpoints) {
      try {
        await this.setupBreakpoint(session, breakpoint);
      } catch (error) {
        this.logger.error('Failed to setup breakpoint', error, {
          sessionId: session.id,
          breakpointId: breakpoint.id,
        });
      }
    }
  }

  private async setupBreakpoint(
    session: DebugSession,
    breakpoint: Breakpoint
  ): Promise<void> {
    this.inspector.addPoint({
      id: breakpoint.id,
      name: `Breakpoint ${breakpoint.line}:${breakpoint.column}`,
      description: breakpoint.condition || 'Unconditional breakpoint',
      type: 'breakpoint',
      condition: breakpoint.condition
        ? {
            metric: 'line',
            operator: 'eq',
            value: breakpoint.line,
          }
        : undefined,
      actions: [
        {
          type: 'log',
          config: {
            level: 'info',
            message: `Breakpoint hit at line ${breakpoint.line}`,
          },
        },
      ],
      enabled: breakpoint.enabled,
    });
  }

  private async setupWatches(session: DebugSession): Promise<void> {
    for (const watch of session.watches) {
      try {
        await this.setupWatch(session, watch);
      } catch (error) {
        this.logger.error('Failed to setup watch', error, {
          sessionId: session.id,
          watchId: watch.id,
        });
      }
    }
  }

  private async setupWatch(
    session: DebugSession,
    watch: Watch
  ): Promise<void> {
    this.inspector.addPoint({
      id: watch.id,
      name: `Watch ${watch.expression}`,
      description: 'Expression watch',
      type: 'watch',
      actions: [
        {
          type: 'log',
          config: {
            level: 'info',
            message: `Watch value changed: ${watch.expression}`,
          },
        },
      ],
      enabled: true,
    });
  }

  private async collectInitialState(session: DebugSession): Promise<void> {
    const stack = await this.getCurrentStack();
    const variables = await this.getCurrentVariables();

    session.stack = stack;
    session.variables = variables;

    this.emitDebug({
      type: 'state_updated',
      sessionId: session.id,
      timestamp: Date.now(),
      stack,
      variables,
    });
  }

  private async getCurrentStack(): Promise<StackFrame[]> {
    // Implement stack trace collection
    return [];
  }

  private async getCurrentVariables(): Promise<Record<string, any>> {
    // Implement variable collection
    return {};
  }

  private addDebugLog(
    session: DebugSession,
    level: DebugLog['level'],
    message: string,
    data?: any
  ): void {
    const log: DebugLog = {
      timestamp: Date.now(),
      level,
      message,
      data,
    };

    session.logs.push(log);
    if (session.logs.length > this.config.maxLogs) {
      session.logs = session.logs.slice(-this.config.maxLogs);
    }

    this.emitDebug({
      type: 'log_added',
      sessionId: session.id,
      timestamp: Date.now(),
      log,
    });
  }

  async startSession(
    name: string,
    description?: string
  ): Promise<DebugSession> {
    const session: DebugSession = {
      id: this.generateSessionId(),
      name,
      description: description || '',
      startTime: Date.now(),
      status: 'running',
      breakpoints: [],
      watches: [],
      logs: [],
      stack: [],
      variables: {},
    };

    this.sessions.set(session.id, session);
    await this.startDebugging(session);

    return session;
  }

  stopSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'stopped';
    session.endTime = Date.now();

    this.emitDebug({
      type: 'session_stopped',
      sessionId,
      timestamp: Date.now(),
    });

    this.logger.info('Stopped debug session', {
      sessionId,
      name: session.name,
      duration: session.endTime - session.startTime,
    });
  }

  pauseSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'paused';

    this.emitDebug({
      type: 'session_paused',
      sessionId,
      timestamp: Date.now(),
    });

    this.logger.info('Paused debug session', {
      sessionId,
      name: session.name,
    });
  }

  resumeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'running';

    this.emitDebug({
      type: 'session_resumed',
      sessionId,
      timestamp: Date.now(),
    });

    this.logger.info('Resumed debug session', {
      sessionId,
      name: session.name,
    });
  }

  addBreakpoint(sessionId: string, breakpoint: Breakpoint): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.breakpoints.length >= this.config.maxBreakpoints) {
      throw new Error('Maximum number of breakpoints reached');
    }

    const newBreakpoint = {
      ...breakpoint,
      id: breakpoint.id || this.generateBreakpointId(),
      hitCount: 0,
      enabled: breakpoint.enabled ?? true,
    };

    session.breakpoints.push(newBreakpoint);
    this.setupBreakpoint(session, newBreakpoint);

    this.emitDebug({
      type: 'breakpoint_added',
      sessionId,
      timestamp: Date.now(),
      breakpoint: newBreakpoint,
    });
  }

  removeBreakpoint(sessionId: string, breakpointId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const index = session.breakpoints.findIndex((bp) => bp.id === breakpointId);
    if (index === -1) {
      throw new Error(`Breakpoint ${breakpointId} not found`);
    }

    session.breakpoints.splice(index, 1);
    this.inspector.removePoint(breakpointId);

    this.emitDebug({
      type: 'breakpoint_removed',
      sessionId,
      timestamp: Date.now(),
      breakpointId,
    });
  }

  addWatch(sessionId: string, watch: Watch): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.watches.length >= this.config.maxWatches) {
      throw new Error('Maximum number of watches reached');
    }

    const newWatch = {
      ...watch,
      id: watch.id || this.generateWatchId(),
    };

    session.watches.push(newWatch);
    this.setupWatch(session, newWatch);

    this.emitDebug({
      type: 'watch_added',
      sessionId,
      timestamp: Date.now(),
      watch: newWatch,
    });
  }

  removeWatch(sessionId: string, watchId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const index = session.watches.findIndex((w) => w.id === watchId);
    if (index === -1) {
      throw new Error(`Watch ${watchId} not found`);
    }

    session.watches.splice(index, 1);
    this.inspector.removePoint(watchId);

    this.emitDebug({
      type: 'watch_removed',
      sessionId,
      timestamp: Date.now(),
      watchId,
    });
  }

  getSession(sessionId: string): DebugSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    return session;
  }

  getSessions(): DebugSession[] {
    return Array.from(this.sessions.values());
  }

  onDebug(listener: (event: any) => void): void {
    this.eventEmitter.on('debug', listener);
  }

  offDebug(listener: (event: any) => void): void {
    this.eventEmitter.off('debug', listener);
  }

  setConfig(config: Partial<DebugConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): DebugConfig {
    return { ...this.config };
  }

  setTimeout(timeout: number): void {
    this.config.timeout = timeout;
  }

  setMaxBreakpoints(maxBreakpoints: number): void {
    this.config.maxBreakpoints = maxBreakpoints;
  }

  setMaxWatches(maxWatches: number): void {
    this.config.maxWatches = maxWatches;
  }

  setMaxLogs(maxLogs: number): void {
    this.config.maxLogs = maxLogs;
  }

  setDefaultActions(actions: DebugConfig['defaultActions']): void {
    this.config.defaultActions = actions;
  }

  getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    totalBreakpoints: number;
    totalWatches: number;
    totalLogs: number;
  } {
    const stats = {
      totalSessions: this.sessions.size,
      activeSessions: 0,
      totalBreakpoints: 0,
      totalWatches: 0,
      totalLogs: 0,
    };

    for (const session of this.sessions.values()) {
      if (session.status === 'running') {
        stats.activeSessions++;
      }
      stats.totalBreakpoints += session.breakpoints.length;
      stats.totalWatches += session.watches.length;
      stats.totalLogs += session.logs.length;
    }

    return stats;
  }

  clearSessions(): void {
    this.sessions.clear();
  }
} 