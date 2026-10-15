import { useColorScheme } from 'react-native';

const palette = {
  light: {
    background: '#F4F6FA',
    surface: '#FFFFFF',
    text: '#111827',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    primary: '#208AEF',
    primaryText: '#FFFFFF',
    danger: '#DC2626',
    dangerSurface: '#FEE2E2',
    success: '#16A34A',
  },
  dark: {
    background: '#0F1115',
    surface: '#1A1D23',
    text: '#F3F4F6',
    textMuted: '#9CA3AF',
    border: '#2A2E36',
    primary: '#3B9BF5',
    primaryText: '#FFFFFF',
    danger: '#F87171',
    dangerSurface: '#3B1517',
    success: '#4ADE80',
  },
};

export type ThemeColors = (typeof palette)['light'];

export function useThemeColors(): ThemeColors {
  return useColorScheme() === 'dark' ? palette.dark : palette.light;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  md: 10,
  lg: 16,
} as const;
