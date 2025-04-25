import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import CollaborativeFieldNotes from '../components/CollaborativeFieldNotes';
import { DataSyncService } from '../services/DataSyncService';
import * as Colors from '../constants/Colors';

// Route params interface
interface FieldNotesRouteParams {
  parcelId: string;
  propertyAddress?: string;
}

// FieldNotesScreen component
const FieldNotesScreen: React.FC = () => {
  // Hooks for navigation and route
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as FieldNotesRouteParams;

  // Get parcel ID from route params
  const parcelId = params?.parcelId;
  const propertyAddress = params?.propertyAddress || 'Property';
  
  // State
  const [isSyncing, setIsSyncing] = useState(false);
  const [noteCount, setNoteCount] = useState(0);
  
  // Services
  const dataSyncService = DataSyncService.getInstance();
  
  // Set navigation options
  useEffect(() => {
    navigation.setOptions({
      headerTitle: `${propertyAddress} - Field Notes`,
      headerRight: () => (
        <TouchableOpacity 
          style={styles.syncButton}
          onPress={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Feather name="refresh-cw" size={18} color={Colors.white} />
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, propertyAddress, isSyncing]);
  
  // Handle sync button press
  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const success = await dataSyncService.syncPendingData();
      
      if (success) {
        Alert.alert(
          'Sync Complete',
          'Field notes have been synchronized with the server.'
        );
      } else {
        Alert.alert(
          'Sync Incomplete',
          'Some field notes could not be synchronized. Please try again later.'
        );
      }
    } catch (error) {
      console.error('Error syncing field notes:', error);
      Alert.alert(
        'Sync Error',
        'An error occurred while synchronizing field notes. Please try again later.'
      );
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Handle notes count change
  const handleNotesChanged = (notes) => {
    setNoteCount(notes.length);
  };

  // If no parcel ID is provided, show error
  if (!parcelId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={Colors.errorText} />
          <Text style={styles.errorTitle}>Missing Parcel ID</Text>
          <Text style={styles.errorMessage}>
            A parcel ID is required to view and edit field notes.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.noteCount}>
          {noteCount} {noteCount === 1 ? 'Note' : 'Notes'}
        </Text>
        
        <TouchableOpacity 
          style={[styles.statusButton, isSyncing ? styles.syncingStatusButton : styles.syncedStatusButton]}
          disabled={true}
        >
          <Feather 
            name={isSyncing ? 'loader' : 'check-circle'} 
            size={14} 
            color={isSyncing ? Colors.warningText : Colors.successText} 
          />
          <Text style={[
            styles.statusText,
            isSyncing ? styles.syncingStatusText : styles.syncedStatusText
          ]}>
            {isSyncing ? 'Syncing...' : 'Synced'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <CollaborativeFieldNotes 
        parcelId={parcelId}
        onNotesChanged={handleNotesChanged}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  noteCount: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textLight,
  },
  syncButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncedStatusButton: {
    backgroundColor: Colors.successBackground,
  },
  syncingStatusButton: {
    backgroundColor: Colors.warningBackground,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  syncedStatusText: {
    color: Colors.successText,
  },
  syncingStatusText: {
    color: Colors.warningText,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.errorText,
    marginTop: 12,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  backButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
});

export default FieldNotesScreen;