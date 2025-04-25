import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { DataSyncService } from '../services/DataSyncService';
import { ApiService } from '../services/ApiService';
import * as Colors from '../constants/Colors';

// Field note interface (matching the one in DataSyncService)
interface FieldNote {
  id: string;
  parcelId: string;
  text: string;
  createdAt: string;
  createdBy: string;
  userId: number;
}

// Route params interface
interface RouteParams {
  propertyId?: string;
  parcelId?: string;
}

const FieldNotesScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as RouteParams;
  const { user } = useAuth();
  
  const [notes, setNotes] = useState<FieldNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState<any>(null);
  const [offline, setOffline] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const dataSyncService = DataSyncService.getInstance();
  const apiService = ApiService.getInstance();
  
  // Generate a document ID for the field notes
  const docId = `field_notes_${params.parcelId || 'unknown'}`;
  const parcelId = params.parcelId || 'unknown';
  
  // Load property details
  useEffect(() => {
    const loadPropertyDetails = async () => {
      if (params.propertyId) {
        try {
          const details = await apiService.get(`/api/properties/${params.propertyId}`);
          setPropertyDetails(details);
        } catch (error) {
          console.error('Error loading property details:', error);
          // Set some minimal details based on the parcel ID if we're offline
          setPropertyDetails({ 
            address: `Parcel ${params.parcelId}`,
            city: 'Unknown',
            state: 'Unknown'
          });
        }
      }
      
      // Check network status
      setOffline(!apiService.isConnected());
    };
    
    loadPropertyDetails();
  }, [params.propertyId, params.parcelId]);
  
  // Load field notes
  useEffect(() => {
    const loadFieldNotes = async () => {
      try {
        setIsLoading(true);
        const fieldNotes = await dataSyncService.getFieldNotes(docId, parcelId);
        
        // Sort notes by creation date (newest first)
        const sortedNotes = [...fieldNotes].sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setNotes(sortedNotes);
      } catch (error) {
        console.error('Error loading field notes:', error);
        Alert.alert(
          'Error',
          'Failed to load field notes. Please try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFieldNotes();
    
    // Setup an interval to check for changes
    const interval = setInterval(loadFieldNotes, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [docId, parcelId]);
  
  // Handle sync button press
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const success = await dataSyncService.syncDoc(docId, parcelId);
      
      if (success) {
        Alert.alert('Success', 'Field notes synchronized successfully');
      } else if (!apiService.isConnected()) {
        Alert.alert('Offline', 'You are currently offline. Notes will sync automatically when you reconnect.');
      } else {
        Alert.alert('Sync Failed', 'Failed to synchronize field notes. Please try again later.');
      }
    } catch (error) {
      console.error('Error syncing field notes:', error);
      Alert.alert(
        'Sync Error',
        'An error occurred while syncing field notes. Please try again later.'
      );
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Handle adding a new note
  const handleAddNote = async () => {
    if (!newNote.trim()) {
      return;
    }
    
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add notes');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Add the note
      await dataSyncService.addFieldNote(
        docId,
        parcelId,
        newNote,
        user.id,
        user.name
      );
      
      // Clear the input
      setNewNote('');
      
      // Refresh the notes
      const fieldNotes = await dataSyncService.getFieldNotes(docId, parcelId);
      
      // Sort notes by creation date (newest first)
      const sortedNotes = [...fieldNotes].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setNotes(sortedNotes);
      
      // Scroll to the top
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    } catch (error) {
      console.error('Error adding field note:', error);
      Alert.alert(
        'Error',
        'Failed to add field note. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };
  
  // Render a field note item
  const renderNoteItem = ({ item }: { item: FieldNote }) => {
    const isCurrentUser = user && item.userId === user.id;
    
    return (
      <View style={[
        styles.noteItem,
        isCurrentUser ? styles.currentUserNote : styles.otherUserNote
      ]}>
        <View style={styles.noteHeader}>
          <Text style={styles.noteName}>{item.createdBy}</Text>
          <Text style={styles.noteDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={styles.noteText}>{item.text}</Text>
      </View>
    );
  };
  
  // Go back to previous screen
  const goBack = () => {
    navigation.goBack();
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Field Notes</Text>
          {propertyDetails && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {propertyDetails.address}, {propertyDetails.city}, {propertyDetails.state}
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          onPress={handleSync} 
          style={styles.syncButton}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <View style={styles.syncButtonContent}>
              <Ionicons 
                name="sync" 
                size={18} 
                color={offline ? Colors.warning : Colors.primary} 
              />
              {offline && (
                <View style={styles.offlineIndicator}>
                  <Text style={styles.offlineIndicatorText}>!</Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Connection status */}
      {offline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color={Colors.white} />
          <Text style={styles.offlineBannerText}>
            You are offline. Notes will sync when connection is restored.
          </Text>
        </View>
      )}
      
      {/* Field notes list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading field notes...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.notesList}
          ListEmptyComponent={() => (
            <View style={styles.emptyList}>
              <Ionicons name="document-text-outline" size={48} color={Colors.textLight} />
              <Text style={styles.emptyListText}>No field notes yet.</Text>
              <Text style={styles.emptyListSubtext}>Add the first note below!</Text>
            </View>
          )}
        />
      )}
      
      {/* Input area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 40}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          placeholder="Type your note here..."
          placeholderTextColor={Colors.textLight}
          value={newNote}
          onChangeText={setNewNote}
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newNote.trim() || isSubmitting) && styles.disabledButton
          ]}
          onPress={handleAddNote}
          disabled={!newNote.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="send" size={20} color={Colors.white} />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  syncButton: {
    padding: 8,
  },
  syncButtonContent: {
    position: 'relative',
  },
  offlineIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineIndicatorText: {
    color: Colors.white,
    fontSize: 8,
    fontWeight: 'bold',
  },
  offlineBanner: {
    backgroundColor: Colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 16,
  },
  offlineBannerText: {
    color: Colors.white,
    fontSize: 12,
    marginLeft: 8,
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
    paddingBottom: 80, // Extra space for input
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyListText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 12,
  },
  emptyListSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  noteItem: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    maxWidth: '85%',
  },
  currentUserNote: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary + '15', // 15% opacity
    borderBottomRightRadius: 2,
  },
  otherUserNote: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.backgroundDark,
    borderBottomLeftRadius: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noteName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  noteDate: {
    fontSize: 11,
    color: Colors.textLight,
    marginLeft: 8,
  },
  noteText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 100,
    color: Colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: Colors.disabledButton,
  },
});

export default FieldNotesScreen;