import AsyncStorage from '@react-native-async-storage/async-storage';

// Types of merge strategies
enum MergeStrategy {
  TIMESTAMP = 'timestamp',
  CLIENT_WINS = 'client_wins',
  SERVER_WINS = 'server_wins',
  FIELD_BY_FIELD = 'field_by_field',
  MANUAL = 'manual',
}

// Interface for merge settings
interface MergeSettings {
  strategy: MergeStrategy;
  customFields?: {
    [fieldName: string]: MergeStrategy;
  };
  manualPreference?: MergeStrategy;
}

// Default merge settings
const DEFAULT_MERGE_SETTINGS: MergeSettings = {
  strategy: MergeStrategy.TIMESTAMP,
  customFields: {},
  manualPreference: MergeStrategy.CLIENT_WINS,
};

/**
 * Service to resolve conflicts between client and server data
 */
export class ConflictResolutionService {
  private static instance: ConflictResolutionService;
  private mergeSettings: MergeSettings = DEFAULT_MERGE_SETTINGS;

  /**
   * Private constructor to implement singleton pattern
   */
  private constructor() {
    this.loadSettings();
  }

  /**
   * Get instance of ConflictResolutionService (Singleton)
   */
  public static getInstance(): ConflictResolutionService {
    if (!ConflictResolutionService.instance) {
      ConflictResolutionService.instance = new ConflictResolutionService();
    }
    return ConflictResolutionService.instance;
  }

  /**
   * Load settings from AsyncStorage
   */
  private async loadSettings(): Promise<void> {
    try {
      const settingsJson = await AsyncStorage.getItem('terrafield_merge_settings');
      if (settingsJson) {
        this.mergeSettings = { ...DEFAULT_MERGE_SETTINGS, ...JSON.parse(settingsJson) };
      }
    } catch (error) {
      console.error('Error loading merge settings:', error);
      this.mergeSettings = DEFAULT_MERGE_SETTINGS;
    }
  }

  /**
   * Save settings to AsyncStorage
   */
  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('terrafield_merge_settings', JSON.stringify(this.mergeSettings));
    } catch (error) {
      console.error('Error saving merge settings:', error);
    }
  }

  /**
   * Set merge strategy
   */
  public async setMergeStrategy(strategy: MergeStrategy): Promise<void> {
    this.mergeSettings.strategy = strategy;
    await this.saveSettings();
  }

  /**
   * Set custom field merge strategy
   */
  public async setFieldMergeStrategy(fieldName: string, strategy: MergeStrategy): Promise<void> {
    if (!this.mergeSettings.customFields) {
      this.mergeSettings.customFields = {};
    }
    this.mergeSettings.customFields[fieldName] = strategy;
    await this.saveSettings();
  }

  /**
   * Set manual preference
   */
  public async setManualPreference(preference: MergeStrategy): Promise<void> {
    this.mergeSettings.manualPreference = preference;
    await this.saveSettings();
  }

  /**
   * Get merge settings
   */
  public getMergeSettings(): MergeSettings {
    return { ...this.mergeSettings };
  }

  /**
   * Resolve conflicts between client field notes and server field notes
   */
  public async resolveFieldNoteConflicts(
    clientNotes: any[],
    serverNotes: any[],
  ): Promise<any[]> {
    // Create maps for easier lookup
    const clientNotesMap = new Map<string, any>();
    clientNotes.forEach(note => {
      clientNotesMap.set(note.id, note);
    });

    const serverNotesMap = new Map<string, any>();
    serverNotes.forEach(note => {
      serverNotesMap.set(note.id, note);
    });

    // Find notes that exist in both client and server (potential conflicts)
    const conflictNotes = Array.from(clientNotesMap.keys())
      .filter(id => serverNotesMap.has(id))
      .map(id => ({
        id,
        clientNote: clientNotesMap.get(id),
        serverNote: serverNotesMap.get(id),
      }));

    // Resolve each conflict
    for (const { id, clientNote, serverNote } of conflictNotes) {
      const resolvedNote = this.resolveNoteConflict(clientNote, serverNote);
      // Update both maps with the resolved note
      clientNotesMap.set(id, resolvedNote);
      serverNotesMap.set(id, resolvedNote);
    }

    // Merge all notes from both client and server
    const allNoteIds = new Set([
      ...Array.from(clientNotesMap.keys()),
      ...Array.from(serverNotesMap.keys()),
    ]);

    // Create final array of resolved notes
    const resolvedNotes = Array.from(allNoteIds).map(id => {
      // If it exists in client map, use that (which includes any resolved conflicts)
      // Otherwise, use the server version
      return clientNotesMap.get(id) || serverNotesMap.get(id);
    });

    return resolvedNotes;
  }

  /**
   * Resolve conflict between a single client note and server note
   */
  private resolveNoteConflict(clientNote: any, serverNote: any): any {
    // If they're exactly the same, no conflict
    if (JSON.stringify(clientNote) === JSON.stringify(serverNote)) {
      return clientNote;
    }

    // Get the strategy for this field
    const strategy = this.mergeSettings.customFields?.['fieldNotes'] 
      || this.mergeSettings.strategy;

    switch (strategy) {
      case MergeStrategy.TIMESTAMP: {
        const clientTime = new Date(clientNote.createdAt).getTime();
        const serverTime = new Date(serverNote.createdAt).getTime();
        return clientTime > serverTime ? clientNote : serverNote;
      }

      case MergeStrategy.CLIENT_WINS:
        return clientNote;

      case MergeStrategy.SERVER_WINS:
        return serverNote;

      case MergeStrategy.FIELD_BY_FIELD:
        return this.mergeFieldByField(clientNote, serverNote);

      case MergeStrategy.MANUAL:
        // For automated syncing, use the manual preference
        if (this.mergeSettings.manualPreference === MergeStrategy.CLIENT_WINS) {
          return clientNote;
        } else if (this.mergeSettings.manualPreference === MergeStrategy.SERVER_WINS) {
          return serverNote;
        } else {
          // Default to timestamp if no preference
          const clientTime = new Date(clientNote.createdAt).getTime();
          const serverTime = new Date(serverNote.createdAt).getTime();
          return clientTime > serverTime ? clientNote : serverNote;
        }

      default:
        // Default to client wins
        return clientNote;
    }
  }

  /**
   * Merge two objects field by field
   */
  private mergeFieldByField(clientObj: any, serverObj: any): any {
    const result = { ...clientObj };

    // For each field in the server object
    for (const [key, serverValue] of Object.entries(serverObj)) {
      // Skip the id field
      if (key === 'id') continue;

      const clientValue = clientObj[key];

      // If the field doesn't exist in client, use server value
      if (clientValue === undefined) {
        result[key] = serverValue;
        continue;
      }

      // If the field has a custom merge strategy, use it
      const fieldStrategy = this.mergeSettings.customFields?.[key];
      if (fieldStrategy) {
        switch (fieldStrategy) {
          case MergeStrategy.TIMESTAMP:
            // For timestamp field, prefer the latest
            if (key === 'createdAt' || key === 'updatedAt') {
              const clientTime = new Date(clientValue).getTime();
              const serverTime = new Date(serverValue).getTime();
              result[key] = clientTime > serverTime ? clientValue : serverValue;
            } else {
              // For non-timestamp fields, timestamp strategy doesn't make sense
              // Default to client wins
              result[key] = clientValue;
            }
            break;

          case MergeStrategy.CLIENT_WINS:
            result[key] = clientValue;
            break;

          case MergeStrategy.SERVER_WINS:
            result[key] = serverValue;
            break;

          case MergeStrategy.FIELD_BY_FIELD:
            // For nested objects
            if (typeof clientValue === 'object' && typeof serverValue === 'object') {
              result[key] = this.mergeFieldByField(clientValue, serverValue);
            } else {
              // Default to client for non-objects
              result[key] = clientValue;
            }
            break;

          case MergeStrategy.MANUAL:
            // For automated syncing, use manual preference
            if (this.mergeSettings.manualPreference === MergeStrategy.CLIENT_WINS) {
              result[key] = clientValue;
            } else if (this.mergeSettings.manualPreference === MergeStrategy.SERVER_WINS) {
              result[key] = serverValue;
            } else {
              // Default to client wins
              result[key] = clientValue;
            }
            break;

          default:
            result[key] = clientValue;
        }
      } else {
        // No custom strategy, use the default field-by-field behavior
        if (typeof clientValue === 'object' && typeof serverValue === 'object') {
          // Recursively merge objects
          result[key] = this.mergeFieldByField(clientValue, serverValue);
        } else {
          // For simple values, client wins
          result[key] = clientValue;
        }
      }
    }

    return result;
  }
}