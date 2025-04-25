import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import * as Colors from '../constants/Colors';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { login } = useAuth();

  // State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle login
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(username, password);
      
      if (!success) {
        Alert.alert('Login Failed', 'Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Error', 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to signup
  const navigateToSignup = () => {
    navigation.navigate('Signup' as never);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.leftPanel}>
          <View style={styles.logoContainer}>
            <Feather name="map" size={40} color={Colors.primary} />
            <Text style={styles.logoText}>TerraField</Text>
          </View>

          <Text style={styles.heading}>Welcome Back</Text>
          <Text style={styles.subheading}>
            Sign in to continue to your account
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Feather name="user" size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={Colors.textLight}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={Colors.textLight}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, (!username || !password) && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={!username || !password || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account?</Text>
              <TouchableOpacity onPress={navigateToSignup}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.rightPanel}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>AppraisalCore</Text>
            <Text style={styles.heroSubtitle}>TerraField Mobile</Text>
            <Text style={styles.heroDescription}>
              The all-in-one platform for property appraisers with advanced AI capabilities, offline support, and seamless collaboration.
            </Text>

            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Feather name="file-text" size={20} color={Colors.white} />
                <Text style={styles.featureText}>Collaborative Field Notes</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="image" size={20} color={Colors.white} />
                <Text style={styles.featureText}>AI Photo Enhancement</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="wifi-off" size={20} color={Colors.white} />
                <Text style={styles.featureText}>Offline-First Experience</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="bar-chart-2" size={20} color={Colors.white} />
                <Text style={styles.featureText}>One-Click Comparison</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    height: 50,
  },
  input: {
    flex: 1,
    height: 50,
    paddingLeft: 8,
    color: Colors.text,
    fontSize: 16,
  },
  inputIcon: {
    marginHorizontal: 12,
  },
  passwordToggle: {
    padding: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.disabledButton,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: Colors.textLight,
    marginRight: 4,
  },
  signupLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
  heroContent: {
    maxWidth: 400,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 16,
  },
  heroDescription: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.8,
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresContainer: {
    marginTop: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    marginLeft: 12,
    color: Colors.white,
    fontSize: 16,
  },
});

export default LoginScreen;