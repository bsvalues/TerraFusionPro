import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { DataSyncService, FieldNote } from '../services/DataSyncService';
import { ApiService } from '../services/ApiService';
import { NotificationService } from '../services/NotificationService';
import * as Colors from '../constants/Colors';

// Interface for property details
interface PropertyDetails {
  id: string;
  address: string;
  parcelId: string;
  propertyType: string;
  status: string;
}

// Interface for user presence
interface UserPresence {
  userId: number;
  name: string;
  color: string;
  status: 'online' | 'idle' | 'offline';
  lastActive: number;
}

const FieldNotesScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [notes, setNotes] = useState<FieldNote[]>([]);
  const [noteText, setNoteText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  
  // Get services
  const apiService = ApiService.getInstance();
  const dataSyncService = DataSyncService.getInstance();
  const notificationService = NotificationService.getInstance();
  
  // Get route params
  const propertyId = route.params?.propertyId || '';
  const parcelId = route.params?.parcelId || '';
  
  // References
  const flatListRef = useRef<FlatList>(null);
  
  // Document ID for Yjs
  const docId = `property_${propertyId}_parcel_${parcelId}`;
  
  // Load data
  useEffect(() => {
    loadData();
    
    // Set up listeners for property changes
    const interval = setInterval(() => {
      refreshNotes();
    }, 5000); // Check for updates every 5 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, [propertyId, parcelId]);
  
  // Load all data
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load property details
      await loadPropertyDetails();
      
      // Load notes
      await refreshNotes();
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load field notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load property details
  const loadPropertyDetails = async () => {
    try {
      if (apiService.isConnected()) {
        const data = await apiService.get<PropertyDetails>(`/api/properties/${propertyId}`);
        setProperty(data);
      } else {
        // Try to load from cache
        const cached = await loadFromCache(`property_${propertyId}`);
        if (cached) {
          setProperty(cached);
        }
      }
    } catch (error) {
      console.error('Error loading property details:', error);
      // Try to load from cache
      const cached = await loadFromCache(`property_${propertyId}`);
      if (cached) {
        setProperty(cached);
      }
    }
  };
  
  // Refresh notes
  const refreshNotes = async () => {
    try {
      const fieldNotes = await dataSyncService.getFieldNotes(docId, parcelId);
      
      // Sort by creation date (newest first)
      const sortedNotes = [...fieldNotes].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setNotes(sortedNotes);
      
      // Get active users
      if (dataSyncService.getActiveUsers) {
        const users = await dataSyncService.getActiveUsers(docId);
        setActiveUsers(users);
      }
    } catch (error) {
      console.error('Error refreshing notes:', error);
    }
  };
  
  // Handle adding a new note
  const handleAddNote = async () => {
    if (!noteText.trim() || !user) {
      return;
    }
    
    try {
      // Add note to sync service
      await dataSyncService.addFieldNote(
        docId,
        parcelId,
        noteText.trim(),
        user.id,
        user.name
      );
      
      // Clear input
      setNoteText('');
      
      // Refresh notes
      await refreshNotes();
      
      // Scroll to top
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Error', 'Failed to add note. Please try again.');
    }
  };
  
  // Handle sync now
  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      
      // Sync notes
      await dataSyncService.syncDoc(docId, parcelId);
      
      // Refresh notes
      await refreshNotes();
      
      // Show success message
      notificationService.sendSystemNotification(
        'Sync Complete',
        'Field notes have been synchronized successfully.'
      );
    } catch (error) {
      console.error('Error syncing notes:', error);
      Alert.alert('Error', 'Failed to sync notes. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Load data from cache
  const loadFromCache = async (key: string) => {
    try {
      const cached = await AsyncStorage.getItem(`terrafield_${key}`);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        return parsedCache.data;
      }
      return null;
    } catch (error) {
      console.error(`Error loading ${key} from cache:`, error);
      return null;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };
  
  // Render note item
  const renderNoteItem = ({ item }: { item: FieldNote }) => {
    const isOwnNote = user && item.userId === user.id;
    const userColor = activeUsers.find(u => u.userId === item.userId)?.color || Colors.primary;
    
    return (
      <View style={[
        styles.noteItem,
        isOwnNote ? styles.ownNoteItem : null,
      ]}>
        <View style={styles.noteHeader}>
          <View style={[styles.noteAuthorIcon, { backgroundColor: userColor + '20' }]}>
            <Text style={[styles.noteAuthorInitial, { color: userColor }]}>
              {item.createdBy.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.noteAuthorInfo}>
            <Text style={styles.noteAuthor}>
              {item.createdBy} {isOwnNote && '(You)'}
            </Text>
            <Text style={styles.noteDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <Text style={styles.noteText}>{item.text}</Text>
      </View>
    );
  };
  
  // Render active user
  const renderActiveUser = ({ item }: { item: UserPresence }) => {
    const isCurrentUser = user && item.userId === user.id;
    
    return (
      <View style={styles.activeUserContainer}>
        <View style={[styles.activeUserAvatar, { backgroundColor: item.color + '20' }]}>
          <Text style={[styles.activeUserInitial, { color: item.color }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: item.status === 'online' ? Colors.success : Colors.warning }
          ]} />
        </View>
        <Text style={styles.activeUserName} numberOfLines={1}>
          {isCurrentUser ? 'You' : item.name}
        </Text>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.title} numberOfLines={1}>
            Field Notes
          </Text>
          {property && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {property.address}
            </Text>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.syncButton}
          onPress={handleSyncNow}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="sync" size={24} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Connection status */}
      {!apiService.isConnected() && (
        <View style={styles.offlineNotice}>
          <Ionicons name="cloud-offline" size={16} color={Colors.white} />
          <Text style={styles.offlineText}>You are offline. Changes will sync when you reconnect.</Text>
        </View>
      )}
      
      {/* Active users */}
      {activeUsers.length > 0 && (
        <View style={styles.activeUsersContainer}>
          <FlatList
            data={activeUsers}
            renderItem={renderActiveUser}
            keyExtractor={item => item.userId.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeUsersList}
          />
        </View>
      )}
      
      {/* Main content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.notesList}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text" size={48} color={Colors.textLight} />
              <Text style={styles.emptyText}>No field notes yet</Text>
              <Text style={styles.emptySubtext}>Add the first note below</Text>
            </View>
          }
        />
      )}
      
      {/* Input area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 90}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Add a field note..."
            placeholderTextColor={Colors.textLight}
            multiline
            value={noteText}
            onChangeText={setNoteText}
          />
          <TouchableOpacity
            style={[styles.sendButton, !noteText.trim() && styles.sendButtonDisabled]}
            onPress={handleAddNote}
            disabled={!noteText.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={noteText.trim() ? Colors.white : Colors.disabledText}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  syncButton: {
    padding: 8,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 4,
  },
  offlineText: {
    color: Colors.white,
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  activeUsersContainer: {
    marginTop: 12,
    marginBottom: 4,
  },
  activeUsersList: {
    paddingHorizontal: 16,
  },
  activeUserContainer: {
    alignItems: 'center',
    marginRight: 16,
    width: 48,
  },
  activeUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeUserInitial: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  activeUserName: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textLight,
  },
  notesList: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  noteItem: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ownNoteItem: {
    backgroundColor: Colors.primary + '08',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteAuthorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  noteAuthorInitial: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  noteAuthorInfo: {
    flex: 1,
  },
  noteAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  noteDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  noteText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 48,
    fontSize: 14,
    maxHeight: 100,
    color: Colors.text,
  },
  sendButton: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.disabledButton,
  },
});

export default FieldNotesScreen;