import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Field {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  area: number;
  soilType: string;
  lastUpdated: string;
}

interface FieldState {
  fields: Field[];
  selectedField: Field | null;
  loading: boolean;
  error: string | null;
}

const initialState: FieldState = {
  fields: [],
  selectedField: null,
  loading: false,
  error: null,
};

const fieldSlice = createSlice({
  name: 'field',
  initialState,
  reducers: {
    setFields: (state, action: PayloadAction<Field[]>) => {
      state.fields = action.payload;
    },
    selectField: (state, action: PayloadAction<Field>) => {
      state.selectedField = action.payload;
    },
    addField: (state, action: PayloadAction<Field>) => {
      state.fields.push(action.payload);
    },
    updateField: (state, action: PayloadAction<Field>) => {
      const index = state.fields.findIndex(field => field.id === action.payload.id);
      if (index !== -1) {
        state.fields[index] = action.payload;
      }
    },
    deleteField: (state, action: PayloadAction<string>) => {
      state.fields = state.fields.filter(field => field.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setFields,
  selectField,
  addField,
  updateField,
  deleteField,
  setLoading,
  setError,
} = fieldSlice.actions;

export default fieldSlice.reducer; 