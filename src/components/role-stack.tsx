import { Stack } from 'expo-router';
import type { ReactNode } from 'react';

import { useThemeColors } from '@/constants/theme';

/**
 * Her rol klasörünün dış Stack'i: içinde sekmeler ((tabs) grubu) ve sekmelerin üstüne açılan
 * detay ekranları (örn. kullanıcı detayı, duyuru detayı) bulunur.
 */
export function RoleStack({ children }: { children?: ReactNode }) {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        headerBackTitle: 'Geri',
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="change-password" options={{ title: 'Şifre değiştir' }} />
      {children}
    </Stack>
  );
}
