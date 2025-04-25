import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import NetInfo from '@react-native-community/netinfo';
import { NotificationService } from './NotificationService';

/**
 * Interface for pending request
 */
interface PendingRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  timestamp: number;
  retries: number;
}

/**
 * Service to handle API requests with offline support
 */
export class ApiService {
  private static instance: ApiService;
  private baseUrl: string;
  private token: string | null = null;
  private pendingRequests: PendingRequest[] = [];
  private isConnectedValue: boolean = true;
  private notificationService: NotificationService;
  private syncInterval: NodeJS.Timeout | null = null;
  
  /**
   * Private constructor to implement singleton pattern
   */
  private constructor() {
    this.baseUrl = process.env.API_URL || 'https://api.terrafield.example.com';
    this.notificationService = NotificationService.getInstance();
    this.loadPendingRequests();
    
    // Start network listening
    this.setupNetworkListeners();
    
    // Set up sync interval
    this.setupSyncInterval();
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
   * Set up network change listeners
   */
  private setupNetworkListeners(): void {
    NetInfo.addEventListener(state => {
      const wasConnected = this.isConnectedValue;
      this.isConnectedValue = state.isConnected === true;
      
      // If we just came online and we have pending requests, sync
      if (!wasConnected && this.isConnectedValue && this.pendingRequests.length > 0) {
        this.syncPendingRequests();
      }
      
      // Notify if connection state changed
      if (wasConnected !== this.isConnectedValue) {
        if (this.isConnectedValue) {
          this.notificationService.sendSystemNotification(
            'Connection Restored',
            'You are now back online. Your changes will be synchronized.'
          );
        } else {
          this.notificationService.sendSystemNotification(
            'Connection Lost',
            'You are currently offline. Changes will be saved locally and synchronized when you reconnect.'
          );
        }
      }
    });
  }
  
  /**
   * Set up sync interval
   */
  private setupSyncInterval(): void {
    // Sync every 5 minutes
    this.syncInterval = setInterval(() => {
      if (this.isConnectedValue && this.pendingRequests.length > 0) {
        this.syncPendingRequests();
      }
    }, 5 * 60 * 1000);
  }
  
  /**
   * Check if we're connected
   */
  public isConnected(): boolean {
    return this.isConnectedValue;
  }
  
  /**
   * Set auth token
   */
  public setToken(token: string): void {
    this.token = token;
  }
  
  /**
   * Clear auth token
   */
  public clearToken(): void {
    this.token = null;
  }
  
  /**
   * Load pending requests from storage
   */
  private async loadPendingRequests(): Promise<void> {
    try {
      const pendingRequestsJson = await AsyncStorage.getItem('terrafield_pending_requests');
      if (pendingRequestsJson) {
        this.pendingRequests = JSON.parse(pendingRequestsJson);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  }
  
  /**
   * Save pending requests to storage
   */
  private async savePendingRequests(): Promise<void> {
    try {
      await AsyncStorage.setItem('terrafield_pending_requests', JSON.stringify(this.pendingRequests));
    } catch (error) {
      console.error('Error saving pending requests:', error);
    }
  }
  
  /**
   * Get the number of pending requests
   */
  public getPendingRequestsCount(): number {
    return this.pendingRequests.length;
  }
  
  /**
   * Synchronize all pending requests
   */
  public async syncPendingRequests(): Promise<void> {
    if (!this.isConnectedValue || this.pendingRequests.length === 0) {
      return;
    }
    
    // Create a copy of the pending requests
    const requests = [...this.pendingRequests];
    
    // Clear the pending requests
    this.pendingRequests = [];
    await this.savePendingRequests();
    
    // Process each request
    const failedRequests: PendingRequest[] = [];
    
    for (const request of requests) {
      try {
        await this.processRequest(request.url, request.method, request.body);
      } catch (error) {
        console.error(`Error syncing request ${request.url}:`, error);
        
        // Increment retry count
        request.retries++;
        
        // If we've tried too many times, give up
        if (request.retries >= 5) {
          this.notificationService.sendSyncErrorNotification(
            request.url,
            'Request failed after multiple attempts. Some data may be lost.'
          );
        } else {
          failedRequests.push(request);
        }
      }
    }
    
    // If we have failed requests, add them back to the queue
    if (failedRequests.length > 0) {
      this.pendingRequests.push(...failedRequests);
      await this.savePendingRequests();
      
      // Notify about failed requests
      this.notificationService.sendSystemNotification(
        'Sync Incomplete',
        `${failedRequests.length} changes could not be synchronized. Will retry later.`
      );
    } else if (requests.length > 0) {
      // Notify about successful sync
      this.notificationService.sendSystemNotification(
        'Sync Complete',
        `Successfully synchronized ${requests.length} changes.`
      );
    }
  }
  
  /**
   * Process a request
   */
  private async processRequest(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    body?: any,
  ): Promise<any> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
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
    
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    
    // If it's not JSON, return the response
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return response;
    }
    
    return await response.json();
  }
  
  /**
   * Perform a request
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    body?: any,
  ): Promise<T> {
    if (!this.isConnectedValue && method !== 'GET') {
      // Queue non-GET requests for later
      const request: PendingRequest = {
        id: uuidv4(),
        url,
        method,
        body,
        timestamp: Date.now(),
        retries: 0,
      };
      
      this.pendingRequests.push(request);
      await this.savePendingRequests();
      
      // For now, return an empty object
      return {} as T;
    } else if (!this.isConnectedValue && method === 'GET') {
      // We can't fulfill GET requests offline
      throw new Error('Cannot perform GET request while offline');
    }
    
    return await this.processRequest(url, method, body);
  }
  
  /**
   * Perform a GET request
   */
  public async get<T>(url: string): Promise<T> {
    return await this.request<T>('GET', url);
  }
  
  /**
   * Perform a POST request
   */
  public async post<T>(url: string, body?: any): Promise<T> {
    return await this.request<T>('POST', url, body);
  }
  
  /**
   * Perform a PUT request
   */
  public async put<T>(url: string, body?: any): Promise<T> {
    return await this.request<T>('PUT', url, body);
  }
  
  /**
   * Perform a DELETE request
   */
  public async delete<T>(url: string): Promise<T> {
    return await this.request<T>('DELETE', url);
  }
  
  /**
   * Perform a PATCH request
   */
  public async patch<T>(url: string, body?: any): Promise<T> {
    return await this.request<T>('PATCH', url, body);
  }
}