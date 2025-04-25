import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Y from 'yjs';
import { useAuth } from '../hooks/useAuth';
import { ApiService } from '../services/ApiService';
import * as Colors from '../constants/Colors';
import NetInfo from '@react-native-community/netinfo';

// Route params interface
interface FieldNotesRouteParams {
  parcelId: string;
  propertyAddress?: string;
}

const FieldNotesScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as FieldNotesRouteParams;
  const { user } = useAuth();
  const apiService = ApiService.getInstance();

  // References and state
  const ydoc = useRef<Y.Doc>(new Y.Doc());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [notesText, setNotesText] = useState('');
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'error'>('synced');

  // Initialize the CRDT document
  useEffect(() => {
    const doc = ydoc.current;
    const ytext = doc.getText('notes');

    // Observer for text changes
    const observer = () => {
      const updatedText = ytext.toString();
      setNotes(updatedText);
    };

    // Listen for text updates
    ytext.observe(observer);

    // Load notes from server
    loadNotes();

    // Set up network connectivity listener
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      
      // If we're back online and have pending changes, trigger sync
      if (state.isConnected && syncStatus === 'pending') {
        syncNotes(true);
      }
    });

    // Set header title
    navigation.setOptions({
      title: params.propertyAddress ? `Notes: ${params.propertyAddress}` : 'Field Notes',
    });

    // Cleanup
    return () => {
      ytext.unobserve(observer);
      unsubscribe();
      doc.destroy();
    };
  }, []);

  // Update CRDT document when notes text changes
  useEffect(() => {
    if (!loading) {
      const ytext = ydoc.current.getText('notes');
      if (notesText !== ytext.toString()) {
        setSyncStatus('pending');
        
        // Apply changes to Yjs document
        ydoc.current.transact(() => {
          ytext.delete(0, ytext.length);
          ytext.insert(0, notesText);
        });
      }
    }
  }, [notesText]);

  // Load notes from server
  const loadNotes = async () => {
    setLoading(true);
    try {
      // Get notes from server
      const response = await apiService.get(`/api/parcels/${params.parcelId}/notes`);
      
      if (response) {
        // Parse collaborators
        if (response.collaborators) {
          setCollaborators(response.collaborators);
        }
        
        // Update last synced time
        setLastSynced(new Date());
        
        // Update sync status
        setSyncStatus('synced');
        
        // Apply updates to the document
        if (response.content) {
          const ytext = ydoc.current.getText('notes');
          ydoc.current.transact(() => {
            ytext.delete(0, ytext.length);
            ytext.insert(0, response.content);
          });
          
          // Update the text input
          setNotesText(response.content);
        }
      }
    } catch (error) {
      console.error('Error loading field notes:', error);
      
      // Attempt to load from local storage
      loadOfflineNotes();
      
      // Update sync status
      setSyncStatus('error');
      
      // Alert user
      if (isConnected) {
        Alert.alert(
          'Error Loading Notes',
          'There was an issue loading the field notes from the server. Falling back to local version.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Load notes from local storage
  const loadOfflineNotes = async () => {
    // In a real app, this would load from AsyncStorage or other local storage
    // For simplicity, we're not implementing the full offline storage here
    console.log('Loading notes from offline storage');
  };

  // Sync notes to server
  const syncNotes = async (silent = false) => {
    if (!isConnected) {
      setSyncStatus('pending');
      return;
    }
    
    if (!silent) {
      setSaving(true);
    }

    try {
      const ytext = ydoc.current.getText('notes');
      const content = ytext.toString();
      
      // Send updates to server
      await apiService.put(`/api/parcels/${params.parcelId}/notes`, {
        content,
        userId: user?.id,
        username: user?.name,
      });
      
      // Update sync status and last synced time
      setSyncStatus('synced');
      setLastSynced(new Date());
      
      // Get latest collaborators
      try {
        const response = await apiService.get(`/api/parcels/${params.parcelId}/sync`);
        if (response && response.collaborators) {
          setCollaborators(response.collaborators);
        }
      } catch (error) {
        console.error('Error syncing collaborators:', error);
      }
    } catch (error) {
      console.error('Error syncing notes:', error);
      setSyncStatus('error');
      
      if (!silent) {
        Alert.alert(
          'Sync Error',
          'Failed to sync changes to the server. Changes will be saved locally and synced when connection is restored.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      if (!silent) {
        setSaving(false);
      }
    }
  };

  // Format last synced time
  const formatSyncTime = () => {
    if (!lastSynced) return 'Never';
    
    // If less than a minute ago, show "Just now"
    const diffMs = Date.now() - lastSynced.getTime();
    if (diffMs < 60000) return 'Just now';
    
    // If less than an hour ago, show minutes
    if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }
    
    // Otherwise show time
    return lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get sync status text and color
  const getSyncStatusDetails = () => {
    if (!isConnected) {
      return {
        text: 'Offline',
        color: Colors.offline,
        icon: 'wifi-off',
      };
    }
    
    switch (syncStatus) {
      case 'synced':
        return {
          text: `Synced ${formatSyncTime()}`,
          color: Colors.online,
          icon: 'check-circle',
        };
      case 'pending':
        return {
          text: 'Changes pending',
          color: Colors.syncing,
          icon: 'clock',
        };
      case 'error':
        return {
          text: 'Sync error',
          color: Colors.error,
          icon: 'alert-circle',
        };
      default:
        return {
          text: 'Unknown',
          color: Colors.textLight,
          icon: 'help-circle',
        };
    }
  };

  // Save notes manually
  const handleSaveNotes = () => {
    syncNotes();
  };

  // Refresh notes from server
  const handleRefreshNotes = () => {
    if (syncStatus === 'pending') {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Save them before refreshing?',
        [
          {
            text: 'Save & Refresh',
            onPress: async () => {
              await syncNotes();
              loadNotes();
            },
          },
          {
            text: 'Discard & Refresh',
            style: 'destructive',
            onPress: () => loadNotes(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      loadNotes();
    }
  };

  const syncDetails = getSyncStatusDetails();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.syncStatus}>
          <Feather name={syncDetails.icon} size={16} color={syncDetails.color} />
          <Text style={[styles.syncStatusText, { color: syncDetails.color }]}>
            {syncDetails.text}
          </Text>
        </View>

        <View style={styles.collaborators}>
          {collaborators.length > 0 ? (
            <>
              <Feather name="users" size={16} color={Colors.textLight} />
              <Text style={styles.collaboratorsText}>
                {collaborators.length === 1
                  ? '1 collaborator'
                  : `${collaborators.length} collaborators`}
              </Text>
            </>
          ) : (
            <Text style={styles.collaboratorsText}>No collaborators</Text>
          )}
        </View>
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={handleRefreshNotes}
          disabled={loading || saving}
        >
          <Feather name="refresh-cw" size={20} color={Colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => {
            // This would be implemented with a proper image picker
            Alert.alert('Feature Coming Soon', 'Photo attachment is coming soon!');
          }}
        >
          <Feather name="image" size={20} color={Colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => {
            // This would be implemented with location services
            Alert.alert('Feature Coming Soon', 'Location attachment is coming soon!');
          }}
        >
          <Feather name="map-pin" size={20} color={Colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => {
            // This would open a more detailed collaborators view
            Alert.alert(
              'Collaborators',
              collaborators.length > 0
                ? collaborators.join('\n')
                : 'No one else is editing this document.'
            );
          }}
        >
          <Feather name="users" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Notes Editor */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading field notes...</Text>
        </View>
      ) : (
        <ScrollView style={styles.notesContainer}>
          <TextInput
            style={styles.notesInput}
            multiline
            value={notesText}
            onChangeText={setNotesText}
            placeholder="Enter property field notes here..."
            placeholderTextColor={Colors.placeholderText}
            autoCapitalize="sentences"
            textAlignVertical="top"
          />
        </ScrollView>
      )}

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (saving || syncStatus === 'synced' || !isConnected) && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveNotes}
          disabled={saving || syncStatus === 'synced' || !isConnected}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Feather
                name="save"
                size={18}
                color={
                  saving || syncStatus === 'synced' || !isConnected
                    ? Colors.disabledText
                    : Colors.white
                }
              />
              <Text
                style={[
                  styles.saveButtonText,
                  (saving || syncStatus === 'synced' || !isConnected) && styles.saveButtonTextDisabled,
                ]}
              >
                {syncStatus === 'synced'
                  ? 'Saved'
                  : !isConnected
                  ? 'Offline'
                  : 'Save Changes'}
              </Text>
            </>
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
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncStatusText: {
    fontSize: 12,
    marginLeft: 6,
  },
  collaborators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collaboratorsText: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 6,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toolbarButton: {
    padding: 8,
    borderRadius: 4,
  },
  notesContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  notesInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    minHeight: 300,
    textAlignVertical: 'top',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },
  saveButtonContainer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.disabledButton,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButtonTextDisabled: {
    color: Colors.disabledText,
  },
});

export default FieldNotesScreen;