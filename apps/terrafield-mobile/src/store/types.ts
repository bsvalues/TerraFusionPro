export interface SettingsState {
  theme: string;
  language: string;
  notifications: boolean;
  logging: {
    level: string;
    enabled: boolean;
  };
}

export interface RootState {
  settings: SettingsState;
} 