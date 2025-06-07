import AsyncStorage from '@react-native-async-storage/async-storage';
import { Field } from '../../types/field';
import { Form } from '../../types/form';
import { User } from '../../types/user';
import { ApiIntegrationService } from '../api/integration';

export class DatabaseMigrationService {
  private static instance: DatabaseMigrationService;
  private apiService: ApiIntegrationService;
  private migrationKey = '@migration_status';

  private constructor() {
    this.apiService = ApiIntegrationService.getInstance();
  }

  static getInstance(): DatabaseMigrationService {
    if (!DatabaseMigrationService.instance) {
      DatabaseMigrationService.instance = new DatabaseMigrationService();
    }
    return DatabaseMigrationService.instance;
  }

  private async getMigrationStatus(): Promise<{
    lastMigration: string;
    version: string;
  }> {
    try {
      const status = await AsyncStorage.getItem(this.migrationKey);
      return status ? JSON.parse(status) : { lastMigration: '', version: '0.0.0' };
    } catch (error) {
      console.error('Failed to get migration status:', error);
      return { lastMigration: '', version: '0.0.0' };
    }
  }

  private async setMigrationStatus(version: string): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.migrationKey,
        JSON.stringify({
          lastMigration: new Date().toISOString(),
          version,
        })
      );
    } catch (error) {
      console.error('Failed to set migration status:', error);
      throw error;
    }
  }

  async migrateLegacyData(): Promise<void> {
    try {
      const { version } = await this.getMigrationStatus();
      
      // Export legacy data
      const legacyData = await this.apiService.exportLegacyData();
      
      // Transform and validate data
      const transformedData = await this.transformLegacyData(legacyData);
      
      // Import transformed data
      await this.apiService.importLegacyData(transformedData);
      
      // Update migration status
      await this.setMigrationStatus('1.0.0');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  private async transformLegacyData(data: {
    fields: Field[];
    forms: Form[];
    users: User[];
  }): Promise<{
    fields: Field[];
    forms: Form[];
    users: User[];
  }> {
    return {
      fields: await this.transformFields(data.fields),
      forms: await this.transformForms(data.forms),
      users: await this.transformUsers(data.users),
    };
  }

  private async transformFields(fields: Field[]): Promise<Field[]> {
    return fields.map(field => ({
      ...field,
      id: field.id || this.generateId(),
      createdAt: field.createdAt || new Date().toISOString(),
      updatedAt: field.updatedAt || new Date().toISOString(),
    }));
  }

  private async transformForms(forms: Form[]): Promise<Form[]> {
    return forms.map(form => ({
      ...form,
      id: form.id || this.generateId(),
      createdAt: form.createdAt || new Date().toISOString(),
      updatedAt: form.updatedAt || new Date().toISOString(),
    }));
  }

  private async transformUsers(users: User[]): Promise<User[]> {
    return users.map(user => ({
      ...user,
      id: user.id || this.generateId(),
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString(),
    }));
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async rollbackMigration(): Promise<void> {
    try {
      const { version } = await this.getMigrationStatus();
      
      if (version === '0.0.0') {
        throw new Error('No migration to rollback');
      }
      
      // Export current data
      const currentData = await this.apiService.exportLegacyData();
      
      // Store current data as backup
      await AsyncStorage.setItem('@migration_backup', JSON.stringify(currentData));
      
      // Import legacy data
      const legacyData = await this.apiService.exportLegacyData();
      await this.apiService.importLegacyData(legacyData);
      
      // Reset migration status
      await this.setMigrationStatus('0.0.0');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }

  async restoreFromBackup(): Promise<void> {
    try {
      const backupData = await AsyncStorage.getItem('@migration_backup');
      
      if (!backupData) {
        throw new Error('No backup data found');
      }
      
      const data = JSON.parse(backupData);
      await this.apiService.importLegacyData(data);
      
      // Restore migration status
      await this.setMigrationStatus('1.0.0');
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }
} 