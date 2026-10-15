import { Platform, useColorScheme, type ViewStyle } from 'react-native';

/** Kategori/bölüm renkleri: her bölüm (aidat, arıza, anket, gider...) kendi tonunu taşır. */
export type TintName = 'indigo' | 'teal' | 'coral' | 'pink' | 'amber' | 'blue';

const palette = {
  light: {
    background: '#F4F4F8',
    surface: '#FFFFFF',
    surfaceMuted: '#EEEEF4',
    text: '#15132B',
    textMuted: '#6B6980',
    border: '#E4E3EC',
    primary: '#534AB7',
    primarySoft: '#EEEDFE',
    primaryText: '#FFFFFF',
    danger: '#D93B3B',
    dangerSoft: '#FCEBEB',
    success: '#1D8A5F',
    successSoft: '#E1F5EE',
    warning: '#B26B0E',
    warningSoft: '#FAEEDA',
    shadow: '#15132B',
    /** Ana sayfa ve giriş ekranındaki koyu üst panel. */
    hero: '#26215C',
    heroText: '#FFFFFF',
    heroMuted: '#AFA9EC',
    heroCard: '#3C3489',
    tabBar: '#26215C',
    tabBarInactive: '#8F88D6',
    tints: {
      indigo: { bg: '#EEEDFE', fg: '#3C3489' },
      teal: { bg: '#E1F5EE', fg: '#085041' },
      coral: { bg: '#FAECE7', fg: '#8A3416' },
      pink: { bg: '#FBEAF0', fg: '#82284A' },
      amber: { bg: '#FAEEDA', fg: '#6E4207' },
      blue: { bg: '#E6F1FB', fg: '#0C447C' },
    } satisfies Record<TintName, { bg: string; fg: string }>,
  },
  dark: {
    background: '#0D0C17',
    surface: '#17152A',
    surfaceMuted: '#221F3A',
    text: '#F2F1FA',
    textMuted: '#A09DB8',
    border: '#2B2846',
    primary: '#8F86F0',
    primarySoft: '#2A2560',
    primaryText: '#FFFFFF',
    danger: '#F27474',
    dangerSoft: '#3D1A1E',
    success: '#4CD3A0',
    successSoft: '#0F3A2C',
    warning: '#F2B347',
    warningSoft: '#3A2A0C',
    shadow: '#000000',
    hero: '#1C1945',
    heroText: '#FFFFFF',
    heroMuted: '#A9A3EA',
    heroCard: '#2C2766',
    tabBar: '#221F4F',
    tabBarInactive: '#8F88D6',
    tints: {
      indigo: { bg: '#2A2560', fg: '#CECBF6' },
      teal: { bg: '#0D3A30', fg: '#9FE1CB' },
      coral: { bg: '#3F2016', fg: '#F5C4B3' },
      pink: { bg: '#3E1A2A', fg: '#F4C0D1' },
      amber: { bg: '#3A2A0C', fg: '#FAC775' },
      blue: { bg: '#0F2D4D', fg: '#B5D4F4' },
    } satisfies Record<TintName, { bg: string; fg: string }>,
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
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

/**
 * Yazı tipi ailesi ağırlığa göre seçilir (Plus Jakarta Sans). Text bileşenimiz
 * fontWeight değerini otomatik olarak doğru aileye çevirir; burada sadece boyut/ağırlık var.
 */
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const typography = {
  largeTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  body: { fontSize: 15 },
  bodyStrong: { fontSize: 15, fontWeight: '600' },
  caption: { fontSize: 13 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
} as const;

/** Kartlar için yumuşak gölge. */
export function cardShadow(colors: ThemeColors): ViewStyle {
  return Platform.select<ViewStyle>({
    android: { elevation: 1 },
    default: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
  });
}
