import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Field } from '../types/field';
import { theme } from '../theme';

interface FieldFormProps {
  initialData?: Partial<Field>;
  onSubmit: (data: Partial<Field>) => void;
  onCancel: () => void;
}

export const FieldForm: React.FC<FieldFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<Field>>({
    name: '',
    soilType: '',
    cropType: '',
    area: 0,
    ...initialData,
  });

  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = () => {
    const validationErrors: string[] = [];

    if (!formData.name) {
      validationErrors.push('Field name is required');
    }

    if (!formData.soilType) {
      validationErrors.push('Soil type is required');
    }

    if (!formData.area || formData.area <= 0) {
      validationErrors.push('Area must be greater than 0');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (field: keyof Field, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setErrors([]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Field Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={value => handleChange('name', value)}
            placeholder="Enter field name"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Soil Type</Text>
          <TextInput
            style={styles.input}
            value={formData.soilType}
            onChangeText={value => handleChange('soilType', value)}
            placeholder="Enter soil type"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Crop Type</Text>
          <TextInput
            style={styles.input}
            value={formData.cropType}
            onChangeText={value => handleChange('cropType', value)}
            placeholder="Enter crop type (optional)"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Area (acres)</Text>
          <TextInput
            style={styles.input}
            value={formData.area?.toString()}
            onChangeText={value => handleChange('area', parseFloat(value) || 0)}
            placeholder="Enter area"
            keyboardType="numeric"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        {errors.length > 0 && (
          <View style={styles.errorContainer}>
            {errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>
                {error}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
          >
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  errorContainer: {
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 14,
    marginBottom: 4,
  },
  buttons: {
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
  cancelButton: {
    backgroundColor: theme.colors.danger,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
}); 