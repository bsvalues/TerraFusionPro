import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingsService } from '../settings/settings';
import { ErrorService } from '../error/error';
import { NetworkService } from '../network/network';

interface AnalyticsEvent {
  id: string;
  name: string;
  properties: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId: string;
}

interface AnalyticsSession {
  id: string;
  startTime: string;
  endTime?: string;
  events: AnalyticsEvent[];
  properties: Record<string, any>;
}

interface AnalyticsConfig {
  batchSize: number;
  flushInterval: number;
  maxEvents: number;
  endpoint: string;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private settingsService: SettingsService;
  private errorService: ErrorService;
  private networkService: NetworkService;
  private config: AnalyticsConfig;
  private currentSession: AnalyticsSession | null = null;
  private events: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.settingsService = SettingsService.getInstance();
    this.errorService = ErrorService.getInstance();
    this.networkService = NetworkService.getInstance();
    this.config = {
      batchSize: 100,
      flushInterval: 60 * 1000, // 1 minute
      maxEvents: 1000,
      endpoint: 'https://analytics.terrafield.com', // TODO: Get from environment
    };
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.loadEvents();
      await this.startSession();
      await this.startFlushInterval();
    } catch (error) {
      console.error('Failed to initialize analytics service:', error);
      throw error;
    }
  }

  private async loadEvents(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('@analytics_events');
      if (data) {
        this.events = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
      throw error;
    }
  }

  private async saveEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem('@analytics_events', JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to save events:', error);
      throw error;
    }
  }

  private async startSession(): Promise<void> {
    try {
      this.currentSession = {
        id: this.generateId(),
        startTime: new Date().toISOString(),
        events: [],
        properties: {
          platform: Platform.OS,
          version: Platform.Version,
          appVersion: '1.0.0', // TODO: Get from app config
        },
      };
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  }

  private async endSession(): Promise<void> {
    try {
      if (this.currentSession) {
        this.currentSession.endTime = new Date().toISOString();
        await this.trackEvent('session_end', {
          duration: new Date(this.currentSession.endTime).getTime() -
            new Date(this.currentSession.startTime).getTime(),
        });
        this.currentSession = null;
      }
    } catch (error) {
      console.error('Failed to end session:', error);
      throw error;
    }
  }

  private async startFlushInterval(): Promise<void> {
    try {
      if (this.flushInterval) {
        clearInterval(this.flushInterval);
      }

      this.flushInterval = setInterval(
        () => this.flush(),
        this.config.flushInterval
      );
    } catch (error) {
      console.error('Failed to start flush interval:', error);
      throw error;
    }
  }

  async trackEvent(name: string, properties: Record<string, any> = {}): Promise<void> {
    try {
      const settings = await this.settingsService.getSettings();
      if (!settings.analytics) return;

      const event: AnalyticsEvent = {
        id: this.generateId(),
        name,
        properties,
        timestamp: new Date().toISOString(),
        sessionId: this.currentSession?.id || '',
      };

      this.events.push(event);
      if (this.currentSession) {
        this.currentSession.events.push(event);
      }

      if (this.events.length >= this.config.batchSize) {
        await this.flush();
      }

      await this.saveEvents();
    } catch (error) {
      console.error('Failed to track event:', error);
      throw error;
    }
  }

  private async flush(): Promise<void> {
    try {
      if (this.events.length === 0) return;

      const isConnected = await this.networkService.isConnected();
      if (!isConnected) return;

      const batch = this.events.slice(0, this.config.batchSize);
      await this.sendEvents(batch);

      this.events = this.events.slice(this.config.batchSize);
      await this.saveEvents();
    } catch (error) {
      console.error('Failed to flush events:', error);
      throw error;
    }
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      await this.networkService.request(this.config.endpoint, {
        method: 'POST',
        body: { events },
      });
    } catch (error) {
      console.error('Failed to send events:', error);
      throw error;
    }
  }

  async getEvents(): Promise<AnalyticsEvent[]> {
    try {
      return [...this.events];
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }

  async clearEvents(): Promise<void> {
    try {
      this.events = [];
      await this.saveEvents();
    } catch (error) {
      console.error('Failed to clear events:', error);
      throw error;
    }
  }

  async getSession(): Promise<AnalyticsSession | null> {
    try {
      return this.currentSession;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  async getEventCount(): Promise<number> {
    try {
      return this.events.length;
    } catch (error) {
      console.error('Failed to get event count:', error);
      return 0;
    }
  }

  async getEventTypes(): Promise<string[]> {
    try {
      const types = new Set(this.events.map(event => event.name));
      return Array.from(types);
    } catch (error) {
      console.error('Failed to get event types:', error);
      return [];
    }
  }

  async getEventsByType(type: string): Promise<AnalyticsEvent[]> {
    try {
      return this.events.filter(event => event.name === type);
    } catch (error) {
      console.error('Failed to get events by type:', error);
      return [];
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
} 