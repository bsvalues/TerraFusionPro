/**
 * App color palette
 */

// Primary colors
export const primary = '#2563EB';
export const secondary = '#475569';
export const accent = '#8B5CF6';
export const success = '#22C55E';
export const warning = '#F59E0B';
export const error = '#EF4444';
export const info = '#3B82F6';

// Light variations
export const lightPrimary = '#DBEAFE';
export const lightSecondary = '#F1F5F9';
export const lightAccent = '#EDE9FE';
export const lightSuccess = '#DCFCE7';
export const lightWarning = '#FEF3C7';
export const lightError = '#FEE2E2';
export const lightInfo = '#E0F2FE';

// Text colors
export const text = '#1E293B';
export const textLight = '#64748B';
export const textDark = '#0F172A';
export const textInverted = '#F8FAFC';

// UI colors
export const border = '#E2E8F0';
export const card = '#FFFFFF';
export const divider = '#CBD5E1';
export const background = '#F8FAFC';
export const highlight = '#F1F5F9';
export const cardBackground = '#FFFFFF';

// Status colors
export const active = '#22C55E';
export const inactive = '#94A3B8';
export const pending = '#F59E0B';
export const canceled = '#DC2626';

// Input colors
export const inputBackground = '#F1F5F9';
export const inputText = '#1E293B';
export const inputPlaceholder = '#94A3B8';
export const inputBorder = '#CBD5E1';

// Gray palette
export const white = '#FFFFFF';
export const gray = '#64748B';
export const lightGray = '#94A3B8';
export const darkGray = '#475569';
export const black = '#0F172A';

// Transparent colors
export const transparent = 'transparent';
export const semiTransparent = 'rgba(0, 0, 0, 0.1)';
export const overlay = 'rgba(0, 0, 0, 0.5)';

// Functional colors
export const shadow = 'rgba(0, 0, 0, 0.1)';
export const link = '#2563EB';
export const visited = '#8B5CF6';
export const focus = '#3B82F6';
export const disabled = '#E2E8F0';

// App-specific colors
export const photo = '#3B82F6';
export const fieldNote = '#8B5CF6';
export const measurement = '#22C55E';
export const comparable = '#F59E0B';
export const adjustment = '#EC4899';
export const chart = '#2563EB';
export const sync = '#8B5CF6';
export const offline = '#F59E0B';
export const online = '#22C55E';
export const collaborate = '#3B82F6';

// Export a theme object for easy access
export const theme = {
  colors: {
    primary,
    secondary,
    accent,
    success,
    warning,
    error,
    info,
    text,
    background,
    card,
    border,
    notification: accent,
  }
};

// Export dark mode colors (for future use)
export const dark = {
  primary: '#3B82F6',
  secondary: '#94A3B8',
  accent: '#A78BFA',
  background: '#0F172A',
  card: '#1E293B',
  text: '#F8FAFC',
  border: '#334155',
};