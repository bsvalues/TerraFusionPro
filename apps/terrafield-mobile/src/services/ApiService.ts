import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.API_URL || 'https://api.terrafield.com';
const TOKEN_KEY = 'auth_token';
const OFFLINE_QUEUE_KEY = 'offline_api_queue';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface OfflineRequest {
  id: string;
  url: string;
  method: HttpMethod;
  body?: any;
  timestamp: number;
  retries: number;
}

/**
 * Service to handle API requests with offline support
 */
export class ApiService {
  private static instance: ApiService;
  private token: string | null = null;
  private isConnected: boolean = true;
  private offlineQueue: OfflineRequest[] = [];
  private maxRetries = 3;

  /**
   * Private constructor to implement singleton pattern
   */
  private constructor() {
    this.setupNetworkListener();
    this.loadTokenFromStorage();
    this.loadOfflineQueue();
  }

  /**
   * Set up network connectivity listener
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected ?? false;
      
      // If connectivity was restored, process offline queue
      if (!wasConnected && this.isConnected) {
        this.processOfflineQueue();
      }
    });
  }

  /**
   * Get instance of ApiService (Singleton)
   */
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Process the offline request queue
   */
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0 || !this.isConnected) {
      return;
    }

    const queue = [...this.offlineQueue];
    const successfulRequests: string[] = [];
    const failedRequests: OfflineRequest[] = [];

    for (const request of queue) {
      try {
        const { url, method, body } = request;
        await this.makeRequest(url, method, body);
        successfulRequests.push(request.id);
        console.log(`Offline request processed successfully: ${request.id}`);
      } catch (error) {
        if (request.retries >= this.maxRetries) {
          console.warn(`Max retries reached for request ${request.id}, removing from queue`);
          successfulRequests.push(request.id);
        } else {
          const updatedRequest = {
            ...request,
            retries: request.retries + 1,
          };
          failedRequests.push(updatedRequest);
        }
      }
    }

    // Update the queue by removing successful requests
    this.offlineQueue = this.offlineQueue.filter(
      request => !successfulRequests.includes(request.id)
    );

    // Save the updated queue
    this.saveOfflineQueue();
  }

  /**
   * Load saved auth token from secure storage
   */
  private async loadTokenFromStorage(): Promise<void> {
    try {
      this.token = await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error loading auth token:', error);
    }
  }

  /**
   * Save auth token to secure storage
   */
  private async saveTokenToStorage(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  }

  /**
   * Load offline request queue from storage
   */
  private async loadOfflineQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  }

  /**
   * Save offline request queue to storage
   */
  private async saveOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  /**
   * Add a request to the offline queue
   */
  private async addToOfflineQueue(
    url: string,
    method: HttpMethod,
    body?: any
  ): Promise<void> {
    const request: OfflineRequest = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      url,
      method,
      body,
      timestamp: Date.now(),
      retries: 0,
    };

    this.offlineQueue.push(request);
    await this.saveOfflineQueue();
    console.log(`Request added to offline queue: ${request.id}`);
  }

  /**
   * Set the auth token
   */
  public setToken(token: string): void {
    this.token = token;
    this.saveTokenToStorage(token);
  }

  /**
   * Clear the auth token
   */
  public clearToken(): void {
    this.token = null;
    SecureStore.deleteItemAsync(TOKEN_KEY);
  }

  /**
   * Check if user is authenticated (has token)
   */
  public isAuthenticated(): boolean {
    return this.token !== null;
  }

  /**
   * Make a HTTP request with offline support
   */
  private async makeRequest(
    url: string,
    method: HttpMethod,
    body?: any,
    isRetry: boolean = false
  ): Promise<any> {
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
    
    // Check network connectivity
    if (!this.isConnected && !isRetry) {
      if (method !== 'GET') {
        await this.addToOfflineQueue(url, method, body);
        return { offline: true, queued: true, message: 'Request queued for when network is available' };
      } else {
        throw new Error('Network is not available');
      }
    }

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const options: RequestInit = {
        method,
        headers,
      };

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(fullUrl, options);
      
      // Check for unauthorized (token expired or invalid)
      if (response.status === 401 && this.token && !isRetry) {
        // Try refreshing token (implementation depends on your auth flow)
        await this.refreshToken();
        
        // Retry the request once with the new token
        return this.makeRequest(url, method, body, true);
      }
      
      // Parse response
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      
      return data;
    } catch (error) {
      if (!this.isConnected && method !== 'GET' && !isRetry) {
        await this.addToOfflineQueue(url, method, body);
        return { offline: true, queued: true, message: 'Request queued for when network is available' };
      }
      
      throw error;
    }
  }

  /**
   * Refresh the auth token
   */
  private async refreshToken(): Promise<boolean> {
    // This would call your refresh token endpoint
    // For simplicity, we're just handling token invalidation here
    try {
      // Example refresh token implementation:
      // const response = await fetch(`${API_URL}/auth/refresh`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ refreshToken: this.refreshToken }),
      // });
      //
      // if (response.ok) {
      //   const data = await response.json();
      //   this.setToken(data.token);
      //   return true;
      // }
      
      // For now, just clear the token
      this.clearToken();
      return false;
    } catch (error) {
      this.clearToken();
      return false;
    }
  }

  /**
   * GET request
   */
  public async get(url: string): Promise<any> {
    return this.makeRequest(url, 'GET');
  }

  /**
   * POST request
   */
  public async post(url: string, body?: any): Promise<any> {
    return this.makeRequest(url, 'POST', body);
  }

  /**
   * PUT request
   */
  public async put(url: string, body?: any): Promise<any> {
    return this.makeRequest(url, 'PUT', body);
  }

  /**
   * DELETE request
   */
  public async delete(url: string): Promise<any> {
    return this.makeRequest(url, 'DELETE');
  }

  /**
   * PATCH request
   */
  public async patch(url: string, body?: any): Promise<any> {
    return this.makeRequest(url, 'PATCH', body);
  }

  /**
   * Get the number of pending offline requests
   */
  public getPendingRequestsCount(): number {
    return this.offlineQueue.length;
  }

  /**
   * Force processing the offline queue
   */
  public async forceSyncOfflineQueue(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }
    
    await this.processOfflineQueue();
    return true;
  }
}