import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import MapView, { Polygon, Marker, Region } from 'react-native-maps';
import { MapPoint, mapService } from '../services/map';
import { theme } from '../theme';

interface FieldMapProps {
  initialPoints?: MapPoint[];
  onPointsChange?: (points: MapPoint[], area: number) => void;
  readOnly?: boolean;
}

export const FieldMap: React.FC<FieldMapProps> = ({
  initialPoints = [],
  onPointsChange,
  readOnly = false,
}) => {
  const [points, setPoints] = useState<MapPoint[]>(initialPoints);
  const [isDrawing, setIsDrawing] = useState(false);
  const mapRef = useRef<MapView>(null);

  const handleMapPress = (event: any) => {
    if (readOnly || !isDrawing) return;

    const newPoint: MapPoint = {
      latitude: event.nativeEvent.coordinate.latitude,
      longitude: event.nativeEvent.coordinate.longitude,
    };

    const newPoints = [...points, newPoint];
    setPoints(newPoints);

    if (onPointsChange) {
      const area = mapService.calculateArea(newPoints);
      onPointsChange(newPoints, area);
    }
  };

  const handleStartDrawing = () => {
    if (readOnly) return;
    setIsDrawing(true);
    setPoints([]);
  };

  const handleFinishDrawing = () => {
    if (readOnly) return;
    setIsDrawing(false);

    if (points.length < 3) {
      Alert.alert('Invalid Field', 'A field must have at least 3 points.');
      setPoints([]);
      return;
    }

    if (!mapService.validateFieldBoundaries(points)) {
      Alert.alert('Invalid Field', 'Field boundaries cannot intersect.');
      setPoints([]);
      return;
    }
  };

  const handleReset = () => {
    if (readOnly) return;
    setPoints([]);
    setIsDrawing(false);
  };

  const getMapRegion = (): Region => {
    if (points.length === 0) {
      return {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }

    const bounds = mapService.getBounds(points);
    return mapService.getRegionForBounds(bounds);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={getMapRegion()}
        onPress={handleMapPress}
      >
        {points.length > 0 && (
          <Polygon
            coordinates={points}
            strokeColor={theme.colors.primary}
            fillColor={`${theme.colors.primary}33`}
            strokeWidth={2}
          />
        )}
        {points.map((point, index) => (
          <Marker
            key={index}
            coordinate={point}
            title={`Point ${index + 1}`}
            description={`${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`}
          />
        ))}
      </MapView>

      {!readOnly && (
        <View style={styles.controls}>
          {!isDrawing ? (
            <TouchableOpacity
              style={styles.button}
              onPress={handleStartDrawing}
            >
              <Text style={styles.buttonText}>Start Drawing</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.button}
                onPress={handleFinishDrawing}
              >
                <Text style={styles.buttonText}>Finish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.resetButton]}
                onPress={handleReset}
              >
                <Text style={styles.buttonText}>Reset</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    ...theme.shadows.small,
  },
  resetButton: {
    backgroundColor: theme.colors.danger,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
}); 