import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Card } from '@/components/ui/card';
import { radius, spacing, useThemeColors } from '@/constants/theme';

/** Yüklenirken içeriğin yerini tutan, yavaşça yanıp sönen gri kutu. */
export function Skeleton({
  width = '100%',
  height = 14,
  rounded = radius.sm,
}: {
  width?: DimensionValue;
  height?: number;
  rounded?: number;
}) {
  const colors = useThemeColors();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: rounded, backgroundColor: colors.surfaceMuted }, animated]}
    />
  );
}

/** Liste ekranları için iskelet: birkaç kart şeklinde yer tutucu. */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View accessible accessibilityLabel="Yükleniyor" style={styles.list}>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} style={styles.card}>
          <View style={styles.row}>
            <Skeleton width={40} height={40} rounded={radius.sm} />
            <View style={styles.lines}>
              <Skeleton width="70%" height={14} />
              <Skeleton width="45%" height={12} />
            </View>
          </View>
          <Skeleton width="90%" height={12} />
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  lines: {
    flex: 1,
    gap: spacing.sm,
  },
});
