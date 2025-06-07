import { Field } from '../types/field';

export const calculateTotalArea = (fields: Field[]): number => {
  return fields.reduce((sum, field) => sum + field.area, 0);
};

export const calculateAverageFieldSize = (fields: Field[]): number => {
  if (fields.length === 0) return 0;
  return calculateTotalArea(fields) / fields.length;
};

export const groupBySoilType = (fields: Field[]): Record<string, number> => {
  return fields.reduce((groups, field) => {
    const type = field.soilType;
    groups[type] = (groups[type] || 0) + field.area;
    return groups;
  }, {} as Record<string, number>);
};

export const groupByCropType = (fields: Field[]): Record<string, number> => {
  return fields.reduce((groups, field) => {
    if (field.cropType) {
      groups[field.cropType] = (groups[field.cropType] || 0) + field.area;
    }
    return groups;
  }, {} as Record<string, number>);
};

export const formatArea = (area: number): string => {
  return `${area.toFixed(1)} acres`;
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString();
};

export const validateField = (field: Partial<Field>): string[] => {
  const errors: string[] = [];

  if (!field.name) {
    errors.push('Field name is required');
  }

  if (!field.soilType) {
    errors.push('Soil type is required');
  }

  if (typeof field.area !== 'number' || field.area <= 0) {
    errors.push('Area must be greater than 0');
  }

  return errors;
}; 