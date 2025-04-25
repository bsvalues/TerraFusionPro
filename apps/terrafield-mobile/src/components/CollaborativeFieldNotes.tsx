import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Y from 'yjs';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '../hooks/useAuth';
import { ApiService } from '../services/ApiService';
import { DataSyncService } from '../services/DataSyncService';
import * as Colors from '../constants/Colors';

interface CollaborativeFieldNotesProps {
  parcelId: string;
  initialNotes?: string;
  onUpdate?: (notes: string) => void;
  readOnly?: boolean;
  minHeight?: number;
  placeholder?: string;
}

/**
 * CollaborativeFieldNotes component
 * A reusable component for collaborative field notes using CRDT technology
 */
const CollaborativeFieldNotes: React.FC<CollaborativeFieldNotesProps> = ({
  parcelId,
  initialNotes = '',
  onUpdate,
  readOnly = false,
  minHeight = 120,
  placeholder = 'Enter field notes here...',
}) => {
  // State
  const [notesText, setNotesText] = useState(initialNotes);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'error'>('synced');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [collaborators, setCollaborators] = useState<string[]>([]);

  // Refs and services
  const ydoc = useRef<Y.Doc>(new Y.Doc());
  const apiService = ApiService.getInstance();
  const dataSyncService = DataSyncService.getInstance();
  const { user } = useAuth();

  // Initialize and clean up
  useEffect(() => {
    const doc = ydoc.current;
    const ytext = doc.getText('notes');

    // Set initial text if provided
    if (initialNotes && ytext.toString() !== initialNotes) {
      ytext.delete(0, ytext.length);
      ytext.insert(0, initialNotes);
    }

    // Set up CRDT document with sync service
    dataSyncService.registerDocument(parcelId, doc, 'fieldNotes');

    // Observer for text changes
    const observer = () => {
      const updatedText = ytext.toString();
      setNotesText(updatedText);
      if (onUpdate) {
        onUpdate(updatedText);
      }
    };

    // Listen for text updates
    ytext.observe(observer);

    // Set up network connectivity listener
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      
      // If we're back online and have pending changes, trigger sync
      if (state.isConnected && syncStatus === 'pending') {
        syncNotes(true);
      }
    });

    // Load initial notes
    loadNotes();

    // Clean up
    return () => {
      ytext.unobserve(observer);
      unsubscribeNetInfo();
    };
  }, [parcelId]);

  // Update CRDT document when notes text changes
  useEffect(() => {
    if (!loading && !readOnly) {
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
  }, [notesText, loading, readOnly]);

  // Load notes from server
  const loadNotes = async () => {
    setLoading(true);
    try {
      // Get notes from server
      const response = await apiService.get(`/api/parcels/${parcelId}/notes`);
      
      if (response) {
        // Parse collaborators
        if (response.collaborators) {
          setCollaborators(response.collaborators);
        }
        
        // Update last synced time
        setLastSynced(new Date());
        
        // Update sync status
        setSyncStatus('synced');
        
        // Apply updates to the document if content exists
        if (response.content) {
          const ytext = ydoc.current.getText('notes');
          ydoc.current.transact(() => {
            ytext.delete(0, ytext.length);
            ytext.insert(0, response.content);
          });
          
          // Update the text input
          setNotesText(response.content);
          
          // Notify parent if callback provided
          if (onUpdate) {
            onUpdate(response.content);
          }
        }
      }
    } catch (error) {
      console.error('Error loading field notes:', error);
      
      // Update sync status
      setSyncStatus('error');
      
      // Alert user if connected but still got an error
      if (isConnected) {
        Alert.alert(
          'Error Loading Notes',
          'There was an issue loading the field notes from the server.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
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
      await apiService.put(`/api/parcels/${parcelId}/notes`, {
        content,
        userId: user?.id,
        username: user?.name,
      });
      
      // Update sync status and last synced time
      setSyncStatus('synced');
      setLastSynced(new Date());
      
      // Get latest collaborators
      try {
        const response = await apiService.get(`/api/parcels/${parcelId}/sync`);
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

  // Get sync status text and icon
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

  // Handle manual save
  const handleSave = () => {
    syncNotes();
  };

  // Handle refresh
  const handleRefresh = () => {
    loadNotes();
  };

  const syncDetails = getSyncStatusDetails();

  // Render component
  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.syncStatus}>
          <Feather name={syncDetails.icon} size={14} color={syncDetails.color} />
          <Text style={[styles.syncStatusText, { color: syncDetails.color }]}>
            {syncDetails.text}
          </Text>
        </View>

        {/* Collaborators */}
        <View style={styles.collaborators}>
          {collaborators.length > 0 ? (
            <>
              <Feather name="users" size={14} color={Colors.textLight} />
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

      {/* Content */}
      {loading ? (
        <View style={[styles.loadingContainer, { minHeight }]}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      ) : (
        <View style={styles.notesContainer}>
          <TextInput
            style={[styles.notesInput, { minHeight }]}
            value={notesText}
            onChangeText={setNotesText}
            multiline
            editable={!readOnly}
            placeholder={placeholder}
            placeholderTextColor={Colors.placeholderText}
          />
        </View>
      )}

      {/* Actions */}
      {!readOnly && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRefresh}
            disabled={loading || saving}
          >
            <Feather name="refresh-cw" size={18} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              (saving || syncStatus === 'synced' || !isConnected) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving || syncStatus === 'synced' || !isConnected}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Feather
                  name="save"
                  size={16}
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
                    : 'Save'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.background,
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
    marginLeft: 4,
  },
  notesContainer: {
    padding: 2,
  },
  notesInput: {
    padding: 10,
    fontSize: 14,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textLight,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    padding: 6,
    borderRadius: 4,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.disabledButton,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  saveButtonTextDisabled: {
    color: Colors.disabledText,
  },
});

export default CollaborativeFieldNotes;