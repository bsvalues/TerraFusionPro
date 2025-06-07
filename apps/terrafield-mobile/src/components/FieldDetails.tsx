import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Field } from '../types/field';
import { theme } from '../theme';
import { formatArea, formatDate } from '../utils/helpers';
import { FieldMap } from './FieldMap';

interface FieldDetailsProps {
  field: Field;
  onEdit: () => void;
  onDelete: () => void;
}

export const FieldDetails: React.FC<FieldDetailsProps> = ({
  field,
  onEdit,
  onDelete,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <FieldMap
          initialPoints={field.coordinates}
          readOnly
        />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{field.name}</Text>
          <Text style={styles.area}>{formatArea(field.area)}</Text>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Soil Type</Text>
            <Text style={styles.value}>{field.soilType}</Text>
          </View>

          {field.cropType && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Crop Type</Text>
              <Text style={styles.value}>{field.cropType}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.label}>Created</Text>
            <Text style={styles.value}>{formatDate(field.createdAt)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Last Updated</Text>
            <Text style={styles.value}>{formatDate(field.updatedAt)}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.editButton]}
            onPress={onEdit}
          >
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={onDelete}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mapContainer: {
    height: 300,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
  },
  area: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  details: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
  },
  deleteButton: {
    backgroundColor: theme.colors.danger,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
}); 