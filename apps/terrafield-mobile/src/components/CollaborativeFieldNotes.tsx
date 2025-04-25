import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Y from 'yjs';
import { Buffer } from 'buffer';
import { fromUint8Array, toUint8Array } from 'js-base64';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../services/ApiService';
import { NotificationService, NotificationType } from '../services/NotificationService';
import { ConflictResolutionService, ConflictType, ResolutionStrategy } from '../services/ConflictResolutionService';
import { OfflineQueueService, OperationType } from '../services/OfflineQueueService';
import * as Colors from '../constants/Colors';

// Define field note interface to match server schema
interface FieldNote {
  id?: string;
  parcelId: string;
  text: string;
  createdAt?: string;
  createdBy: string;
  userId: number;
}

// Field note list item props
interface NoteItemProps {
  note: FieldNote;
  isCurrentUser: boolean;
  onDelete: (noteId: string) => void;
}

// Component props
interface CollaborativeFieldNotesProps {
  parcelId: string;
  onNotesChanged?: (notes: FieldNote[]) => void;
}

// Individual note item component
const NoteItem: React.FC<NoteItemProps> = ({ note, isCurrentUser, onDelete }) => {
  const formattedDate = note.createdAt 
    ? new Date(note.createdAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : '';
  
  return (
    <View style={[
      styles.noteItem, 
      isCurrentUser ? styles.currentUserNote : styles.otherUserNote
    ]}>
      <View style={styles.noteHeader}>
        <Text style={styles.noteAuthor}>{note.createdBy}</Text>
        <Text style={styles.noteDate}>{formattedDate}</Text>
      </View>
      
      <Text style={styles.noteText}>{note.text}</Text>
      
      {isCurrentUser && (
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => note.id && onDelete(note.id)}
        >
          <Feather name="trash-2" size={14} color={Colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Main component
const CollaborativeFieldNotes: React.FC<CollaborativeFieldNotesProps> = ({ 
  parcelId,
  onNotesChanged
}) => {
  // State
  const [notes, setNotes] = useState<FieldNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [user, setUser] = useState<{ id: number, name: string } | null>(null);
  
  // Refs
  const yDoc = useRef<Y.Doc | null>(null);
  const wsConnection = useRef<WebSocket | null>(null);
  const apiService = useRef(ApiService.getInstance());
  const notificationService = useRef(NotificationService.getInstance());
  const conflictService = useRef(ConflictResolutionService.getInstance());
  const offlineQueue = useRef(OfflineQueueService.getInstance());
  
  // Local state storage key
  const storageKeyPrefix = 'terrafield_fieldnotes_';
  
  // Initialize user
  useEffect(() => {
    const initUser = async () => {
      try {
        // In a real app, this would come from a proper auth system
        // For now, we'll use a placeholder user or get from AsyncStorage
        const savedUser = await AsyncStorage.getItem('terrafield_current_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          // Default fallback user
          const defaultUser = { id: 1, name: 'Field Agent' };
          setUser(defaultUser);
          await AsyncStorage.setItem('terrafield_current_user', JSON.stringify(defaultUser));
        }
      } catch (error) {
        console.error('Error getting current user:', error);
        // Use a fallback user
        setUser({ id: 1, name: 'Field Agent' });
      }
    };
    
    initUser();
  }, []);
  
  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = !!state.isConnected;
      setIsOnline(online);
      
      if (online && !isOnline) {
        // If we've just come back online, try to sync
        syncWithServer();
      }
    });
    
    return () => unsubscribe();
  }, [isOnline]);
  
  // Initialize Yjs document and load data
  useEffect(() => {
    const initDocument = async () => {
      if (!user) return; // Wait for user to be loaded
      
      try {
        setIsLoading(true);
        
        // Create the Yjs document
        const doc = new Y.Doc();
        yDoc.current = doc;
        
        // Try to load from local storage first
        const localData = await AsyncStorage.getItem(`${storageKeyPrefix}${parcelId}`);
        
        if (localData) {
          try {
            const parsedData = JSON.parse(localData);
            if (parsedData.update) {
              const update = toUint8Array(parsedData.update);
              Y.applyUpdate(doc, update);
            }
            
            // Get the notes from the document
            const notesArray = doc.getArray('notes');
            const loadedNotes = notesArray.toArray();
            setNotes(loadedNotes);
            onNotesChanged?.(loadedNotes);
            
            // Set last synced time
            if (parsedData.lastSynced) {
              setLastSynced(new Date(parsedData.lastSynced));
            }
          } catch (parseError) {
            console.error('Error parsing local data:', parseError);
          }
        }
        
        // If we're online, try to sync with the server
        if (isOnline) {
          await syncWithServer();
        }
        
        // Set up real-time collaboration with WebSocket if online
        if (isOnline) {
          connectWebSocket();
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing document:', error);
        setIsLoading(false);
      }
    };
    
    if (user) {
      initDocument();
    }
    
    return () => {
      // Clean up
      if (wsConnection.current) {
        wsConnection.current.close();
        wsConnection.current = null;
      }
      
      if (yDoc.current) {
        yDoc.current.destroy();
        yDoc.current = null;
      }
    };
  }, [parcelId, user]);
  
  // Connect to WebSocket for real-time updates
  const connectWebSocket = () => {
    if (!isOnline || !user) return;
    
    try {
      // Close existing connection if any
      if (wsConnection.current) {
        wsConnection.current.close();
      }
      
      // Get the WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Create new WebSocket connection
      const ws = new WebSocket(wsUrl);
      wsConnection.current = ws;
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        
        // Join this parcel's updates
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'join',
            parcelId
          }));
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'init':
              // Initial data from the server
              if (data.data && data.data.notes) {
                updateNotesFromRemote(data.data.notes);
              }
              break;
              
            case 'update':
              if (data.update && yDoc.current) {
                // Apply the update to our document
                const update = toUint8Array(data.update);
                Y.applyUpdate(yDoc.current, update);
                
                // Update notes from the shared doc
                if (data.data && data.data.notes) {
                  updateNotesFromRemote(data.data.notes);
                } else {
                  // If no data was sent, get notes from our doc
                  const notesArray = yDoc.current.getArray('notes');
                  const updatedNotes = notesArray.toArray();
                  setNotes(updatedNotes);
                  onNotesChanged?.(updatedNotes);
                }
              }
              break;
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Could implement reconnection logic here
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  };
  
  // Sync with server
  const syncWithServer = async () => {
    if (!isOnline || !yDoc.current || !user || isSyncing) return;
    
    try {
      setIsSyncing(true);
      
      // Encode current document state
      const update = Y.encodeStateAsUpdate(yDoc.current);
      const base64Update = fromUint8Array(update);
      
      // Call the sync API
      const response = await apiService.current.post(`/api/field-notes/${parcelId}/sync`, {
        update: base64Update
      });
      
      if (response.state && response.data) {
        // Apply the merged state from server
        const serverUpdate = toUint8Array(response.state);
        Y.applyUpdate(yDoc.current, serverUpdate);
        
        // Update notes from the server data
        updateNotesFromRemote(response.data.notes);
        
        // Save to local storage
        await saveToLocalStorage();
        
        // Update last synced time
        const now = new Date();
        setLastSynced(now);
        
        // Process any queued operations
        await offlineQueue.current.processQueue();
        
        // Resolve any conflicts automatically
        await resolveConflicts();
        
        notificationService.current.sendNotification(
          user.id,
          NotificationType.SYNC_COMPLETED,
          'Field Notes Synced',
          `Field notes for parcel ${parcelId} have been successfully synchronized.`
        );
      }
    } catch (error) {
      console.error('Error syncing with server:', error);
      
      notificationService.current.sendNotification(
        user?.id || 1,
        NotificationType.SYNC_FAILED,
        'Sync Failed',
        `Failed to sync field notes for parcel ${parcelId}. Will retry later.`
      );
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Save notes to local storage
  const saveToLocalStorage = async () => {
    if (!yDoc.current) return;
    
    try {
      // Encode current document state
      const update = Y.encodeStateAsUpdate(yDoc.current);
      const base64Update = fromUint8Array(update);
      
      // Save to local storage
      const dataToSave = {
        update: base64Update,
        lastSynced: lastSynced?.toISOString() || new Date().toISOString()
      };
      
      await AsyncStorage.setItem(
        `${storageKeyPrefix}${parcelId}`,
        JSON.stringify(dataToSave)
      );
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  };
  
  // Update notes from remote data
  const updateNotesFromRemote = (remoteNotes: FieldNote[]) => {
    if (!Array.isArray(remoteNotes)) return;
    
    setNotes(remoteNotes);
    onNotesChanged?.(remoteNotes);
  };
  
  // Add a new note
  const addNote = async () => {
    if (!newNoteText.trim() || !yDoc.current || !user) return;
    
    try {
      Keyboard.dismiss();
      
      // Create the note object
      const newNote: FieldNote = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        parcelId,
        text: newNoteText.trim(),
        createdAt: new Date().toISOString(),
        createdBy: user.name,
        userId: user.id
      };
      
      // Add to the Yjs document
      const notesArray = yDoc.current.getArray('notes');
      notesArray.push([newNote]);
      
      // Update state
      const updatedNotes = notesArray.toArray();
      setNotes(updatedNotes);
      onNotesChanged?.(updatedNotes);
      setNewNoteText('');
      
      // Send to server if online
      if (isOnline) {
        try {
          // Encode the document update
          const update = Y.encodeStateAsUpdate(yDoc.current);
          const base64Update = fromUint8Array(update);
          
          // Send via WebSocket if connected
          if (wsConnection.current && wsConnection.current.readyState === WebSocket.OPEN) {
            wsConnection.current.send(JSON.stringify({
              type: 'update',
              update: base64Update
            }));
          } else {
            // Otherwise use REST API
            await apiService.current.put(`/api/field-notes/${parcelId}/notes`, {
              update: base64Update
            });
          }
          
          // Save to local storage
          await saveToLocalStorage();
          
          // Notify collaborators
          notificationService.current.sendNotification(
            user.id,
            NotificationType.FIELD_NOTE_ADDED,
            'New Field Note',
            `${user.name} added a new field note to parcel ${parcelId}`
          );
        } catch (error) {
          console.error('Error sending note to server:', error);
          
          // Add to offline queue for later sync
          await offlineQueue.current.enqueue(
            OperationType.CREATE_NOTE,
            { note: newNote, parcelId },
            2 // Medium priority
          );
        }
      } else {
        // Add to offline queue for later sync
        await offlineQueue.current.enqueue(
          OperationType.CREATE_NOTE,
          { note: newNote, parcelId },
          2 // Medium priority
        );
        
        // Save to local storage
        await saveToLocalStorage();
      }
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Error', 'Failed to add note. Please try again.');
    }
  };
  
  // Delete a note
  const deleteNote = async (noteId: string) => {
    if (!yDoc.current || !user) return;
    
    try {
      // Ask for confirmation
      Alert.alert(
        'Delete Note',
        'Are you sure you want to delete this note?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              // Find the note in the Yjs document
              const notesArray = yDoc.current?.getArray('notes');
              if (!notesArray) return;
              
              const noteIndex = notesArray.toArray().findIndex(note => note.id === noteId);
              
              if (noteIndex === -1) return;
              
              // Remove from Yjs document
              notesArray.delete(noteIndex, 1);
              
              // Update state
              const updatedNotes = notesArray.toArray();
              setNotes(updatedNotes);
              onNotesChanged?.(updatedNotes);
              
              // Send to server if online
              if (isOnline) {
                try {
                  // Try to delete on the server
                  await apiService.current.delete(`/api/field-notes/${parcelId}/notes/${noteId}`);
                  
                  // Save to local storage
                  await saveToLocalStorage();
                } catch (error) {
                  console.error('Error deleting note from server:', error);
                  
                  // Add to offline queue for later sync
                  await offlineQueue.current.enqueue(
                    OperationType.DELETE_NOTE,
                    { noteId, parcelId },
                    2 // Medium priority
                  );
                }
              } else {
                // Add to offline queue for later sync
                await offlineQueue.current.enqueue(
                  OperationType.DELETE_NOTE,
                  { noteId, parcelId },
                  2 // Medium priority
                );
                
                // Save to local storage
                await saveToLocalStorage();
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting note:', error);
      Alert.alert('Error', 'Failed to delete note. Please try again.');
    }
  };
  
  // Resolve any conflicts
  const resolveConflicts = async () => {
    const conflicts = conflictService.current.getUnresolvedConflicts();
    const fieldNoteConflicts = conflicts.filter(
      conflict => conflict.type === ConflictType.FIELD_NOTE
    );
    
    if (fieldNoteConflicts.length > 0) {
      // Auto-resolve conflicts
      const resolvedCount = conflictService.current.autoResolveConflicts();
      console.log(`Auto-resolved ${resolvedCount} conflicts`);
    }
  };
  
  // Force sync with server
  const forceSyncWithServer = () => {
    if (!isOnline) {
      Alert.alert('Offline', 'You are currently offline. Please connect to the internet to sync.');
      return;
    }
    
    syncWithServer();
  };
  
  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="file-text" size={48} color={Colors.lightGray} />
      <Text style={styles.emptyStateText}>No field notes yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Add notes about this property to share with your team
      </Text>
    </View>
  );
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading field notes...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Connection status */}
      <View style={[
        styles.connectionStatus,
        isOnline ? styles.onlineStatus : styles.offlineStatus
      ]}>
        <View style={[
          styles.connectionIndicator,
          isOnline ? styles.onlineIndicator : styles.offlineIndicator
        ]} />
        <Text style={styles.connectionText}>
          {isOnline 
            ? 'Online - Real-time collaboration enabled' 
            : 'Offline - Changes will sync later'}
        </Text>
        
        {isOnline && (
          <TouchableOpacity 
            style={styles.syncButton}
            onPress={forceSyncWithServer}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Feather name="refresh-cw" size={14} color={Colors.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {/* Field notes list */}
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id || item.createdAt || Math.random().toString()}
        renderItem={({ item }) => (
          <NoteItem 
            note={item} 
            isCurrentUser={item.userId === user?.id}
            onDelete={deleteNote}
          />
        )}
        contentContainerStyle={styles.notesList}
        ListEmptyComponent={renderEmptyState}
      />
      
      {/* Add note input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a field note..."
          placeholderTextColor={Colors.inputPlaceholder}
          value={newNoteText}
          onChangeText={setNewNoteText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.addButton, !newNoteText.trim() && styles.addButtonDisabled]} 
          onPress={addNote}
          disabled={!newNoteText.trim()}
        >
          <Feather 
            name="send" 
            size={20} 
            color={newNoteText.trim() ? Colors.white : Colors.lightGray} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray,
  },
  notesList: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  noteItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: '85%',
  },
  currentUserNote: {
    backgroundColor: Colors.lightPrimary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherUserNote: {
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noteAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  noteDate: {
    fontSize: 11,
    color: Colors.textLight,
  },
  noteText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 8,
    padding: 4,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 24,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.inputText,
    minHeight: 40,
    maxHeight: 100,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addButtonDisabled: {
    backgroundColor: Colors.inputBackground,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: '80%',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  connectionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 12,
    flex: 1,
  },
  onlineStatus: {
    backgroundColor: Colors.lightSuccess,
  },
  offlineStatus: {
    backgroundColor: Colors.lightWarning,
  },
  onlineIndicator: {
    backgroundColor: Colors.success,
  },
  offlineIndicator: {
    backgroundColor: Colors.warning,
  },
  syncButton: {
    padding: 5,
  },
});

export default CollaborativeFieldNotes;