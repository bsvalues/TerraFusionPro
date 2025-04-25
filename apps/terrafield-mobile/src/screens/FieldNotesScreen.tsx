import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Share
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import CollaborativeFieldNotes from '../components/CollaborativeFieldNotes';
import { DataSyncService } from '../services/DataSyncService';
import { PropertyData } from '../types/PropertyData';
import * as Colors from '../constants/Colors';
import NetInfo from '@react-native-community/netinfo';

// Define the route params type
type FieldNotesRouteParams = {
  parcelId: string;
  propertyData?: PropertyData;
};

const FieldNotesScreen: React.FC = () => {
  // State
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [totalNotes, setTotalNotes] = useState(0);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  
  // Navigation and route
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, FieldNotesRouteParams>, string>>();
  const { parcelId, propertyData } = route.params || {};
  
  // Data services
  const dataSyncService = DataSyncService.getInstance();
  
  // Check network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        if (propertyData) {
          setProperty(propertyData);
        } else if (parcelId) {
          // Get property details from local storage or API
          const propertyFromStorage = await dataSyncService.getPropertyById(parcelId);
          setProperty(propertyFromStorage);
        }
        
        // Get last sync time
        const syncTimes = await dataSyncService.getLastSyncTimes();
        if (syncTimes && syncTimes.notes) {
          setLastSynced(new Date(syncTimes.notes));
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing field notes screen:', error);
        Alert.alert('Error', 'Failed to load property data.');
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, [parcelId, propertyData]);
  
  // Handle note count changes
  const handleNotesChanged = (notes: any[]) => {
    setTotalNotes(notes.length);
  };
  
  // Force sync with server
  const handleForceSync = async () => {
    try {
      if (!isOnline) {
        Alert.alert('Offline', 'You are currently offline. Please connect to the internet to sync.');
        return;
      }
      
      await dataSyncService.syncDataWithServer();
      setLastSynced(new Date());
      Alert.alert('Sync Complete', 'Field notes have been synchronized with the server.');
    } catch (error) {
      console.error('Error syncing notes:', error);
      Alert.alert('Sync Failed', 'Failed to synchronize notes with the server. Please try again later.');
    }
  };
  
  // Share field notes
  const shareFieldNotes = async () => {
    try {
      if (!property) return;
      
      const message = `Field Notes for ${property.address}, ${property.city}, ${property.state}\n\n` +
        `Total Notes: ${totalNotes}\n` +
        `Last Updated: ${lastSynced ? lastSynced.toLocaleString() : 'Never'}\n\n` +
        `View these notes in the TerraField Mobile App.`;
      
      await Share.share({
        message,
        title: `Field Notes - ${property.address}`,
      });
    } catch (error) {
      console.error('Error sharing field notes:', error);
      Alert.alert('Share Failed', 'Unable to share field notes at this time.');
    }
  };
  
  // Render connection status
  const renderConnectionStatus = () => (
    <View style={[
      styles.connectionStatus,
      isOnline ? styles.onlineStatus : styles.offlineStatus
    ]}>
      <View style={[
        styles.connectionIndicator,
        isOnline ? styles.onlineIndicator : styles.offlineIndicator
      ]} />
      <Text style={styles.connectionText}>
        {isOnline ? 'Online - Real-time Collaboration' : 'Offline - Changes will sync later'}
      </Text>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Field Notes</Text>
            {property && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {property.address}, {property.city}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={shareFieldNotes}>
            <Feather name="share-2" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Connection status */}
        {renderConnectionStatus()}
        
        {/* Property info */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading property data...</Text>
          </View>
        ) : property ? (
          <View style={styles.propertyInfo}>
            <View style={styles.propertyDetails}>
              <View style={styles.propertyTypeContainer}>
                <Text style={styles.propertyType}>{property.propertyType}</Text>
              </View>
              <Text style={styles.propertyAddress}>
                {property.address}
              </Text>
              <Text style={styles.propertyLocation}>
                {property.city}, {property.state} {property.zipCode}
              </Text>
            </View>
            
            <View style={styles.notesStats}>
              <View style={styles.statsItem}>
                <Text style={styles.statsValue}>{totalNotes}</Text>
                <Text style={styles.statsLabel}>Notes</Text>
              </View>
              <View style={styles.statsItem}>
                <Text style={styles.statsValue}>
                  {lastSynced ? 
                    `${lastSynced.getHours()}:${String(lastSynced.getMinutes()).padStart(2, '0')}` : 
                    '--:--'}
                </Text>
                <Text style={styles.statsLabel}>Last Synced</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.syncButton,
                  !isOnline && styles.syncButtonDisabled
                ]}
                onPress={handleForceSync}
                disabled={!isOnline}
              >
                <Feather 
                  name="refresh-cw" 
                  size={14} 
                  color={isOnline ? Colors.primary : Colors.gray} 
                />
                <Text 
                  style={[
                    styles.syncButtonText,
                    !isOnline && styles.syncButtonTextDisabled
                  ]}
                >
                  Sync Now
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={40} color={Colors.error} />
            <Text style={styles.errorText}>
              Property information not available
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.retryButtonText}>Return to Property List</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Collaborative notes */}
        {property && (
          <View style={styles.collaborativeNotesContainer}>
            <CollaborativeFieldNotes
              parcelId={parcelId || property.id}
              onNotesChanged={handleNotesChanged}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 2,
  },
  shareButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray,
  },
  propertyInfo: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  propertyDetails: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  propertyTypeContainer: {
    backgroundColor: Colors.lightPrimary,
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  propertyType: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  propertyAddress: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: Colors.gray,
  },
  notesStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsItem: {
    marginRight: 24,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  statsLabel: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightPrimary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 'auto',
  },
  syncButtonDisabled: {
    backgroundColor: Colors.lightGray,
  },
  syncButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  syncButtonTextDisabled: {
    color: Colors.gray,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  errorText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  collaborativeNotesContainer: {
    flex: 1,
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
});

export default FieldNotesScreen;