import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../navigation/types';
import { RootState } from '../store';
import { FieldForm } from '../components/FieldForm';
import { FieldDetails } from '../components/FieldDetails';
import { theme } from '../theme';

type FieldScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Field'>;
type FieldScreenRouteProp = RouteProp<RootStackParamList, 'Field'>;

export const FieldScreen = () => {
  const navigation = useNavigation<FieldScreenNavigationProp>();
  const route = useRoute<FieldScreenRouteProp>();
  const { fieldId } = route.params;

  const fields = useSelector((state: RootState) => state.fields.items);
  const field = fields.find((f) => f.id === fieldId);
  const [isEditing, setIsEditing] = useState(!fieldId);

  useEffect(() => {
    if (field) {
      navigation.setOptions({
        title: field.name,
      });
    }
  }, [field, navigation]);

  const handleSave = () => {
    setIsEditing(false);
    if (!fieldId) {
      navigation.goBack();
    }
  };

  const handleCancel = () => {
    if (fieldId) {
      setIsEditing(false);
    } else {
      navigation.goBack();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    navigation.goBack();
  };

  if (isEditing) {
    return (
      <View style={styles.container}>
        <FieldForm
          initialData={field}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </View>
    );
  }

  if (!field) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FieldDetails
        field={field}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
}); 