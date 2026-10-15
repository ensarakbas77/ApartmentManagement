import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { radius, spacing, useThemeColors } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;

  const variants = {
    primary: { background: colors.primary, text: colors.primaryText, border: colors.primary },
    secondary: { background: colors.surface, text: colors.text, border: colors.border },
    danger: { background: colors.dangerSoft, text: colors.danger, border: colors.dangerSoft },
  } as const;
  const v = variants[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.background, borderColor: v.border },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={20} color={v.text} /> : null}
          <Text style={[styles.title, { color: v.text }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
});
