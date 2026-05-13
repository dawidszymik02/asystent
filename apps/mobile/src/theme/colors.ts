export const colors = {
  dark: {
    background: '#0A0A0A',
    surface: '#141414',
    surfaceElevated: '#1E1E1E',
    border: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textMuted: '#555555',
    accent: '#FFFFFF',
    accentSoft: '#2A2A2A',
    error: '#FF4444',
    success: '#44FF88',
  },
  light: {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    surfaceElevated: '#FFFFFF',
    border: '#E0E0E0',
    text: '#0A0A0A',
    textSecondary: '#555555',
    textMuted: '#A0A0A0',
    accent: '#0A0A0A',
    accentSoft: '#F0F0F0',
    error: '#CC0000',
    success: '#00AA44',
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ThemeColors = typeof colors.dark;
