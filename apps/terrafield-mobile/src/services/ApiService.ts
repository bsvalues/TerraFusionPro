import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';

// API base URL
const API_BASE_URL = process.env.API_URL || 'https://api.terrafield.example.com'; // Replace with actual API URL

// Storage keys
const PENDING_REQUESTS_KEY = 'terrafield_pending_requests';
const AUTH_TOKEN_KEY = 'terrafield_auth_token';

// Pending request interface
interface PendingRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  timestamp: number;
  retries: number;
}

// Response interface
interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
  ok: boolean;
}

/**
 * Service to handle API requests with offline support
 */
export class ApiService {
  private static instance: ApiService;
  private token: string | null = null;
  private isNetworkConnected: boolean = true;
  private pendingRequests: PendingRequest[] = [];
  private syncInProgress: boolean = false;

  /**
   * Private constructor to implement singleton pattern
   */
  private constructor() {
    this.initializeService();
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
   * Initialize service
   */
  private async initializeService(): Promise<void> {
    try {
      // Subscribe to network state changes
      NetInfo.addEventListener(state => {
        const isConnected = state.isConnected ?? false;
        const wasConnected = this.isNetworkConnected;
        this.isNetworkConnected = isConnected;
        
        // If we just got connected, try to sync pending requests
        if (isConnected && !wasConnected) {
          this.syncPendingRequests();
        }
      });
      
      // Check initial network state
      const netInfoState = await NetInfo.fetch();
      this.isNetworkConnected = netInfoState.isConnected ?? false;
      
      // Load auth token
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        this.token = token;
      }
      
      // Load pending requests
      await this.loadPendingRequests();
      
      // Try to sync pending requests
      if (this.isNetworkConnected) {
        this.syncPendingRequests();
      }
    } catch (error) {
      console.error('Error initializing ApiService:', error);
    }
  }

  /**
   * Load pending requests from storage
   */
  private async loadPendingRequests(): Promise<void> {
    try {
      const pendingRequestsJson = await AsyncStorage.getItem(PENDING_REQUESTS_KEY);
      if (pendingRequestsJson) {
        this.pendingRequests = JSON.parse(pendingRequestsJson);
        
        // Sort by timestamp
        this.pendingRequests.sort((a, b) => a.timestamp - b.timestamp);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
      this.pendingRequests = [];
    }
  }

  /**
   * Save pending requests to storage
   */
  private async savePendingRequests(): Promise<void> {
    try {
      await AsyncStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(this.pendingRequests));
    } catch (error) {
      console.error('Error saving pending requests:', error);
    }
  }

  /**
   * Check if we're connected to the network
   */
  public isConnected(): boolean {
    return this.isNetworkConnected;
  }

  /**
   * Set auth token
   */
  public setToken(token: string): void {
    this.token = token;
    AsyncStorage.setItem(AUTH_TOKEN_KEY, token).catch(error => {
      console.error('Error saving auth token:', error);
    });
  }

  /**
   * Clear auth token
   */
  public clearToken(): void {
    this.token = null;
    AsyncStorage.removeItem(AUTH_TOKEN_KEY).catch(error => {
      console.error('Error removing auth token:', error);
    });
  }

  /**
   * Get auth token
   */
  public getToken(): string | null {
    return this.token;
  }

  /**
   * Add a request to the pending queue
   */
  private async addToPendingRequests(request: PendingRequest): Promise<void> {
    this.pendingRequests.push(request);
    await this.savePendingRequests();
  }

  /**
   * Remove a request from the pending queue
   */
  private async removeFromPendingRequests(requestId: string): Promise<void> {
    this.pendingRequests = this.pendingRequests.filter(request => request.id !== requestId);
    await this.savePendingRequests();
  }

  /**
   * Sync pending requests
   */
  public async syncPendingRequests(): Promise<void> {
    if (this.syncInProgress || !this.isNetworkConnected || this.pendingRequests.length === 0) {
      return;
    }
    
    try {
      this.syncInProgress = true;
      
      const requests = [...this.pendingRequests];
      
      for (const request of requests) {
        try {
          // Make the request
          await this.makeRequest(
            request.url,
            request.method,
            request.body,
            false // Don't queue this request again
          );
          
          // If successful, remove from pending
          await this.removeFromPendingRequests(request.id);
        } catch (error) {
          console.error(`Error syncing pending request ${request.id}:`, error);
          
          // Increment retry count
          request.retries++;
          
          // If too many retries, remove the request
          if (request.retries > 5) {
            await this.removeFromPendingRequests(request.id);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing pending requests:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Make an API request
   */
  private async makeRequest<T = any>(
    url: string,
    method: string,
    body?: any,
    queueIfOffline: boolean = true
  ): Promise<ApiResponse<T>> {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    // Check if we're connected to the network
    if (!this.isNetworkConnected && queueIfOffline) {
      // Queue the request for later
      const request: PendingRequest = {
        id: uuidv4(),
        url,
        method,
        body,
        timestamp: Date.now(),
        retries: 0,
      };
      
      await this.addToPendingRequests(request);
      
      throw new Error('Network is offline. Request queued for later.');
    }
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    // Prepare request options
    const options: RequestInit = {
      method,
      headers,
    };
    
    // Add body if available
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }
    
    try {
      // Make the request
      const response = await fetch(fullUrl, options);
      
      // Parse response
      let data: T;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text() as unknown as T;
      }
      
      // Return response
      return {
        data,
        status: response.status,
        headers: response.headers,
        ok: response.ok,
      };
    } catch (error) {
      console.error(`Error making API request to ${fullUrl}:`, error);
      
      // Queue the request for later if needed
      if (queueIfOffline) {
        const request: PendingRequest = {
          id: uuidv4(),
          url,
          method,
          body,
          timestamp: Date.now(),
          retries: 0,
        };
        
        await this.addToPendingRequests(request);
      }
      
      throw error;
    }
  }

  /**
   * Make a GET request
   */
  public async get<T = any>(url: string): Promise<T> {
    const response = await this.makeRequest<T>(url, 'GET');
    
    if (!response.ok) {
      throw new Error(`GET request failed with status ${response.status}`);
    }
    
    return response.data;
  }

  /**
   * Make a POST request
   */
  public async post<T = any>(url: string, body?: any): Promise<T> {
    const response = await this.makeRequest<T>(url, 'POST', body);
    
    if (!response.ok) {
      throw new Error(`POST request failed with status ${response.status}`);
    }
    
    return response.data;
  }

  /**
   * Make a PUT request
   */
  public async put<T = any>(url: string, body?: any): Promise<T> {
    const response = await this.makeRequest<T>(url, 'PUT', body);
    
    if (!response.ok) {
      throw new Error(`PUT request failed with status ${response.status}`);
    }
    
    return response.data;
  }

  /**
   * Make a PATCH request
   */
  public async patch<T = any>(url: string, body?: any): Promise<T> {
    const response = await this.makeRequest<T>(url, 'PATCH', body);
    
    if (!response.ok) {
      throw new Error(`PATCH request failed with status ${response.status}`);
    }
    
    return response.data;
  }

  /**
   * Make a DELETE request
   */
  public async delete<T = any>(url: string): Promise<T> {
    const response = await this.makeRequest<T>(url, 'DELETE');
    
    if (!response.ok) {
      throw new Error(`DELETE request failed with status ${response.status}`);
    }
    
    return response.data;
  }

  /**
   * Get pending requests count
   */
  public getPendingRequestsCount(): number {
    return this.pendingRequests.length;
  }
}