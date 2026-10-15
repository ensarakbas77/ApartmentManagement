import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { formatPeriod } from '@/types/dues';

interface MonthSwitcherProps {
  year: number;
  /** 1-12 */
  month: number;
  onChange: (year: number, month: number) => void;
  /** true ise bu aydan sonrasına geçilemez. */
  disableFuture?: boolean;
}

/** "‹  Ekim 2026  ›" ay seçici. */
export function MonthSwitcher({ year, month, onChange, disableFuture = false }: MonthSwitcherProps) {
  const colors = useThemeColors();
  const now = new Date();
  const isCurrentOrLater = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);

  function shift(delta: number) {
    const date = new Date(year, month - 1 + delta, 1);
    onChange(date.getFullYear(), date.getMonth() + 1);
  }

  return (
    <View style={styles.row}>
      <Arrow icon="chevron-back" label="Önceki ay" onPress={() => shift(-1)} />
      <Text style={[typography.title, styles.label, { color: colors.text }]}>{formatPeriod(year, month)}</Text>
      <Arrow
        icon="chevron-forward"
        label="Sonraki ay"
        onPress={() => shift(1)}
        disabled={disableFuture && isCurrentOrLater}
      />
    </View>
  );
}

function Arrow({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: 'chevron-back' | 'chevron-forward';
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.arrow,
        { backgroundColor: colors.surfaceMuted },
        (pressed || disabled) && { opacity: disabled ? 0.35 : 0.7 },
      ]}>
      <Ionicons name={icon} size={22} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  label: {
    flex: 1,
    textAlign: 'center',
  },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
