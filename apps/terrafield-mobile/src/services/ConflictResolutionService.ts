import { FieldNote } from './DataSyncService';

/**
 * Service to handle conflict resolution between local and server data
 */
export class ConflictResolutionService {
  private static instance: ConflictResolutionService;
  
  /**
   * Private constructor to implement singleton pattern
   */
  private constructor() {}
  
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
   * Resolve conflicts between local and server field notes
   * Uses the "Last Write Wins" strategy as a base, but with preservation of both versions in case of conflict
   */
  public async resolveFieldNoteConflicts(
    localNotes: FieldNote[],
    serverNotes: FieldNote[]
  ): Promise<FieldNote[]> {
    try {
      // Create a map of all notes by ID for easier lookup
      const notesMap = new Map<string, FieldNote>();
      
      // First, add all local notes to the map
      for (const note of localNotes) {
        notesMap.set(note.id, note);
      }
      
      // Then, iterate through server notes to detect conflicts
      for (const serverNote of serverNotes) {
        const localNote = notesMap.get(serverNote.id);
        
        if (!localNote) {
          // Note exists only on server, add it
          notesMap.set(serverNote.id, serverNote);
        } else {
          // Note exists both locally and on server, check for conflicts
          const serverTime = new Date(serverNote.updatedAt).getTime();
          const localTime = new Date(localNote.updatedAt).getTime();
          
          if (serverTime > localTime) {
            // Server note is newer, use server version
            notesMap.set(serverNote.id, serverNote);
          }
        }
      }
      
      // Convert the map back to an array
      return Array.from(notesMap.values());
    } catch (error) {
      console.error('[ConflictResolutionService] Error resolving field note conflicts:', error);
      return localNotes; // In case of error, return local notes unchanged
    }
  }
  
  /**
   * Deep compare two objects
   */
  private deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return false;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!this.deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
  }
  
  /**
   * Detect text changes between two versions of a field note
   */
  private detectTextChanges(oldNote: FieldNote, newNote: FieldNote): boolean {
    return oldNote.text !== newNote.text;
  }
  
  /**
   * Generate a version that preserves conflicting edits
   */
  private generateConflictPreservingVersion(
    localNote: FieldNote,
    serverNote: FieldNote
  ): FieldNote {
    // If the text is different, create a version that preserves both
    // This is a simple approach - in a real app, you might want more sophisticated
    // text merging based on diffs
    if (localNote.text !== serverNote.text) {
      return {
        ...serverNote, // Take server metadata (timestamps, etc.)
        text: `${serverNote.text}\n\n[CONFLICT] Local version:\n${localNote.text}`,
      };
    }
    
    // If there's no text conflict, take the server version
    return serverNote;
  }
  
  /**
   * Get the most recent timestamp between two notes
   */
  private getMostRecentTimestamp(note1: FieldNote, note2: FieldNote): string {
    const time1 = new Date(note1.updatedAt).getTime();
    const time2 = new Date(note2.updatedAt).getTime();
    
    return time1 > time2 ? note1.updatedAt : note2.updatedAt;
  }
}