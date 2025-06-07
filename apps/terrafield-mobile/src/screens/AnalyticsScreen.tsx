import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { theme } from '../theme';
import {
  calculateTotalArea,
  calculateAverageFieldSize,
  groupBySoilType,
  groupByCropType,
} from '../utils/helpers';

export const AnalyticsScreen = () => {
  const fields = useSelector((state: RootState) => state.fields.items);
  const totalArea = calculateTotalArea(fields);
  const averageFieldSize = calculateAverageFieldSize(fields);
  const soilTypeGroups = groupBySoilType(fields);
  const cropTypeGroups = groupByCropType(fields);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{fields.length}</Text>
            <Text style={styles.statLabel}>Total Fields</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalArea.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Total Acres</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{averageFieldSize.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg. Field Size</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Soil Types</Text>
        {Object.entries(soilTypeGroups).map(([type, area]) => (
          <View key={type} style={styles.distributionItem}>
            <Text style={styles.distributionLabel}>{type}</Text>
            <Text style={styles.distributionValue}>{area.toFixed(1)} acres</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Crop Types</Text>
        {Object.entries(cropTypeGroups).map(([type, area]) => (
          <View key={type} style={styles.distributionItem}>
            <Text style={styles.distributionLabel}>{type}</Text>
            <Text style={styles.distributionValue}>{area.toFixed(1)} acres</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    flex: 1,
    margin: 8,
    ...theme.shadows.medium,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  distributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  distributionLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  distributionValue: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
}); 