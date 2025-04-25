import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  RefreshControl
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import CollaborativeFieldNotes from '../components/CollaborativeFieldNotes';
import { DataSyncService } from '../services/DataSyncService';
import { PropertyService } from '../services/PropertyService';
import { NotificationService, NotificationType } from '../services/NotificationService';
import * as Colors from '../constants/Colors';

// Define route params type
interface FieldNotesRouteParams {
  parcelId: string;
  propertyId?: number;
  address?: string;
}

const FieldNotesScreen: React.FC = () => {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState<{
    address: string;
    city: string;
    state: string;
    zipCode: string;
    propertyType: string;
  } | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  
  // Services
  const dataSyncService = DataSyncService.getInstance();
  const propertyService = PropertyService.getInstance();
  const notificationService = NotificationService.getInstance();
  
  // Hooks
  const route = useRoute();
  const navigation = useNavigation();
  
  // Get params from route
  const { parcelId, propertyId, address } = route.params as FieldNotesRouteParams;

  // Load property details
  useEffect(() => {
    const loadPropertyDetails = async () => {
      try {
        setIsLoading(true);
        
        if (propertyId) {
          // If we have a property ID, fetch details from the API
          const property = await propertyService.getProperty(propertyId);
          
          if (property) {
            setPropertyDetails({
              address: property.address,
              city: property.city,
              state: property.state,
              zipCode: property.zipCode,
              propertyType: property.propertyType
            });
          }
        } else if (address) {
          // If we only have an address, use that
          setPropertyDetails({
            address,
            city: '',
            state: '',
            zipCode: '',
            propertyType: 'Unknown'
          });
        }
        
        // Get last sync time
        const syncInfo = await dataSyncService.getLastSyncTime(parcelId);
        if (syncInfo) {
          setLastSynced(new Date(syncInfo.lastSynced));
        }
        
      } catch (error) {
        console.error('Error loading property details:', error);
        Alert.alert(
          'Error',
          'Failed to load property details. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPropertyDetails();
  }, [parcelId, propertyId, address]);
  
  // Handle refresh
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Sync field notes for this parcel
      await dataSyncService.syncParcelData(parcelId);
      
      // Get updated sync time
      const syncInfo = await dataSyncService.getLastSyncTime(parcelId);
      if (syncInfo) {
        setLastSynced(new Date(syncInfo.lastSynced));
      }
      
      // Send notification
      notificationService.sendNotification(
        1, // User ID (should come from auth)
        NotificationType.SYNC_COMPLETED,
        'Sync Completed',
        `Field notes for ${propertyDetails?.address || 'this property'} have been synchronized.`
      );
    } catch (error) {
      console.error('Error refreshing field notes:', error);
      Alert.alert(
        'Sync Error',
        'Failed to sync field notes. Please check your connection and try again.'
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [parcelId, propertyDetails]);
  
  // Handle notes changed
  const handleNotesChanged = (notes) => {
    // Update the app state or perform any necessary actions when notes change
    console.log(`Notes updated for parcel ${parcelId}, count: ${notes.length}`);
  };
  
  // Handle back navigation
  const handleBack = () => {
    navigation.goBack();
  };
  
  // Format last synced time
  const formatLastSynced = () => {
    if (!lastSynced) return 'Never synced';
    
    return lastSynced.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading field notes...</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Field Notes</Text>
          {propertyDetails && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {propertyDetails.address}
            </Text>
          )}
        </View>
        <View style={styles.syncInfoContainer}>
          <Text style={styles.syncText}>
            Last synced: {formatLastSynced()}
          </Text>
        </View>
      </View>
      
      {/* Property Details Card */}
      {propertyDetails && (
        <View style={styles.propertyCard}>
          <View style={styles.propertyIconContainer}>
            <Feather 
              name={
                propertyDetails.propertyType === 'Residential' ? 'home' : 
                propertyDetails.propertyType === 'Commercial' ? 'briefcase' : 
                propertyDetails.propertyType === 'Land' ? 'map' : 'box'
              } 
              size={28} 
              color={Colors.primary} 
            />
          </View>
          <View style={styles.propertyDetails}>
            <Text style={styles.propertyAddress}>{propertyDetails.address}</Text>
            <Text style={styles.propertyLocation}>
              {[
                propertyDetails.city, 
                propertyDetails.state, 
                propertyDetails.zipCode
              ].filter(Boolean).join(', ')}
            </Text>
            <Text style={styles.propertyType}>{propertyDetails.propertyType || 'Property'}</Text>
          </View>
        </View>
      )}
      
      {/* Notes Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.notesContainer}>
          <CollaborativeFieldNotes 
            parcelId={parcelId}
            onNotesChanged={handleNotesChanged}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  syncInfoContainer: {
    alignItems: 'flex-end',
  },
  syncText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  propertyCard: {
    margin: 16,
    marginTop: 16,
    marginBottom: 0,
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  propertyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.lightPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  propertyDetails: {
    flex: 1,
  },
  propertyAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  propertyLocation: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  propertyType: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
    backgroundColor: Colors.lightPrimary,
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  notesContainer: {
    flex: 1,
    paddingTop: 16,
  },
});

export default FieldNotesScreen;