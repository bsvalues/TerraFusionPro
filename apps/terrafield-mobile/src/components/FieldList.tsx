import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Field } from '../types/field';
import { theme } from '../theme';
import { formatArea } from '../utils/helpers';

interface FieldListProps {
  fields: Field[];
  onFieldPress: (field: Field) => void;
}

export const FieldList: React.FC<FieldListProps> = ({
  fields,
  onFieldPress,
}) => {
  const renderField = ({ item: field }: { item: Field }) => (
    <TouchableOpacity
      style={styles.fieldCard}
      onPress={() => onFieldPress(field)}
    >
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldName}>{field.name}</Text>
        <Text style={styles.fieldArea}>{formatArea(field.area)}</Text>
      </View>

      <View style={styles.fieldDetails}>
        <Text style={styles.fieldDetail}>
          Soil Type: {field.soilType}
        </Text>
        {field.cropType && (
          <Text style={styles.fieldDetail}>
            Crop: {field.cropType}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={fields}
      renderItem={renderField}
      keyExtractor={field => field.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No fields added yet</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  fieldCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.small,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  fieldArea: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  fieldDetails: {
    gap: 4,
  },
  fieldDetail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
}); 