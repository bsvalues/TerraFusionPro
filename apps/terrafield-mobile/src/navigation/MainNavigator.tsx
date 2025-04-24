import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Home and Dashboard
import DashboardScreen from '../screens/DashboardScreen';
import PropertyListScreen from '../screens/PropertyListScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';

// Inspection and Data Collection
import InspectionScreen from '../screens/InspectionScreen';
import FormCaptureScreen from '../screens/FormCaptureScreen';
import VoicePropertyFormScreen from '../screens/VoicePropertyFormScreen';

// Photos and Measurements
import PhotoEnhancementScreen from '../screens/PhotoEnhancementScreen';
import ARMeasurementScreen from '../screens/ARMeasurementScreen';

// Comparables and Analysis
import ComparableSearchScreen from '../screens/ComparableSearchScreen';
import AdjustmentModelScreen from '../screens/AdjustmentModelScreen';

// Reporting and Compliance
import ReportGenerationScreen from '../screens/ReportGenerationScreen';
import ComplianceDocumentScreen from '../screens/ComplianceDocumentScreen';

// Collaboration and Sync
import CollaborationScreen from '../screens/CollaborationScreen';
import SyncStatusScreen from '../screens/SyncStatusScreen';

// Auth and Profile
import AuthScreen from '../screens/AuthScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SecuritySettingsScreen from '../screens/SecuritySettingsScreen';

// Types
import { RootStackParamList, MainTabParamList } from './types';

// Create navigators
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Home stack navigator
 */
const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="PropertyList" component={PropertyListScreen} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
    </Stack.Navigator>
  );
};

/**
 * Inspection stack navigator
 */
const InspectionStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Inspection" component={InspectionScreen} />
      <Stack.Screen name="FormCapture" component={FormCaptureScreen} />
      <Stack.Screen name="VoiceForm" component={VoicePropertyFormScreen} />
      <Stack.Screen name="PhotoEnhancement" component={PhotoEnhancementScreen} />
      <Stack.Screen name="ARMeasurement" component={ARMeasurementScreen} />
    </Stack.Navigator>
  );
};

/**
 * Analysis stack navigator
 */
const AnalysisStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ComparableSearch" component={ComparableSearchScreen} />
      <Stack.Screen name="AdjustmentModel" component={AdjustmentModelScreen} />
    </Stack.Navigator>
  );
};

/**
 * Reports stack navigator
 */
const ReportsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ReportGeneration" component={ReportGenerationScreen} />
      <Stack.Screen name="ComplianceDocument" component={ComplianceDocumentScreen} />
    </Stack.Navigator>
  );
};

/**
 * Collaboration stack navigator
 */
const CollaborationStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Collaboration" component={CollaborationScreen} />
      <Stack.Screen name="SyncStatus" component={SyncStatusScreen} />
    </Stack.Navigator>
  );
};

/**
 * Profile stack navigator
 */
const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
    </Stack.Navigator>
  );
};

/**
 * Main tab navigator
 */
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Inspection':
              iconName = focused ? 'clipboard-check' : 'clipboard-check-outline';
              break;
            case 'Analysis':
              iconName = focused ? 'chart-box' : 'chart-box-outline';
              break;
            case 'Reports':
              iconName = focused ? 'file-document' : 'file-document-outline';
              break;
            case 'Collaborate':
              iconName = focused ? 'account-group' : 'account-group-outline';
              break;
            case 'Profile':
              iconName = focused ? 'account-circle' : 'account-circle-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#7f8c8d',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#eee',
          backgroundColor: '#fff',
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Inspection" component={InspectionStack} />
      <Tab.Screen name="Analysis" component={AnalysisStack} />
      <Tab.Screen name="Reports" component={ReportsStack} />
      <Tab.Screen name="Collaborate" component={CollaborationStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

/**
 * Root navigator
 */
const RootNavigator = () => {
  // Check auth state
  const isLoggedIn = true; // For demonstration, in real app would check auth state

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isLoggedIn ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;