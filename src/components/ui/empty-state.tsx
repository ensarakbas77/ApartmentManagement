import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography, useThemeColors } from '@/constants/theme';

interface EmptyStateProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Liste boşken gösterilen açıklayıcı ekran. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const colors = useThemeColors();
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.surfaceMuted }]}>
        <Ionicons name={icon} size={32} color={colors.textMuted} />
      </View>
      <Text style={[typography.title, styles.center, { color: colors.text }]}>{title}</Text>
      {description ? (
        <Text style={[typography.body, styles.center, { color: colors.textMuted }]}>{description}</Text>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  center: {
    textAlign: 'center',
  },
  action: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
});
