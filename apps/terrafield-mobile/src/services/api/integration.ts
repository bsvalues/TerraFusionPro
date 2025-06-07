import { Platform } from 'react-native';
import { Field } from '../../types/field';
import { Form } from '../../types/form';
import { User } from '../../types/user';

export class ApiIntegrationService {
  private static instance: ApiIntegrationService;
  private baseUrl: string;
  private apiKey: string;

  private constructor() {
    this.baseUrl = Platform.select({
      ios: 'http://localhost:3000',
      android: 'http://10.0.2.2:3000',
    }) || 'http://localhost:3000';
    this.apiKey = '';
  }

  static getInstance(): ApiIntegrationService {
    if (!ApiIntegrationService.instance) {
      ApiIntegrationService.instance = new ApiIntegrationService();
    }
    return ApiIntegrationService.instance;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Field API
  async getFields(): Promise<Field[]> {
    return this.request<Field[]>('/api/fields');
  }

  async getField(id: string): Promise<Field> {
    return this.request<Field>(`/api/fields/${id}`);
  }

  async createField(field: Omit<Field, 'id' | 'createdAt' | 'updatedAt'>): Promise<Field> {
    return this.request<Field>('/api/fields', {
      method: 'POST',
      body: JSON.stringify(field),
    });
  }

  async updateField(id: string, field: Partial<Field>): Promise<Field> {
    return this.request<Field>(`/api/fields/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(field),
    });
  }

  async deleteField(id: string): Promise<void> {
    await this.request(`/api/fields/${id}`, {
      method: 'DELETE',
    });
  }

  // Form API
  async getForms(): Promise<Form[]> {
    return this.request<Form[]>('/api/forms');
  }

  async getForm(id: string): Promise<Form> {
    return this.request<Form>(`/api/forms/${id}`);
  }

  async createForm(form: Omit<Form, 'id' | 'createdAt' | 'updatedAt'>): Promise<Form> {
    return this.request<Form>('/api/forms', {
      method: 'POST',
      body: JSON.stringify(form),
    });
  }

  async updateForm(id: string, form: Partial<Form>): Promise<Form> {
    return this.request<Form>(`/api/forms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(form),
    });
  }

  async deleteForm(id: string): Promise<void> {
    await this.request(`/api/forms/${id}`, {
      method: 'DELETE',
    });
  }

  // User API
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/api/users');
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>(`/api/users/${id}`);
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return this.request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    return this.request<User>(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.request(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Legacy API Integration
  async importLegacyData(data: {
    fields?: Field[];
    forms?: Form[];
    users?: User[];
  }): Promise<void> {
    await this.request('/api/legacy/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async exportLegacyData(): Promise<{
    fields: Field[];
    forms: Form[];
    users: User[];
  }> {
    return this.request('/api/legacy/export');
  }
} 