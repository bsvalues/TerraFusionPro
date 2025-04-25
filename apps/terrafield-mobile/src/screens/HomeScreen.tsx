import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  useWindowDimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ApiService } from '../services/ApiService';
import { useAuth } from '../hooks/useAuth';
import * as Colors from '../constants/Colors';

// Property type definition
interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt: number;
  lotSize: number;
  parcelId: string;
  image?: string;
  lastUpdated: string;
}

// Feature item definition
interface FeatureItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  screen: string;
  params?: any;
  badge?: string;
  color: string;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const user = useAuth();
  const apiService = ApiService.getInstance();

  // State
  const [properties, setProperties] = useState<Property[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Featured functionality items
  const features: FeatureItem[] = [
    {
      id: 'field_notes',
      title: 'Field Notes',
      icon: 'file-text',
      description: 'Collaborative property notes',
      screen: 'FieldNotes',
      badge: 'New',
      color: Colors.primary,
    },
    {
      id: 'photo_enhancement',
      title: 'Photo Enhancement',
      icon: 'image',
      description: 'AI-powered photo improvements',
      screen: 'PhotoEnhancement',
      color: Colors.info,
    },
    {
      id: 'ar_measurement',
      title: 'AR Measurement',
      icon: 'maximize',
      description: 'Measure with augmented reality',
      screen: 'ARMeasurement',
      color: Colors.success,
    },
    {
      id: 'property_comparison',
      title: 'Property Comparison',
      icon: 'bar-chart-2',
      description: 'Compare multiple properties',
      screen: 'PropertyComparison',
      color: Colors.warning,
    },
    {
      id: 'property_share',
      title: 'Property Share',
      icon: 'share-2',
      description: 'Share property details securely',
      screen: 'PropertyShare',
      color: Colors.accent,
    },
  ];

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Load property and report data
  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch properties
      const propertyResponse = await apiService.get(`/api/properties?userId=${user.id}`);
      
      if (propertyResponse) {
        setProperties(propertyResponse);
      }

      // Fetch recent reports
      const reportResponse = await apiService.get(`/api/reports?userId=${user.id}`);
      
      if (reportResponse) {
        setRecentReports(reportResponse.slice(0, 5)); // Take only the 5 most recent
      }
    } catch (error) {
      console.error('Error loading data:', error);
      
      // For demo purposes, set some sample data if API fails
      setProperties([
        {
          id: 1,
          address: '123 Main Street',
          city: 'Springfield',
          state: 'IL',
          zipCode: '12345',
          propertyType: 'Single Family',
          bedrooms: 4,
          bathrooms: 2.5,
          squareFeet: 2400,
          yearBuilt: 1995,
          lotSize: 0.25,
          parcelId: 'ABC123456',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 2,
          address: '456 Park Avenue',
          city: 'Riverdale',
          state: 'NY',
          zipCode: '54321',
          propertyType: 'Condo',
          bedrooms: 2,
          bathrooms: 2,
          squareFeet: 1200,
          yearBuilt: 2010,
          lotSize: 0,
          parcelId: 'XYZ789012',
          lastUpdated: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Navigate to property details
  const navigateToPropertyDetails = (property: Property) => {
    navigation.navigate('PropertyDetails', {
      propertyId: property.id,
      propertyAddress: property.address,
    });
  };

  // Navigate to field notes for a property
  const navigateToFieldNotes = (property: Property) => {
    navigation.navigate('FieldNotes', {
      parcelId: property.parcelId,
      propertyAddress: property.address,
    });
  };

  // Navigate to feature
  const navigateToFeature = (feature: FeatureItem, property?: Property) => {
    // If we have a property, use it for the navigation params
    if (property) {
      let params = { ...feature.params };
      
      switch (feature.screen) {
        case 'FieldNotes':
          params = {
            ...params,
            parcelId: property.parcelId,
            propertyAddress: property.address,
          };
          break;
        case 'PropertyDetails':
        case 'PhotoEnhancement':
        case 'ARMeasurement':
        case 'ReportGeneration':
        case 'PropertyShare':
          params = {
            ...params,
            propertyId: property.id,
            propertyAddress: property.address,
          };
          break;
        case 'PropertyComparison':
          params = {
            ...params,
            propertyIds: [property.id],
          };
          break;
      }
      
      navigation.navigate(feature.screen as never, params as never);
    } else {
      // Just navigate to the feature
      navigation.navigate(feature.screen as never, feature.params as never);
    }
  };

  // Render property item
  const renderPropertyItem = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => navigateToPropertyDetails(item)}
    >
      <View style={styles.propertyImageContainer}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.propertyImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.propertyImagePlaceholder}>
            <Feather name="home" size={40} color={Colors.textLight} />
          </View>
        )}
        <View style={styles.propertyTypeTag}>
          <Text style={styles.propertyTypeText}>{item.propertyType}</Text>
        </View>
      </View>

      <View style={styles.propertyContent}>
        <Text style={styles.propertyAddress} numberOfLines={1}>
          {item.address}
        </Text>
        <Text style={styles.propertyLocation}>
          {item.city}, {item.state} {item.zipCode}
        </Text>

        <View style={styles.propertyDetails}>
          <View style={styles.propertyDetailItem}>
            <Feather name="home" size={14} color={Colors.textLight} />
            <Text style={styles.propertyDetailText}>{item.squareFeet} sq ft</Text>
          </View>
          <View style={styles.propertyDetailItem}>
            <Feather name="bed" size={14} color={Colors.textLight} />
            <Text style={styles.propertyDetailText}>{item.bedrooms} beds</Text>
          </View>
          <View style={styles.propertyDetailItem}>
            <Feather name="droplet" size={14} color={Colors.textLight} />
            <Text style={styles.propertyDetailText}>{item.bathrooms} baths</Text>
          </View>
        </View>

        <View style={styles.propertyActions}>
          <TouchableOpacity
            style={styles.propertyActionButton}
            onPress={() => navigateToFieldNotes(item)}
          >
            <Feather name="file-text" size={16} color={Colors.primary} />
            <Text style={styles.propertyActionText}>Notes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.propertyActionButton}
            onPress={() => navigateToFeature(
              features.find(f => f.id === 'photo_enhancement')!,
              item
            )}
          >
            <Feather name="image" size={16} color={Colors.info} />
            <Text style={styles.propertyActionText}>Photos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.propertyActionButton}
            onPress={() => navigateToFeature(
              features.find(f => f.id === 'property_share')!,
              item
            )}
          >
            <Feather name="share-2" size={16} color={Colors.accent} />
            <Text style={styles.propertyActionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render feature item
  const renderFeatureItem = ({ item }: { item: FeatureItem }) => (
    <TouchableOpacity
      style={[styles.featureCard, { backgroundColor: item.color + '10' }]} // 10% opacity
      onPress={() => navigateToFeature(item)}
    >
      <View style={[styles.featureIconContainer, { backgroundColor: item.color }]}>
        <Feather name={item.icon} size={20} color={Colors.white} />
      </View>
      <Text style={styles.featureTitle}>{item.title}</Text>
      <Text style={styles.featureDescription} numberOfLines={2}>
        {item.description}
      </Text>
      {item.badge && (
        <View style={styles.featureBadge}>
          <Text style={styles.featureBadgeText}>{item.badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <Feather name="user" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your properties...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Features section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TerraField Features</Text>
            <FlatList
              data={features}
              renderItem={renderFeatureItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featureList}
              snapToInterval={width * 0.7 + 10}
              decelerationRate="fast"
              snapToAlignment="start"
            />
          </View>

          {/* Properties section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Properties</Text>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
                <Feather name="chevron-right" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {properties.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="home" size={48} color={Colors.textLight} />
                <Text style={styles.emptyStateTitle}>No Properties Yet</Text>
                <Text style={styles.emptyStateText}>
                  Properties you add will appear here for quick access.
                </Text>
                <TouchableOpacity style={styles.addButton}>
                  <Feather name="plus" size={16} color={Colors.white} />
                  <Text style={styles.addButtonText}>Add Property</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={properties}
                renderItem={renderPropertyItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                contentContainerStyle={styles.propertiesList}
              />
            )}
          </View>

          {/* Recent Reports section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Reports</Text>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
                <Feather name="chevron-right" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {recentReports.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="file-text" size={48} color={Colors.textLight} />
                <Text style={styles.emptyStateTitle}>No Reports Yet</Text>
                <Text style={styles.emptyStateText}>
                  Generated reports will appear here for quick access.
                </Text>
                <TouchableOpacity style={styles.addButton}>
                  <Feather name="plus" size={16} color={Colors.white} />
                  <Text style={styles.addButtonText}>Create Report</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {/* Reports list would go here */}
                <Text style={styles.comingSoonText}>
                  Recent reports view coming soon...
                </Text>
              </View>
            )}
          </View>

          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </View>
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
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.white,
    opacity: 0.8,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
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
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    marginRight: 4,
  },
  featureList: {
    paddingRight: 20,
    paddingBottom: 10,
    paddingTop: 10,
  },
  featureCard: {
    width: 160,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    marginVertical: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 16,
  },
  featureBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: Colors.accent,
    borderRadius: 10,
  },
  featureBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  propertyCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  propertyImageContainer: {
    height: 160,
    backgroundColor: Colors.lightPrimary,
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  propertyImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightPrimary,
  },
  propertyTypeTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  propertyTypeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  propertyContent: {
    padding: 16,
  },
  propertyAddress: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 12,
  },
  propertyDetails: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  propertyDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  propertyDetailText: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 6,
  },
  propertyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  propertyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  propertyActionText: {
    fontSize: 14,
    marginLeft: 6,
    color: Colors.text,
  },
  propertiesList: {
    paddingTop: 8,
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    padding: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginTop: 8,
  },
  bottomPadding: {
    height: 80,
  },
});

export default HomeScreen;