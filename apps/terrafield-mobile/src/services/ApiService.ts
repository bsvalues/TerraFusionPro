import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';

/**
 * Base URL for API calls
 * Uses localhost for iOS simulator and 10.0.2.2 for Android emulator
 */
const API_BASE_URL = Platform.OS === 'ios' ? 
  'http://localhost:5000' : 
  'http://10.0.2.2:5000';

/**
 * API service for handling API requests
 */
export class ApiService {
  private static instance: ApiService;
  private token: string | null = null;
  private isConnected: boolean = true;
  private pendingRequests: Array<{ 
    method: string, 
    endpoint: string, 
    data?: any,
    timestamp: number 
  }> = [];

  private constructor() {
    // Initialize network connectivity monitoring
    NetInfo.addEventListener(state => {
      // Update connection status
      this.isConnected = state.isConnected ?? false;

      // If we're back online, process pending requests
      if (state.isConnected) {
        this.processPendingRequests();
      }
    });

    // Load pending requests from storage
    this.loadPendingRequests();
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
   * Set authentication token
   */
  public async setToken(token: string): Promise<void> {
    this.token = token;
    
    try {
      await SecureStore.setItemAsync('auth_token', token);
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  }

  /**
   * Clear authentication token
   */
  public async clearToken(): Promise<void> {
    this.token = null;
    
    try {
      await SecureStore.deleteItemAsync('auth_token');
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  }

  /**
   * Load authentication token from secure storage
   */
  public async loadToken(): Promise<string | null> {
    try {
      this.token = await SecureStore.getItemAsync('auth_token');
      return this.token;
    } catch (error) {
      console.error('Error loading auth token:', error);
      return null;
    }
  }

  /**
   * Make GET request
   */
  public async get<T>(endpoint: string): Promise<T | null> {
    return this.request<T>('GET', endpoint);
  }

  /**
   * Make POST request
   */
  public async post<T>(endpoint: string, data?: any): Promise<T | null> {
    return this.request<T>('POST', endpoint, data);
  }

  /**
   * Make PUT request
   */
  public async put<T>(endpoint: string, data?: any): Promise<T | null> {
    return this.request<T>('PUT', endpoint, data);
  }

  /**
   * Make DELETE request
   */
  public async delete<T>(endpoint: string): Promise<T | null> {
    return this.request<T>('DELETE', endpoint);
  }

  /**
   * Handle all requests
   */
  private async request<T>(method: string, endpoint: string, data?: any): Promise<T | null> {
    // If not connected, queue the request and return null
    if (!this.isConnected) {
      console.log(`No connection, queueing ${method} request to ${endpoint}`);
      await this.queueRequest(method, endpoint, data);
      return null;
    }

    // Create request options
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add authorization token if available
    if (this.token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${this.token}`,
      };
    }

    // Add body for non-GET requests
    if (method !== 'GET' && data) {
      options.body = JSON.stringify(data);
    }

    try {
      // Make the request
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

      // Handle response
      if (response.ok) {
        // If response is empty, return empty object
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        }
        return {} as T;
      } else {
        // Handle error response
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
        throw new Error(errorText || `API Error: ${response.status}`);
      }
    } catch (error) {
      // If network error, queue the request for later
      console.error(`Request failed:`, error);
      if (!this.isConnected) {
        await this.queueRequest(method, endpoint, data);
      }
      throw error;
    }
  }

  /**
   * Queue a request for later execution
   */
  private async queueRequest(method: string, endpoint: string, data?: any): Promise<void> {
    const request = {
      method,
      endpoint,
      data,
      timestamp: Date.now(),
    };

    this.pendingRequests.push(request);
    
    // Save pending requests to storage
    try {
      await AsyncStorage.setItem('pendingRequests', JSON.stringify(this.pendingRequests));
    } catch (error) {
      console.error('Error saving pending requests:', error);
    }
  }

  /**
   * Load pending requests from storage
   */
  private async loadPendingRequests(): Promise<void> {
    try {
      const requests = await AsyncStorage.getItem('pendingRequests');
      if (requests) {
        this.pendingRequests = JSON.parse(requests);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  }

  /**
   * Process pending requests when back online
   */
  private async processPendingRequests(): Promise<void> {
    if (this.pendingRequests.length === 0) return;

    console.log(`Processing ${this.pendingRequests.length} pending requests`);
    
    // Create a copy of the pending requests
    const requests = [...this.pendingRequests];
    
    // Clear pending requests
    this.pendingRequests = [];
    await AsyncStorage.removeItem('pendingRequests');
    
    // Process each request
    for (const request of requests) {
      try {
        await this.request(request.method, request.endpoint, request.data);
        console.log(`Processed queued request: ${request.method} ${request.endpoint}`);
      } catch (error) {
        console.error(`Failed to process queued request:`, error);
        
        // If still relevant (less than 24 hours old), requeue the request
        const ONE_DAY = 24 * 60 * 60 * 1000;
        if (Date.now() - request.timestamp < ONE_DAY) {
          this.pendingRequests.push(request);
        }
      }
    }
    
    // Save any requests that couldn't be processed
    if (this.pendingRequests.length > 0) {
      await AsyncStorage.setItem('pendingRequests', JSON.stringify(this.pendingRequests));
    }
  }
}