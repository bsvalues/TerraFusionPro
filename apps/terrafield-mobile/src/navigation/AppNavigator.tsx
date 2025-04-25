import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

// Import screens
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

// Import authentication hook
import { useAuth } from '../hooks/useAuth';
import * as Colors from '../constants/Colors';

// Stack navigator types
export type RootStackParamList = {
  Main: undefined;
  PropertyDetails: { propertyId: number; propertyAddress?: string };
  FieldNotes: { parcelId: string; propertyAddress?: string };
  PropertyComparison: { propertyIds?: number[] };
  PhotoEnhancement: { photoUri?: string; propertyId?: number };
  ARMeasurement: { propertyId?: number };
  ReportGeneration: { propertyId: number };
  PropertyShare: { propertyId: number };
  Login: undefined;
  Signup: undefined;
};

// Tab navigator types
export type MainTabParamList = {
  Home: undefined;
  Comparisons: undefined;
  Reports: undefined;
  Settings: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main tab navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Comparisons') {
            iconName = 'bar-chart-2';
          } else if (route.name === 'Reports') {
            iconName = 'file-text';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          }

          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen 
        name="Comparisons" 
        component={PropertyComparisonDashboard}
        options={{ title: 'Comparisons' }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportGenerationScreen}
        options={{ title: 'Reports' }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Authentication navigator
const AuthNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background }
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
};

// Root navigator
const AppNavigator = () => {
  const user = useAuth();
  const isAuthenticated = !!user.id;

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: Colors.primary,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: Colors.white,
            headerTitleStyle: {
              fontWeight: '600',
            },
            cardStyle: { backgroundColor: Colors.background },
          }}
        >
          <Stack.Screen 
            name="Main" 
            component={MainTabNavigator} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="PropertyDetails" 
            component={PropertyDetailsScreen}
            options={({ route }) => ({ 
              title: route.params?.propertyAddress || 'Property Details'
            })}
          />
          <Stack.Screen 
            name="FieldNotes" 
            component={FieldNotesScreen}
            options={{ title: 'Field Notes' }}
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
            name="ReportGeneration" 
            component={ReportGenerationScreen}
            options={{ title: 'Report Generation' }}
          />
          <Stack.Screen 
            name="PropertyShare" 
            component={PropertyShareScreen}
            options={{ title: 'Share Property' }}
          />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;