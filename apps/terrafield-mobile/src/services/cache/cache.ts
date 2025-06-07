import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingsService } from '../settings/settings';
import { ErrorService } from '../error/error';
import { ServiceMonitorImpl } from '../monitor/monitor';
import { ServiceRegistry } from '../registry/registry';
import { EventEmitter } from 'events';

interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}

interface CacheConfig {
  defaultExpiry: number;
  maxSize: number;
  cleanupInterval: number;
  ttl: number;
  strategy: 'lru' | 'lfu' | 'fifo';
  compression: boolean;
  persistence: boolean;
  persistencePath?: string;
}

interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  expiry: number;
  hits: number;
  size: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  size: number;
  oldest: number;
  newest: number;
}

interface ServiceCache {
  initialize(): Promise<void>;
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  getStats(): CacheStats;
  onEviction(listener: (key: string, reason: string) => void): void;
  offEviction(listener: (key: string, reason: string) => void): void;
}

export class CacheService {
  private static instance: CacheService;
  private settingsService: SettingsService;
  private errorService: ErrorService;
  private config: CacheConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private monitor: ServiceMonitorImpl;
  private registry: ServiceRegistry;
  private eventEmitter: EventEmitter;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats;
  private initializationPromise: Promise<void> | null = null;
  private prefix: string;
  private defaultTTL: number;

  private constructor(options: CacheOptions = {}) {
    this.settingsService = SettingsService.getInstance();
    this.errorService = ErrorService.getInstance();
    this.config = {
      defaultExpiry: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 100 * 1024 * 1024, // 100 MB
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      ttl: 3600000,
      strategy: 'lru',
      compression: false,
      persistence: false,
    };
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0,
      size: 0,
      oldest: Date.now(),
      newest: Date.now(),
    };
    this.monitor = ServiceMonitorImpl.getInstance();
    this.registry = ServiceRegistry.getInstance();
    this.eventEmitter = new EventEmitter();
    this.prefix = options.prefix || 'cache_';
    this.defaultTTL = options.ttl || 3600000; // 1 hour default
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeCache();
    await this.initializationPromise;
  }

  private async initializeCache(): Promise<void> {
    try {
      await this.monitor.initialize();
      this.setupEventListeners();
      this.startCleanupInterval();
      if (this.config.persistence) {
        await this.loadFromPersistence();
      }
    } catch (error) {
      console.error('Failed to initialize service cache:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    this.monitor.onHealthUpdate((health) => {
      this.updateCacheHealth(health);
    });
  }

  private updateCacheHealth(health: Map<string, any>): void {
    // Update cache health based on service health
    // For example, invalidate cache entries for unhealthy services
  }

  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        console.error('Failed to cleanup cache:', error);
      }
    }, 60000);
  }

  private async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiry <= now) {
        await this.delete(key);
        this.emitEviction(key, 'expired');
      }
    }

    if (this.cache.size > this.config.maxSize) {
      await this.evictEntries();
    }
  }

  private async evictEntries(): Promise<void> {
    const entries = Array.from(this.cache.entries());
    let entriesToEvict: [string, CacheEntry<any>][];

    switch (this.config.strategy) {
      case 'lru':
        entriesToEvict = entries
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, entries.length - this.config.maxSize);
        break;
      case 'lfu':
        entriesToEvict = entries
          .sort((a, b) => a[1].hits - b[1].hits)
          .slice(0, entries.length - this.config.maxSize);
        break;
      case 'fifo':
        entriesToEvict = entries
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, entries.length - this.config.maxSize);
        break;
      default:
        entriesToEvict = entries
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, entries.length - this.config.maxSize);
    }

    for (const [key] of entriesToEvict) {
      await this.delete(key);
      this.emitEviction(key, 'evicted');
    }
  }

  private emitEviction(key: string, reason: string): void {
    this.eventEmitter.emit('eviction', key, reason);
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    try {
      await AsyncStorage.setItem(
        this.getKey(key),
        JSON.stringify(item)
      );
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(this.getKey(key));
      if (!data) return null;

      const item: CacheItem<T> = JSON.parse(data);
      const now = Date.now();

      if (item.ttl && now - item.timestamp > item.ttl) {
        await this.delete(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error('Cache delete error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
      throw error;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const value = await this.get(key);
      return value !== null;
    } catch (error) {
      console.error('Cache has error:', error);
      return false;
    }
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  onEviction(listener: (key: string, reason: string) => void): void {
    this.eventEmitter.on('eviction', listener);
  }

  offEviction(listener: (key: string, reason: string) => void): void {
    this.eventEmitter.off('eviction', listener);
  }

  private async loadFromPersistence(): Promise<void> {
    if (!this.config.persistencePath) {
      return;
    }

    try {
      const data = await this.readFromFile(this.config.persistencePath);
      const { cache, stats } = JSON.parse(data);
      this.cache = new Map(Object.entries(cache));
      this.stats = stats;
    } catch (error) {
      console.error('Failed to load cache from persistence:', error);
    }
  }

  private async saveToPersistence(): Promise<void> {
    if (!this.config.persistencePath) {
      return;
    }

    try {
      const data = JSON.stringify({
        cache: Object.fromEntries(this.cache),
        stats: this.stats,
      });
      await this.writeToFile(this.config.persistencePath, data);
    } catch (error) {
      console.error('Failed to save cache to persistence:', error);
    }
  }

  private async readFromFile(path: string): Promise<string> {
    // Implement file reading logic
    return '';
  }

  private async writeToFile(path: string, data: string): Promise<void> {
    // Implement file writing logic
  }

  setConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): CacheConfig {
    return { ...this.config };
  }

  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : this.stats.hits / total;
  }

  getAverageEntrySize(): number {
    return this.stats.keys === 0 ? 0 : this.stats.size / this.stats.keys;
  }

  getOldestEntry(): number {
    return this.stats.oldest;
  }

  getNewestEntry(): number {
    return this.stats.newest;
  }

  getMostAccessedKeys(limit: number = 10): string[] {
    return Array.from(this.cache.entries())
      .sort((a, b) => b[1].hits - a[1].hits)
      .slice(0, limit)
      .map(([key]) => key);
  }

  getLargestEntries(limit: number = 10): string[] {
    return Array.from(this.cache.entries())
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, limit)
      .map(([key]) => key);
  }
} 