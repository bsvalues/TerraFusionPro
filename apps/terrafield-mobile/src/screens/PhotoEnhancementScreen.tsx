import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { PhotoSyncService } from '../services/PhotoSyncService';
import { ApiService } from '../services/ApiService';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface PhotoEnhancementOptions {
  improveLighting?: boolean;
  correctPerspective?: boolean;
  enhanceDetails?: boolean;
  removeClutter?: boolean;
  identifyFeatures?: boolean;
}

const PhotoEnhancementScreen = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportId, setReportId] = useState<string>('');
  const [detectedFeatures, setDetectedFeatures] = useState<string[]>([]);
  const [options, setOptions] = useState<PhotoEnhancementOptions>({
    improveLighting: true,
    correctPerspective: true,
    enhanceDetails: true,
    removeClutter: false,
    identifyFeatures: true
  });
  const [saveLocally, setSaveLocally] = useState(false);
  
  const route = useRoute();
  const navigation = useNavigation();
  const api = ApiService.getInstance();
  const photoSync = PhotoSyncService.getInstance('https://api.example.com');
  
  // Request camera permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Sorry, we need camera permissions to make this work!');
        }
      }
      
      // Get report ID from route params
      if (route.params?.reportId) {
        setReportId(route.params.reportId);
      }
    })();
  }, []);
  
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setOriginalImage(selectedImage.uri);
        setEnhancedImage(null);
        setDetectedFeatures([]);
        
        // Analyze image automatically
        analyzeImage(selectedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery.');
    }
  };
  
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        setOriginalImage(photo.uri);
        setEnhancedImage(null);
        setDetectedFeatures([]);
        
        // Analyze image automatically
        analyzeImage(photo.uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo.');
    }
  };
  
  const analyzeImage = async (imageUri: string) => {
    if (!imageUri) return;
    
    setIsAnalyzing(true);
    
    try {
      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // In a real app, we would send this to the server for analysis
      // For this demo, we'll just simulate a response
      
      // Simulated server analysis - in production this would be an API call
      // const response = await api.post('/api/photo-enhancement/analyze', { 
      //   photo: base64 
      // });
      
      // Simulated recommendation results
      const recommendedOptions = {
        improveLighting: true,
        correctPerspective: imageUri.includes('building') || imageUri.includes('house'),
        enhanceDetails: true,
        removeClutter: imageUri.includes('room') || imageUri.includes('interior'),
        identifyFeatures: true
      };
      
      // Update options
      setOptions(recommendedOptions);
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert('Analysis Error', 'Failed to analyze the image.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const enhanceImage = async () => {
    if (!originalImage) {
      Alert.alert('No Image', 'Please select or take a photo first.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(originalImage, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // In a real app, we would send this to the server for enhancement
      // For this demo, we'll just simulate a response by using the original image
      
      // Simulated server enhancement - in production this would be an API call
      // const response = await api.post('/api/photo-enhancement/enhance', { 
      //   photo: base64,
      //   ...options
      // });
      
      // Simulate a delay for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, we'll just use the original image
      setEnhancedImage(originalImage);
      
      // Simulate detected features if feature detection was enabled
      if (options.identifyFeatures) {
        // These would actually come from the AI analysis
        const features = [
          'Two-story residential property',
          'Traditional colonial architecture',
          'Brick exterior with white trim',
          'Attached two-car garage',
          'Landscaped front yard with mature trees',
          'Asphalt shingle roof in good condition'
        ];
        setDetectedFeatures(features);
      } else {
        setDetectedFeatures([]);
      }
      
      // Save to photo sync service if requested
      if (saveLocally && reportId) {
        const photoId = photoSync.addPhoto({
          reportId: reportId,
          photoType: 'SUBJECT',
          url: '',  // Will be filled when synced
          caption: 'Enhanced property photo',
          dateTaken: new Date().toISOString(),
          latitude: 37.7749,  // Example coordinates (San Francisco)
          longitude: -122.4194,
          isOffline: true,
          localPath: originalImage
        });
        
        Alert.alert(
          'Photo Saved',
          'The enhanced photo has been saved locally and will be synced when online.'
        );
      }
      
    } catch (error) {
      console.error('Error enhancing image:', error);
      Alert.alert('Enhancement Error', 'Failed to enhance the image.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleOption = (option: keyof PhotoEnhancementOptions) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TerraField Photo Enhancement</Text>
        <Text style={styles.subtitle}>
          Enhance property photos with AI
        </Text>
      </View>
      
      <View style={styles.imageContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>Enhancing image...</Text>
          </View>
        ) : originalImage ? (
          <>
            <View style={styles.imageWrapper}>
              <Text style={styles.imageLabel}>Original</Text>
              <Image 
                source={{ uri: originalImage }} 
                style={styles.image} 
                resizeMode="cover"
              />
            </View>
            
            {enhancedImage && (
              <View style={styles.imageWrapper}>
                <Text style={styles.imageLabel}>Enhanced</Text>
                <Image 
                  source={{ uri: enhancedImage }} 
                  style={styles.image} 
                  resizeMode="cover"
                />
              </View>
            )}
          </>
        ) : (
          <View style={styles.placeholderContainer}>
            <MaterialIcons name="photo-camera" size={80} color="#cccccc" />
            <Text style={styles.placeholderText}>
              Take or select a photo to enhance
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={takePhoto}
          disabled={isLoading}
        >
          <Ionicons name="camera" size={24} color="white" />
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={pickImage}
          disabled={isLoading}
        >
          <Ionicons name="images" size={24} color="white" />
          <Text style={styles.buttonText}>Gallery</Text>
        </TouchableOpacity>
      </View>
      
      {originalImage && (
        <>
          <View style={styles.optionsContainer}>
            <Text style={styles.sectionTitle}>Enhancement Options</Text>
            
            {isAnalyzing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#0066CC" />
                <Text>Analyzing image...</Text>
              </View>
            ) : (
              <>
                <View style={styles.optionRow}>
                  <Text style={styles.optionText}>Improve Lighting</Text>
                  <Switch
                    value={options.improveLighting}
                    onValueChange={() => toggleOption('improveLighting')}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={options.improveLighting ? '#0066CC' : '#f4f3f4'}
                  />
                </View>
                
                <View style={styles.optionRow}>
                  <Text style={styles.optionText}>Correct Perspective</Text>
                  <Switch
                    value={options.correctPerspective}
                    onValueChange={() => toggleOption('correctPerspective')}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={options.correctPerspective ? '#0066CC' : '#f4f3f4'}
                  />
                </View>
                
                <View style={styles.optionRow}>
                  <Text style={styles.optionText}>Enhance Details</Text>
                  <Switch
                    value={options.enhanceDetails}
                    onValueChange={() => toggleOption('enhanceDetails')}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={options.enhanceDetails ? '#0066CC' : '#f4f3f4'}
                  />
                </View>
                
                <View style={styles.optionRow}>
                  <Text style={styles.optionText}>Remove Clutter</Text>
                  <Switch
                    value={options.removeClutter}
                    onValueChange={() => toggleOption('removeClutter')}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={options.removeClutter ? '#0066CC' : '#f4f3f4'}
                  />
                </View>
                
                <View style={styles.optionRow}>
                  <Text style={styles.optionText}>Identify Features</Text>
                  <Switch
                    value={options.identifyFeatures}
                    onValueChange={() => toggleOption('identifyFeatures')}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={options.identifyFeatures ? '#0066CC' : '#f4f3f4'}
                  />
                </View>
                
                <View style={styles.optionRow}>
                  <Text style={styles.optionText}>Save to Report</Text>
                  <Switch
                    value={saveLocally}
                    onValueChange={setSaveLocally}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={saveLocally ? '#0066CC' : '#f4f3f4'}
                  />
                </View>
              </>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.enhanceButton, isLoading && styles.disabledButton]} 
            onPress={enhanceImage}
            disabled={isLoading || isAnalyzing}
          >
            <Text style={styles.enhanceButtonText}>
              {isLoading ? 'Enhancing...' : 'Enhance Photo'}
            </Text>
          </TouchableOpacity>
          
          {detectedFeatures.length > 0 && (
            <View style={styles.featuresContainer}>
              <Text style={styles.sectionTitle}>Detected Features</Text>
              {detectedFeatures.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <MaterialIcons name="check-circle" size={20} color="#0066CC" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#0066CC',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  imageContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageWrapper: {
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 10,
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 250,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  placeholderText: {
    marginTop: 10,
    color: '#999',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 250,
  },
  loadingText: {
    marginTop: 10,
    color: '#0066CC',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 15,
  },
  button: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  optionsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  enhanceButton: {
    backgroundColor: '#0066CC',
    padding: 15,
    borderRadius: 8,
    margin: 15,
    alignItems: 'center',
  },
  enhanceButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#91b7df',
  },
  featuresContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
});

export default PhotoEnhancementScreen;