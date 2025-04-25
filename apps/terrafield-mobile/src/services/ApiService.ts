/**
 * ApiService for handling HTTP requests
 * in the TerraField Mobile application
 */

// API service configuration
interface ApiConfig {
  baseUrl: string;
  headers: Record<string, string>;
  timeout: number;
}

// Default API configuration
const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: 'https://appraisalcore.replit.app/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 seconds
};

// API service using the singleton pattern
export class ApiService {
  private static instance: ApiService;
  private config: ApiConfig;
  
  // Private constructor to prevent direct instantiation
  private constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = { ...config };
  }
  
  // Get singleton instance
  public static getInstance(config?: ApiConfig): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService(config);
    }
    return ApiService.instance;
  }
  
  // Set authentication token
  public setAuthToken(token: string | null): void {
    if (token) {
      this.config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.config.headers['Authorization'];
    }
  }
  
  // Update API configuration
  public updateConfig(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  // Create full API URL
  private createUrl(endpoint: string): string {
    return endpoint.startsWith('http')
      ? endpoint
      : `${this.config.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }
  
  // Handle API response
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Try to get error details from response
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP Error ${response.status}`);
      } catch (error) {
        // If error response isn't valid JSON
        throw new Error(`HTTP Error ${response.status}`);
      }
    }
    
    // Handle different response types
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    } else if (contentType?.includes('text/')) {
      const text = await response.text();
      return text as unknown as T;
    } else {
      // Return the raw response for other content types (like blobs)
      return response as unknown as T;
    }
  }
  
  // Generic request method
  private async request<T>(method: string, endpoint: string, data?: any, customConfig?: Partial<ApiConfig>): Promise<T> {
    const url = this.createUrl(endpoint);
    const config = { ...this.config, ...customConfig };
    
    // Set up request options
    const options: RequestInit = {
      method,
      headers: config.headers,
    };
    
    // Add body if method is not GET or HEAD
    if (method !== 'GET' && method !== 'HEAD' && data) {
      options.body = typeof data === 'string' ? data : JSON.stringify(data);
    }
    
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      options.signal = controller.signal;
      
      // Make the request
      const response = await fetch(url, options);
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Handle response
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${config.timeout}ms`);
      }
      throw error;
    }
  }
  
  // GET request
  public async get<T = any>(endpoint: string, customConfig?: Partial<ApiConfig>): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, customConfig);
  }
  
  // POST request
  public async post<T = any>(endpoint: string, data?: any, customConfig?: Partial<ApiConfig>): Promise<T> {
    return this.request<T>('POST', endpoint, data, customConfig);
  }
  
  // PUT request
  public async put<T = any>(endpoint: string, data?: any, customConfig?: Partial<ApiConfig>): Promise<T> {
    return this.request<T>('PUT', endpoint, data, customConfig);
  }
  
  // PATCH request
  public async patch<T = any>(endpoint: string, data?: any, customConfig?: Partial<ApiConfig>): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, customConfig);
  }
  
  // DELETE request
  public async delete<T = any>(endpoint: string, customConfig?: Partial<ApiConfig>): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, customConfig);
  }
}