import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingsService } from '../settings/settings';
import { ErrorService } from '../error/error';

interface NetworkState {
  isConnected: boolean;
  type: string;
  isInternetReachable: boolean | null;
  details?: {
    isConnectionExpensive?: boolean;
    cellularGeneration?: string;
    carrier?: string;
  };
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

interface RequestConfig {
  baseUrl: string;
  defaultHeaders: Record<string, string>;
  timeout: number;
  retryCount: number;
  retryDelay: number;
}

export class NetworkService {
  private static instance: NetworkService;
  private settingsService: SettingsService;
  private errorService: ErrorService;
  private config: RequestConfig;
  private networkState: NetworkState | null = null;
  private networkStateKey = '@network_state';
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  private constructor() {
    this.settingsService = SettingsService.getInstance();
    this.errorService = ErrorService.getInstance();
    this.config = {
      baseUrl: 'https://api.terrafield.com', // TODO: Get from environment
      defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
      retryCount: 3,
      retryDelay: 1000,
    };
  }

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Load saved network state
      const savedState = await AsyncStorage.getItem(this.networkStateKey);
      if (savedState) {
        this.networkState = JSON.parse(savedState);
      }

      // Set up network state listener
      NetInfo.addEventListener(state => {
        this.handleNetworkStateChange(state);
      });

      // Initial network state check
      const state = await NetInfo.fetch();
      await this.handleNetworkStateChange(state);
    } catch (error) {
      console.error('Failed to initialize network service:', error);
      throw error;
    }
  }

  private async handleNetworkStateChange(state: any): Promise<void> {
    try {
      const networkState: NetworkState = {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
        details: state.details,
      };

      this.networkState = networkState;
      await AsyncStorage.setItem(this.networkStateKey, JSON.stringify(networkState));

      if (networkState.isConnected && networkState.isInternetReachable) {
        await this.processRequestQueue();
      }
    } catch (error) {
      console.error('Failed to handle network state change:', error);
      throw error;
    }
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    try {
      if (!this.isNetworkAvailable()) {
        return this.queueRequest<T>(endpoint, options);
      }

      const response = await this.executeRequest<T>(endpoint, options);
      return response;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  private async executeRequest<T>(
    endpoint: string,
    options: RequestOptions,
    attempt = 1
  ): Promise<T> {
    try {
      const {
        method = 'GET',
        headers = {},
        body,
        timeout = this.config.timeout,
        retryCount = this.config.retryCount,
        retryDelay = this.config.retryDelay,
      } = options;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method,
        headers: {
          ...this.config.defaultHeaders,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      if (attempt < options.retryCount!) {
        await new Promise(resolve => setTimeout(resolve, options.retryDelay!));
        return this.executeRequest<T>(endpoint, options, attempt + 1);
      }

      throw error;
    }
  }

  private async queueRequest<T>(endpoint: string, options: RequestOptions): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const response = await this.executeRequest<T>(endpoint, options);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private async processRequestQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    try {
      this.isProcessingQueue = true;

      while (this.requestQueue.length > 0 && this.isNetworkAvailable()) {
        const request = this.requestQueue.shift();
        if (request) {
          await request();
        }
      }
    } catch (error) {
      console.error('Failed to process request queue:', error);
      throw error;
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private isNetworkAvailable(): boolean {
    return !!(
      this.networkState?.isConnected &&
      this.networkState?.isInternetReachable
    );
  }

  async getNetworkState(): Promise<NetworkState | null> {
    try {
      const state = await NetInfo.fetch();
      await this.handleNetworkStateChange(state);
      return this.networkState;
    } catch (error) {
      console.error('Failed to get network state:', error);
      return null;
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      const state = await this.getNetworkState();
      return !!state?.isConnected;
    } catch (error) {
      console.error('Failed to check connection:', error);
      return false;
    }
  }

  async isInternetReachable(): Promise<boolean> {
    try {
      const state = await this.getNetworkState();
      return !!state?.isInternetReachable;
    } catch (error) {
      console.error('Failed to check internet reachability:', error);
      return false;
    }
  }

  async getConnectionType(): Promise<string> {
    try {
      const state = await this.getNetworkState();
      return state?.type || 'unknown';
    } catch (error) {
      console.error('Failed to get connection type:', error);
      return 'unknown';
    }
  }

  async getConnectionDetails(): Promise<Record<string, any> | null> {
    try {
      const state = await this.getNetworkState();
      return state?.details || null;
    } catch (error) {
      console.error('Failed to get connection details:', error);
      return null;
    }
  }
} 