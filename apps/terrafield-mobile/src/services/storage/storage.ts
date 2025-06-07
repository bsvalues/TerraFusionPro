import AsyncStorage from '@react-native-async-storage/async-storage';
import { Field } from '../../types/field';
import { Form } from '../../types/form';
import { User } from '../../types/user';

export class StorageService {
  private static instance: StorageService;
  private fieldsKey = '@fields';
  private formsKey = '@forms';
  private usersKey = '@users';
  private cacheKey = '@cache';

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Field Storage
  async getFields(): Promise<Field[]> {
    try {
      const fields = await AsyncStorage.getItem(this.fieldsKey);
      return fields ? JSON.parse(fields) : [];
    } catch (error) {
      console.error('Failed to get fields:', error);
      return [];
    }
  }

  async saveFields(fields: Field[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.fieldsKey, JSON.stringify(fields));
    } catch (error) {
      console.error('Failed to save fields:', error);
      throw error;
    }
  }

  async addField(field: Field): Promise<void> {
    try {
      const fields = await this.getFields();
      fields.push(field);
      await this.saveFields(fields);
    } catch (error) {
      console.error('Failed to add field:', error);
      throw error;
    }
  }

  async updateField(field: Field): Promise<void> {
    try {
      const fields = await this.getFields();
      const index = fields.findIndex(f => f.id === field.id);
      if (index !== -1) {
        fields[index] = field;
        await this.saveFields(fields);
      }
    } catch (error) {
      console.error('Failed to update field:', error);
      throw error;
    }
  }

  async deleteField(fieldId: string): Promise<void> {
    try {
      const fields = await this.getFields();
      const filteredFields = fields.filter(f => f.id !== fieldId);
      await this.saveFields(filteredFields);
    } catch (error) {
      console.error('Failed to delete field:', error);
      throw error;
    }
  }

  // Form Storage
  async getForms(): Promise<Form[]> {
    try {
      const forms = await AsyncStorage.getItem(this.formsKey);
      return forms ? JSON.parse(forms) : [];
    } catch (error) {
      console.error('Failed to get forms:', error);
      return [];
    }
  }

  async saveForms(forms: Form[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.formsKey, JSON.stringify(forms));
    } catch (error) {
      console.error('Failed to save forms:', error);
      throw error;
    }
  }

  async addForm(form: Form): Promise<void> {
    try {
      const forms = await this.getForms();
      forms.push(form);
      await this.saveForms(forms);
    } catch (error) {
      console.error('Failed to add form:', error);
      throw error;
    }
  }

  async updateForm(form: Form): Promise<void> {
    try {
      const forms = await this.getForms();
      const index = forms.findIndex(f => f.id === form.id);
      if (index !== -1) {
        forms[index] = form;
        await this.saveForms(forms);
      }
    } catch (error) {
      console.error('Failed to update form:', error);
      throw error;
    }
  }

  async deleteForm(formId: string): Promise<void> {
    try {
      const forms = await this.getForms();
      const filteredForms = forms.filter(f => f.id !== formId);
      await this.saveForms(filteredForms);
    } catch (error) {
      console.error('Failed to delete form:', error);
      throw error;
    }
  }

  // User Storage
  async getUsers(): Promise<User[]> {
    try {
      const users = await AsyncStorage.getItem(this.usersKey);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  }

  async saveUsers(users: User[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.usersKey, JSON.stringify(users));
    } catch (error) {
      console.error('Failed to save users:', error);
      throw error;
    }
  }

  async addUser(user: User): Promise<void> {
    try {
      const users = await this.getUsers();
      users.push(user);
      await this.saveUsers(users);
    } catch (error) {
      console.error('Failed to add user:', error);
      throw error;
    }
  }

  async updateUser(user: User): Promise<void> {
    try {
      const users = await this.getUsers();
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        users[index] = user;
        await this.saveUsers(users);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const users = await this.getUsers();
      const filteredUsers = users.filter(u => u.id !== userId);
      await this.saveUsers(filteredUsers);
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }

  // Cache Management
  async getCache<T>(key: string): Promise<T | null> {
    try {
      const cache = await AsyncStorage.getItem(this.cacheKey);
      if (cache) {
        const cacheData = JSON.parse(cache);
        return cacheData[key] || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get cache:', error);
      return null;
    }
  }

  async setCache<T>(key: string, value: T): Promise<void> {
    try {
      const cache = await AsyncStorage.getItem(this.cacheKey);
      const cacheData = cache ? JSON.parse(cache) : {};
      cacheData[key] = value;
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to set cache:', error);
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.cacheKey);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  // Data Management
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.fieldsKey,
        this.formsKey,
        this.usersKey,
        this.cacheKey,
      ]);
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }

  async exportData(): Promise<{
    fields: Field[];
    forms: Form[];
    users: User[];
  }> {
    try {
      const [fields, forms, users] = await Promise.all([
        this.getFields(),
        this.getForms(),
        this.getUsers(),
      ]);

      return { fields, forms, users };
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  async importData(data: {
    fields?: Field[];
    forms?: Form[];
    users?: User[];
  }): Promise<void> {
    try {
      if (data.fields) {
        await this.saveFields(data.fields);
      }
      if (data.forms) {
        await this.saveForms(data.forms);
      }
      if (data.users) {
        await this.saveUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }
} 