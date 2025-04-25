import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataSyncService } from '../services/DataSyncService';
import { NotificationService } from '../services/NotificationService';
import { useAuth } from '../hooks/useAuth';
import * as Colors from '../constants/Colors';

// Field note interface
interface FieldNote {
  id: string;
  parcelId: string;
  text: string;
  createdAt: string;
  createdBy: string;
  userId: number;
}

// Connection status component
const ConnectionStatus = ({ isConnected, pendingChanges }: { isConnected: boolean; pendingChanges: boolean }) => {
  return (
    <View style={styles.connectionStatus}>
      <View style={[styles.statusDot, { backgroundColor: isConnected ? Colors.online : Colors.offline }]} />
      <Text style={styles.statusText}>
        {isConnected ? 'Online' : 'Offline'}{pendingChanges ? ' (Changes pending)' : ''}
      </Text>
    </View>
  );
};

// CollaborativeFieldNotes component
const CollaborativeFieldNotes = ({ parcelId, propertyAddress = 'Property', onUpdate = () => {} }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<FieldNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  
  // Services
  const dataSyncService = useRef(DataSyncService.getInstance());
  const notificationService = useRef(NotificationService.getInstance());
  
  // Document ID (same as parcel ID in this case)
  const docId = parcelId;
  
  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      
      try {
        // Load field notes
        const fetchedNotes = await dataSyncService.current.getFieldNotes(docId, parcelId);
        setNotes(fetchedNotes);
        
        // Set up network status listener
        const unsubscribe = NetInfo.addEventListener(state => {
          setIsConnected(state.isConnected);
        });
        
        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing CollaborativeFieldNotes:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
    
    // Check sync status periodically
    const checkSyncInterval = setInterval(() => {
      checkPendingChanges();
    }, 5000);
    
    return () => {
      clearInterval(checkSyncInterval);
    };
  }, [parcelId]);
  
  // Check for pending changes
  const checkPendingChanges = async () => {
    try {
      const syncState = await AsyncStorage.getItem(`sync_state_${docId}`);
      if (syncState) {
        const state = JSON.parse(syncState);
        setPendingChanges(state.pendingChanges || false);
      }
    } catch (error) {
      console.error('Error checking pending changes:', error);
    }
  };
  
  // Force sync
  const forceSync = async () => {
    if (!isConnected) {
      return;
    }
    
    setSyncStatus('syncing');
    
    try {
      const success = await dataSyncService.current.syncDoc(docId, parcelId);
      
      if (success) {
        setSyncStatus('success');
        setPendingChanges(false);
        setTimeout(() => setSyncStatus('idle'), 2000);
      } else {
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Error syncing:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };
  
  // Add a new note
  const addNote = async () => {
    if (!newNote.trim() || !user) return;
    
    try {
      const noteId = await dataSyncService.current.addFieldNote(
        docId,
        parcelId,
        newNote.trim(),
        user.id,
        user.name || user.username
      );
      
      // Refresh notes
      const updatedNotes = await dataSyncService.current.getFieldNotes(docId, parcelId);
      setNotes(updatedNotes);
      
      // Clear input
      setNewNote('');
      
      // Notify parent component
      onUpdate(updatedNotes);
      
      // Force sync if online
      if (isConnected) {
        await dataSyncService.current.syncDoc(docId, parcelId);
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };
  
  // Update a note
  const updateNote = async (noteId: string) => {
    if (!editText.trim() || !user) return;
    
    try {
      const success = await dataSyncService.current.updateFieldNote(
        docId,
        parcelId,
        noteId,
        editText.trim()
      );
      
      if (success) {
        // Refresh notes
        const updatedNotes = await dataSyncService.current.getFieldNotes(docId, parcelId);
        setNotes(updatedNotes);
        
        // Exit edit mode
        setEditingNote(null);
        setEditText('');
        
        // Notify parent component
        onUpdate(updatedNotes);
        
        // Force sync if online
        if (isConnected) {
          await dataSyncService.current.syncDoc(docId, parcelId);
        }
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };
  
  // Delete a note
  const deleteNote = async (noteId: string) => {
    try {
      const success = await dataSyncService.current.deleteFieldNote(
        docId,
        parcelId,
        noteId
      );
      
      if (success) {
        // Refresh notes
        const updatedNotes = await dataSyncService.current.getFieldNotes(docId, parcelId);
        setNotes(updatedNotes);
        
        // Notify parent component
        onUpdate(updatedNotes);
        
        // Force sync if online
        if (isConnected) {
          await dataSyncService.current.syncDoc(docId, parcelId);
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };
  
  // Start editing a note
  const startEditing = (note: FieldNote) => {
    setEditingNote(note.id);
    setEditText(note.text);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingNote(null);
    setEditText('');
  };
  
  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  
  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading field notes...</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Field Notes</Text>
        <View style={styles.headerRight}>
          <ConnectionStatus isConnected={isConnected === true} pendingChanges={pendingChanges} />
          {pendingChanges && isConnected && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={forceSync}
              disabled={syncStatus === 'syncing'}
            >
              {syncStatus === 'syncing' ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : syncStatus === 'success' ? (
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
              ) : syncStatus === 'error' ? (
                <Ionicons name="alert-circle" size={20} color={Colors.white} />
              ) : (
                <MaterialCommunityIcons name="sync" size={20} color={Colors.white} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Notes list */}
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.notesList}
        renderItem={({ item }) => (
          <View style={styles.noteItem}>
            {editingNote === item.id ? (
              // Edit mode
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  autoFocus
                />
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={[styles.editButton, styles.cancelButton]}
                    onPress={cancelEditing}
                  >
                    <Text style={styles.editButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editButton, styles.saveButton]}
                    onPress={() => updateNote(item.id)}
                  >
                    <Text style={styles.editButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // View mode
              <>
                <View style={styles.noteContent}>
                  <Text style={styles.noteText}>{item.text}</Text>
                  <View style={styles.noteInfo}>
                    <Text style={styles.noteAuthor}>{item.createdBy}</Text>
                    <Text style={styles.noteDate}>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>
                
                {user && user.id === item.userId && (
                  <View style={styles.noteActions}>
                    <TouchableOpacity
                      style={styles.noteActionButton}
                      onPress={() => startEditing(item)}
                    >
                      <Ionicons name="pencil" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.noteActionButton}
                      onPress={() => deleteNote(item.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No field notes yet</Text>
            <Text style={styles.emptySubtext}>Add the first note below</Text>
          </View>
        }
      />
      
      {/* Add note input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a field note..."
          value={newNote}
          onChangeText={setNewNote}
          multiline
        />
        <TouchableOpacity
          style={[styles.addButton, !newNote.trim() && styles.addButtonDisabled]}
          onPress={addNote}
          disabled={!newNote.trim()}
        >
          <Ionicons name="send" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    marginTop: 10,
    fontSize: 16,
    color: Colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  syncButton: {
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesList: {
    flexGrow: 1,
    padding: 16,
  },
  noteItem: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noteContent: {
    flex: 1,
  },
  noteText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  noteInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  noteDate: {
    fontSize: 10,
    color: Colors.textLight,
  },
  noteActions: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  noteActionButton: {
    padding: 6,
  },
  editContainer: {
    flex: 1,
  },
  editInput: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
    minHeight: 80,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: Colors.textLight,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  editButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 40,
    fontSize: 16,
    maxHeight: 100,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  addButtonDisabled: {
    backgroundColor: Colors.disabledButton,
  },
});

export default CollaborativeFieldNotes;