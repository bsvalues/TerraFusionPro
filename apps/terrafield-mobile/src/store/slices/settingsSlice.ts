import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SettingsState } from '../../types';

const initialState: SettingsState = {
  theme: 'light',
  language: 'en',
  notifications: {
    enabled: true,
    sound: true,
    vibration: true
  },
  logging: {
    level: 'info',
    enabled: true
  }
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<string>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setLoggingLevel: (state, action: PayloadAction<string>) => {
      state.logging.level = action.payload;
    },
    setLoggingEnabled: (state, action: PayloadAction<boolean>) => {
      state.logging.enabled = action.payload;
    }
  }
});

export const { setTheme, setLanguage, setLoggingLevel, setLoggingEnabled } = settingsSlice.actions;
export default settingsSlice.reducer; 