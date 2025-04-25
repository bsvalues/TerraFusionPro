import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View, Text } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import PropertyDetailsScreen from '../screens/PropertyDetailsScreen';
import FieldNotesScreen from '../screens/FieldNotesScreen';
import PropertyComparisonDashboard from '../screens/PropertyComparisonDashboard';
import PhotoEnhancementScreen from '../screens/PhotoEnhancementScreen';
import ARMeasurementScreen from '../screens/ARMeasurementScreen';
import ReportGenerationScreen from '../screens/ReportGenerationScreen';
import PropertyShareScreen from '../screens/PropertyShareScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

import { useAuth } from '../hooks/useAuth';
import * as Colors from '../constants/Colors';

// Define the type for stack navigator params
type AppStackParamList = {
  Home: undefined;
  PropertyDetails: { propertyId: string };
  FieldNotes: { propertyId?: string; parcelId?: string };
  PropertyComparison: { propertyId: string };
  PhotoEnhancement: { propertyId: string };
  ARMeasurement: { propertyId: string };
  ReportGeneration: { propertyId: string };
  PropertyShare: { propertyId: string };
  Settings: undefined;
  Profile: undefined;
  Login: undefined;
  Signup: undefined;
};

// Create stack navigator
const Stack = createStackNavigator<AppStackParamList>();

// Create tab navigator
const Tab = createBottomTabNavigator();

// Tab navigator icon function
const getTabIcon = ({ route, color, size }: { route: any; color: string; size: number }) => {
  let iconName = '';

  switch (route.name) {
    case 'Home':
      iconName = 'home';
      break;
    case 'Properties':
      iconName = 'business';
      break;
    case 'Reports':
      iconName = 'document-text';
      break;
    case 'Profile':
      iconName = 'person';
      break;
    default:
      iconName = 'help-circle';
  }

  return <Ionicons name={iconName as any} size={size} color={color} />;
};

// Main tab navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: (props) => getTabIcon({ route, ...props }),
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingTop: 5,
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Home',
        }} 
      />
      <Tab.Screen 
        name="Properties" 
        component={PropertyStackNavigator} 
        options={{ 
          title: 'Properties',
        }} 
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportStackNavigator} 
        options={{ 
          title: 'Reports',
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator} 
        options={{ 
          title: 'Profile',
        }} 
      />
    </Tab.Navigator>
  );
};

// Property stack navigator
const PropertyStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.white,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTintColor: Colors.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="PropertyDetails" 
        component={PropertyDetailsScreen} 
        options={({ route }) => ({ 
          title: 'Property Details',
        })} 
      />
      <Stack.Screen 
        name="FieldNotes" 
        component={FieldNotesScreen} 
        options={{ title: 'Field Notes', headerShown: false }} 
      />
      <Stack.Screen 
        name="PropertyComparison" 
        component={PropertyComparisonDashboard} 
        options={{ title: 'Property Comparison' }} 
      />
      <Stack.Screen 
        name="PhotoEnhancement" 
        component={PhotoEnhancementScreen} 
        options={{ title: 'Photo Enhancement' }} 
      />
      <Stack.Screen 
        name="ARMeasurement" 
        component={ARMeasurementScreen} 
        options={{ title: 'AR Measurement' }} 
      />
      <Stack.Screen 
        name="PropertyShare" 
        component={PropertyShareScreen} 
        options={{ title: 'Share Property' }} 
      />
    </Stack.Navigator>
  );
};

// Report stack navigator
const ReportStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.white,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTintColor: Colors.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="ReportGeneration" 
        component={ReportGenerationScreen} 
        options={{ title: 'Generate Report' }} 
      />
    </Stack.Navigator>
  );
};

// Profile stack navigator
const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.white,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTintColor: Colors.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }} 
      />
    </Stack.Navigator>
  );
};

// Auth stack navigator
const AuthStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
};

// App Navigator
const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTabNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text,
  },
});

export default AppNavigator;