import NetInfo from '@react-native-community/netinfo';
import { ApiIntegrationService } from '../api/integration';
import { StorageService } from '../storage/storage';
import { SettingsService } from '../settings/settings';

interface SyncStatus {
  lastSync: string;
  status: 'idle' | 'syncing' | 'error';
  error?: string;
}

export class SyncService {
  private static instance: SyncService;
  private apiService: ApiIntegrationService;
  private storageService: StorageService;
  private settingsService: SettingsService;
  private syncKey = '@sync_status';
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.apiService = ApiIntegrationService.getInstance();
    this.storageService = StorageService.getInstance();
    this.settingsService = SettingsService.getInstance();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async initialize(): Promise<void> {
    try {
      const settings = await this.settingsService.getSyncSettings();
      if (settings.autoSync) {
        this.startAutoSync(settings.syncInterval);
      }
    } catch (error) {
      console.error('Failed to initialize sync service:', error);
      throw error;
    }
  }

  private async getSyncStatus(): Promise<SyncStatus> {
    try {
      const status = await this.storageService.getCache<SyncStatus>(this.syncKey);
      return status || {
        lastSync: '',
        status: 'idle',
      };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return {
        lastSync: '',
        status: 'error',
        error: 'Failed to get sync status',
      };
    }
  }

  private async setSyncStatus(status: Partial<SyncStatus>): Promise<void> {
    try {
      const currentStatus = await this.getSyncStatus();
      await this.storageService.setCache(this.syncKey, {
        ...currentStatus,
        ...status,
      });
    } catch (error) {
      console.error('Failed to set sync status:', error);
      throw error;
    }
  }

  async startAutoSync(intervalMinutes: number): Promise<void> {
    try {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
      }

      this.syncInterval = setInterval(
        () => this.sync(),
        intervalMinutes * 60 * 1000
      );
    } catch (error) {
      console.error('Failed to start auto sync:', error);
      throw error;
    }
  }

  async stopAutoSync(): Promise<void> {
    try {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
    } catch (error) {
      console.error('Failed to stop auto sync:', error);
      throw error;
    }
  }

  async sync(): Promise<void> {
    try {
      const settings = await this.settingsService.getSyncSettings();
      const networkState = await NetInfo.fetch();

      if (settings.wifiOnly && networkState.type !== 'wifi') {
        throw new Error('Sync requires WiFi connection');
      }

      await this.setSyncStatus({ status: 'syncing' });

      // Sync fields
      const localFields = await this.storageService.getFields();
      const remoteFields = await this.apiService.getFields();
      await this.syncFields(localFields, remoteFields);

      // Sync forms
      const localForms = await this.storageService.getForms();
      const remoteForms = await this.apiService.getForms();
      await this.syncForms(localForms, remoteForms);

      // Sync users
      const localUsers = await this.storageService.getUsers();
      const remoteUsers = await this.apiService.getUsers();
      await this.syncUsers(localUsers, remoteUsers);

      await this.setSyncStatus({
        lastSync: new Date().toISOString(),
        status: 'idle',
      });
    } catch (error) {
      console.error('Sync failed:', error);
      await this.setSyncStatus({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async syncFields(local: Field[], remote: Field[]): Promise<void> {
    try {
      const localMap = new Map(local.map(f => [f.id, f]));
      const remoteMap = new Map(remote.map(f => [f.id, f]));

      // Update local with remote changes
      for (const [id, remoteField] of remoteMap) {
        const localField = localMap.get(id);
        if (!localField || new Date(remoteField.updatedAt) > new Date(localField.updatedAt)) {
          await this.storageService.updateField(remoteField);
        }
      }

      // Push local changes to remote
      for (const [id, localField] of localMap) {
        const remoteField = remoteMap.get(id);
        if (!remoteField || new Date(localField.updatedAt) > new Date(remoteField.updatedAt)) {
          await this.apiService.updateField(id, localField);
        }
      }
    } catch (error) {
      console.error('Failed to sync fields:', error);
      throw error;
    }
  }

  private async syncForms(local: Form[], remote: Form[]): Promise<void> {
    try {
      const localMap = new Map(local.map(f => [f.id, f]));
      const remoteMap = new Map(remote.map(f => [f.id, f]));

      // Update local with remote changes
      for (const [id, remoteForm] of remoteMap) {
        const localForm = localMap.get(id);
        if (!localForm || new Date(remoteForm.updatedAt) > new Date(localForm.updatedAt)) {
          await this.storageService.updateForm(remoteForm);
        }
      }

      // Push local changes to remote
      for (const [id, localForm] of localMap) {
        const remoteForm = remoteMap.get(id);
        if (!remoteForm || new Date(localForm.updatedAt) > new Date(remoteForm.updatedAt)) {
          await this.apiService.updateForm(id, localForm);
        }
      }
    } catch (error) {
      console.error('Failed to sync forms:', error);
      throw error;
    }
  }

  private async syncUsers(local: User[], remote: User[]): Promise<void> {
    try {
      const localMap = new Map(local.map(u => [u.id, u]));
      const remoteMap = new Map(remote.map(u => [u.id, u]));

      // Update local with remote changes
      for (const [id, remoteUser] of remoteMap) {
        const localUser = localMap.get(id);
        if (!localUser || new Date(remoteUser.updatedAt) > new Date(localUser.updatedAt)) {
          await this.storageService.updateUser(remoteUser);
        }
      }

      // Push local changes to remote
      for (const [id, localUser] of localMap) {
        const remoteUser = remoteMap.get(id);
        if (!remoteUser || new Date(localUser.updatedAt) > new Date(remoteUser.updatedAt)) {
          await this.apiService.updateUser(id, localUser);
        }
      }
    } catch (error) {
      console.error('Failed to sync users:', error);
      throw error;
    }
  }

  async resolveConflict<T extends { id: string; updatedAt: string }>(
    local: T,
    remote: T,
    strategy: 'local' | 'remote' | 'newer'
  ): Promise<T> {
    try {
      switch (strategy) {
        case 'local':
          return local;
        case 'remote':
          return remote;
        case 'newer':
          return new Date(local.updatedAt) > new Date(remote.updatedAt) ? local : remote;
        default:
          throw new Error('Invalid conflict resolution strategy');
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      throw error;
    }
  }

  async getLastSyncTime(): Promise<string> {
    try {
      const status = await this.getSyncStatus();
      return status.lastSync;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      throw error;
    }
  }

  async getSyncError(): Promise<string | undefined> {
    try {
      const status = await this.getSyncStatus();
      return status.error;
    } catch (error) {
      console.error('Failed to get sync error:', error);
      throw error;
    }
  }
} 