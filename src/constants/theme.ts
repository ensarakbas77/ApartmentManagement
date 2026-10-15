import { Platform, useColorScheme, type ViewStyle } from 'react-native';

const palette = {
  light: {
    background: '#F5F7FB',
    surface: '#FFFFFF',
    surfaceMuted: '#EEF2F7',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    primary: '#2563EB',
    primarySoft: '#DBEAFE',
    primaryText: '#FFFFFF',
    danger: '#DC2626',
    dangerSoft: '#FEE2E2',
    success: '#16A34A',
    successSoft: '#DCFCE7',
    warning: '#B45309',
    warningSoft: '#FEF3C7',
    shadow: '#0F172A',
  },
  dark: {
    background: '#0B0F17',
    surface: '#151B26',
    surfaceMuted: '#1E2633',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    border: '#253041',
    primary: '#3B82F6',
    primarySoft: '#1E3A5F',
    primaryText: '#FFFFFF',
    danger: '#F87171',
    dangerSoft: '#3F1D1D',
    success: '#4ADE80',
    successSoft: '#14361F',
    warning: '#FBBF24',
    warningSoft: '#3D2E0A',
    shadow: '#000000',
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
  sm: 8,
  md: 12,
  lg: 18,
  full: 999,
} as const;

export const typography = {
  largeTitle: { fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
  title: { fontSize: 20, fontWeight: '700' },
  body: { fontSize: 16 },
  bodyStrong: { fontSize: 16, fontWeight: '600' },
  caption: { fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
} as const;

/** Kartlar için yumuşak gölge. */
export function cardShadow(colors: ThemeColors): ViewStyle {
  return Platform.select<ViewStyle>({
    android: { elevation: 2 },
    default: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
  });
}
