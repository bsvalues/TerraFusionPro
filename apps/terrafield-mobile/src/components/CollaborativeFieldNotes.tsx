import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DataSyncService } from '../services/DataSyncService';
import { ApiService } from '../services/ApiService';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import * as Colors from '../constants/Colors';

// Define interface for field note
interface FieldNote {
  id: string;
  parcelId: string;
  text: string;
  createdAt: string;
  createdBy: string;
  userId: number;
  // Active users currently viewing/editing this note
  activeUsers?: Array<{
    id: number;
    username: string;
    lastActive: string;
  }>;
}

// Props for the component
interface CollaborativeFieldNotesProps {
  parcelId: string;
  onNotesChanged?: (notes: FieldNote[]) => void;
}

const CollaborativeFieldNotes: React.FC<CollaborativeFieldNotesProps> = ({ 
  parcelId,
  onNotesChanged
}) => {
  // State
  const [notes, setNotes] = useState<FieldNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeUsers, setActiveUsers] = useState<{
    id: number;
    username: string;
    lastActive: string;
  }[]>([]);
  
  // References
  const wsRef = useRef<WebSocket | null>(null);
  const dataSyncService = DataSyncService.getInstance();
  const apiService = ApiService.getInstance();
  const { user } = useAuth();
  
  // Effect to initialize WebSocket connection and data loading
  useEffect(() => {
    // Load initial data and set up WebSocket
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // Get current notes from the server
        const response = await apiService.getParcelNotes(parcelId);
        if (response && response.data && response.data.notes) {
          setNotes(response.data.notes);
          if (onNotesChanged) {
            onNotesChanged(response.data.notes);
          }
        }
        
        // Set up WebSocket connection
        setupWebSocket();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing notes data:', error);
        Alert.alert('Error', 'Failed to load field notes. Working in offline mode.');
        setIsLoading(false);
      }
    };
    
    initializeData();
    
    // Register our presence every 30 seconds
    const presenceInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && user) {
        wsRef.current.send(JSON.stringify({
          type: 'presence',
          parcelId: parcelId,
          userId: user.id,
          username: user.username
        }));
      }
    }, 30000);
    
    // Clean up on component unmount
    return () => {
      clearInterval(presenceInterval);
      if (wsRef.current) {
        // Send leave message
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'leave',
            parcelId: parcelId
          }));
        }
        
        // Close connection
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [parcelId]);
  
  // Set up WebSocket connection
  const setupWebSocket = () => {
    // Create WebSocket connection
    const protocol = apiService.config.wsBaseUrl;
    const wsUrl = `${protocol}/ws`;
    
    console.log('Connecting to WebSocket at:', wsUrl);
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      
      // Join this parcel's channel
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'join',
          parcelId: parcelId
        }));
        
        // Send presence
        if (user) {
          wsRef.current.send(JSON.stringify({
            type: 'presence',
            parcelId: parcelId,
            userId: user.id,
            username: user.username
          }));
        }
      }
    };
    
    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'init':
            // Initial data from server
            if (message.data && message.data.notes) {
              setNotes(message.data.notes);
              if (onNotesChanged) {
                onNotesChanged(message.data.notes);
              }
            }
            break;
            
          case 'update':
            // Update from another client
            if (message.data && message.data.notes) {
              setNotes(message.data.notes);
              if (onNotesChanged) {
                onNotesChanged(message.data.notes);
              }
            }
            break;
            
          case 'presence':
            // Update of active users
            if (message.users) {
              setActiveUsers(message.users);
            }
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    wsRef.current.onclose = () => {
      console.log('WebSocket connection closed');
    };
  };
  
  // Add a new note
  const addNote = async () => {
    if (!newNote.trim() || !user) return;
    
    try {
      setIsSyncing(true);
      
      // Create a new note object
      const noteObject: Omit<FieldNote, 'id'> = {
        parcelId: parcelId,
        text: newNote.trim(),
        createdAt: new Date().toISOString(),
        createdBy: user.username,
        userId: user.id
      };
      
      // Add note locally first for immediate feedback
      const tempNote = { ...noteObject, id: `temp-${Date.now()}` } as FieldNote;
      const updatedNotes = [...notes, tempNote];
      setNotes(updatedNotes);
      if (onNotesChanged) {
        onNotesChanged(updatedNotes);
      }
      
      // Clear input
      setNewNote('');
      
      // Sync with server using CRDT
      // This is a simplified approach - in a real app we'd encode the CRDT update
      const update = JSON.stringify({
        operation: 'add',
        note: noteObject
      });
      
      const response = await apiService.syncParcelNotes(parcelId, update);
      
      // Update with server response
      if (response && response.data && response.data.notes) {
        setNotes(response.data.notes);
        if (onNotesChanged) {
          onNotesChanged(response.data.notes);
        }
      }
      
      // If in a WebSocket connection, broadcast the update
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'update',
          update: update
        }));
      }
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Error', 'Failed to save note. It will be synced when connection is restored.');
      
      // Queue for later sync
      dataSyncService.queueOperation('notes', {
        type: 'add',
        parcelId: parcelId,
        data: {
          text: newNote.trim(),
          createdAt: new Date().toISOString(),
          createdBy: user.username,
          userId: user.id
        }
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Render a note item
  const renderNoteItem = ({ item }: { item: FieldNote }) => (
    <View style={styles.noteItem}>
      <View style={styles.noteHeader}>
        <Text style={styles.noteAuthor}>{item.createdBy}</Text>
        <Text style={styles.noteTime}>
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </Text>
      </View>
      <Text style={styles.noteText}>{item.text}</Text>
    </View>
  );
  
  // Render active users
  const renderActiveUsers = () => {
    if (activeUsers.length === 0) return null;
    
    return (
      <View style={styles.activeUsersContainer}>
        <Text style={styles.activeUsersTitle}>
          {activeUsers.length} Active {activeUsers.length === 1 ? 'User' : 'Users'}
        </Text>
        <View style={styles.activeUsersList}>
          {activeUsers.map(user => (
            <View key={user.id} style={styles.activeUserBadge}>
              <Text style={styles.activeUserText}>{user.username}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Header with active users */}
      <View style={styles.header}>
        <Text style={styles.title}>Field Notes</Text>
        {renderActiveUsers()}
      </View>
      
      {/* Notes list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={item => item.id}
          style={styles.notesList}
          contentContainerStyle={styles.notesContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Feather name="file-text" size={48} color={Colors.gray} />
              <Text style={styles.emptyText}>No field notes yet</Text>
              <Text style={styles.emptySubtext}>Add the first note below</Text>
            </View>
          )}
        />
      )}
      
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
          style={[
            styles.addButton,
            (!newNote.trim() || isSyncing) && styles.addButtonDisabled
          ]}
          onPress={addNote}
          disabled={!newNote.trim() || isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Sync status */}
      {isSyncing && (
        <View style={styles.syncingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.syncingText}>Syncing changes...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: Colors.gray,
    fontSize: 16,
  },
  notesList: {
    flex: 1,
  },
  notesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  noteItem: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noteAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  noteTime: {
    fontSize: 12,
    color: Colors.gray,
  },
  noteText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
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
    backgroundColor: Colors.gray,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.lightGray,
    marginTop: 4,
  },
  syncingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    backgroundColor: Colors.lightBackground,
  },
  syncingText: {
    marginLeft: 8,
    fontSize: 12,
    color: Colors.primary,
  },
  activeUsersContainer: {
    marginTop: 8,
  },
  activeUsersTitle: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 4,
  },
  activeUsersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  activeUserBadge: {
    backgroundColor: Colors.lightPrimary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 4,
  },
  activeUserText: {
    fontSize: 11,
    color: Colors.primary,
  },
});

export default CollaborativeFieldNotes;