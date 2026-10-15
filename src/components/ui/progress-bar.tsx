import { StyleSheet, View } from 'react-native';

import { radius, useThemeColors } from '@/constants/theme';

interface ProgressBarProps {
  /** 0 ile 1 arası. */
  value: number;
  color?: string;
  trackColor?: string;
}

export function ProgressBar({ value, color, trackColor }: ProgressBarProps) {
  const colors = useThemeColors();
  const clamped = Math.min(1, Math.max(0, value));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[styles.track, { backgroundColor: trackColor ?? colors.surfaceMuted }]}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color ?? colors.success }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
