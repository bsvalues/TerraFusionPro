import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { DataSyncService } from '../services/DataSyncService';
import { NotificationService, NotificationType } from '../services/NotificationService';
import * as Colors from '../constants/Colors';

// Define Field Note interface
interface FieldNote {
  id?: string;
  parcelId: string;
  text: string;
  createdAt?: string;
  createdBy: string;
  userId: number;
}

// Props for note item component
interface NoteItemProps {
  note: FieldNote;
  isCurrentUser: boolean;
  onDelete: (noteId: string) => void;
}

// Main component props
interface CollaborativeFieldNotesProps {
  parcelId: string;
  onNotesChanged?: (notes: FieldNote[]) => void;
}

// Note Item component
const NoteItem: React.FC<NoteItemProps> = ({ note, isCurrentUser, onDelete }) => {
  const formattedDate = note.createdAt 
    ? new Date(note.createdAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : 'Just now';
  
  return (
    <View style={[
      styles.noteContainer,
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
          <Feather name="trash-2" size={16} color={Colors.errorText} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Main CollaborativeFieldNotes Component
const CollaborativeFieldNotes: React.FC<CollaborativeFieldNotesProps> = ({ 
  parcelId,
  onNotesChanged
}) => {
  // Services
  const dataSyncService = DataSyncService.getInstance();
  const notificationService = NotificationService.getInstance();
  
  // State
  const [notes, setNotes] = useState<FieldNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // Auth and user info
  const user = useAuth();
  const currentUserId = user?.id || 1; // Fallback to a default user ID
  const currentUserName = user?.name || 'Me';
  
  // Refs
  const flatListRef = useRef<FlatList>(null);
  
  // Load notes
  useEffect(() => {
    const loadNotes = async () => {
      setIsLoading(true);
      try {
        const fieldNotes = await dataSyncService.getFieldNotes(parcelId);
        setNotes(fieldNotes);
        if (onNotesChanged) {
          onNotesChanged(fieldNotes);
        }
      } catch (error) {
        console.error('Error loading field notes:', error);
        Alert.alert(
          'Error',
          'Failed to load field notes. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    loadNotes();
    
    // Set up periodic refresh
    const refreshInterval = setInterval(loadNotes, 30000); // Refresh every 30 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [parcelId]);
  
  // Add note
  const handleAddNote = useCallback(async () => {
    if (!newNote.trim()) return;
    
    setIsSending(true);
    try {
      const noteData: FieldNote = {
        parcelId,
        text: newNote.trim(),
        createdBy: currentUserName,
        userId: currentUserId
      };
      
      const success = await dataSyncService.addFieldNote(noteData);
      
      if (success) {
        // Refresh notes
        const updatedNotes = await dataSyncService.getFieldNotes(parcelId);
        setNotes(updatedNotes);
        if (onNotesChanged) {
          onNotesChanged(updatedNotes);
        }
        
        // Clear input
        setNewNote('');
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert(
          'Error',
          'Failed to add note. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error adding field note:', error);
      Alert.alert(
        'Error',
        'Failed to add note. Please try again.'
      );
    } finally {
      setIsSending(false);
    }
  }, [newNote, parcelId, currentUserId, currentUserName]);
  
  // Delete note
  const handleDeleteNote = useCallback(async (noteId: string) => {
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
            try {
              const success = await dataSyncService.deleteFieldNote(parcelId, noteId);
              
              if (success) {
                // Refresh notes
                const updatedNotes = await dataSyncService.getFieldNotes(parcelId);
                setNotes(updatedNotes);
                if (onNotesChanged) {
                  onNotesChanged(updatedNotes);
                }
                
                // Send notification
                notificationService.sendNotification(
                  currentUserId,
                  NotificationType.FIELD_NOTE_DELETED,
                  'Note Deleted',
                  'Your field note has been deleted.'
                );
              } else {
                Alert.alert(
                  'Error',
                  'Failed to delete note. Please try again.'
                );
              }
            } catch (error) {
              console.error('Error deleting field note:', error);
              Alert.alert(
                'Error',
                'Failed to delete note. Please try again.'
              );
            }
          }
        }
      ]
    );
  }, [parcelId, currentUserId]);
  
  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.emptyText}>Loading field notes...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Feather name="file-text" size={48} color={Colors.textLight} />
        <Text style={styles.emptyTitle}>No Notes Yet</Text>
        <Text style={styles.emptyText}>
          Add notes about this property that will sync between devices and team members.
        </Text>
      </View>
    );
  };
  
  // Render note item
  const renderNoteItem = ({ item }: { item: FieldNote }) => (
    <NoteItem
      note={item}
      isCurrentUser={item.userId === currentUserId}
      onDelete={handleDeleteNote}
    />
  );
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <FlatList
        ref={flatListRef}
        data={notes}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id || `temp-${Date.now()}`}
        contentContainerStyle={styles.notesList}
        ListEmptyComponent={renderEmptyState}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a note..."
          placeholderTextColor={Colors.textLight}
          value={newNote}
          onChangeText={setNewNote}
          multiline
          maxLength={1000}
          returnKeyType="done"
          blurOnSubmit={true}
        />
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newNote.trim() || isSending) && styles.disabledButton
          ]}
          onPress={handleAddNote}
          disabled={!newNote.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Feather name="send" size={20} color={Colors.white} />
          )}
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
  notesList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    maxWidth: '80%',
  },
  noteContainer: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    maxWidth: '80%',
  },
  currentUserNote: {
    backgroundColor: Colors.lightPrimary,
    borderTopRightRadius: 2,
    alignSelf: 'flex-end',
    marginLeft: '20%',
  },
  otherUserNote: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 2,
    alignSelf: 'flex-start',
    marginRight: '20%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noteAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  noteDate: {
    fontSize: 11,
    color: Colors.textLight,
    marginLeft: 8,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
  deleteButton: {
    position: 'absolute',
    right: -8,
    top: -8,
    backgroundColor: Colors.cardBackground,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: Colors.disabledButton,
  },
});

export default CollaborativeFieldNotes;