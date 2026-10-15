import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { spacing, typography, useThemeColors } from '@/constants/theme';

interface ScreenProps {
  title?: string;
  subtitle?: string;
  /** Başlığın sağında gösterilecek buton vb. */
  headerRight?: ReactNode;
  children: ReactNode;
  /** false ise içerik kaydırılmaz (FlatList gibi kendi kaydıran içerikler için). */
  scroll?: boolean;
  edges?: Edge[];
}

/** Tüm ekranların ortak kabuğu: güvenli alan, arka plan ve büyük başlık. */
export function Screen({
  title,
  subtitle,
  headerRight,
  children,
  scroll = true,
  edges = ['top'],
}: ScreenProps) {
  const colors = useThemeColors();

  const header = title ? (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={[typography.largeTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[typography.body, { color: colors.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      {headerRight}
    </View>
  ) : null;

  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.flex]}>
          {header}
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
});
