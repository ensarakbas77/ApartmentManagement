import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { radius, spacing, useThemeColors } from '@/constants/theme';
import { selectionFeedback } from '@/lib/haptics';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** Altta, sayfa zemininin üstünde yüzen hap şeklinde koyu sekme çubuğu. */
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, spacing.sm) + 4 },
      ]}>
      <View style={[styles.bar, { backgroundColor: colors.tabBar }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const color = focused ? colors.heroText : colors.tabBarInactive;

          function onPress() {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              selectionFeedback();
              navigation.navigate(route.name, route.params);
            }
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={styles.item}>
              <View style={[styles.iconPill, focused && { backgroundColor: colors.heroCard }]}>
                {options.tabBarIcon?.({ focused, color, size: 22 })}
                {options.tabBarBadge !== undefined ? (
                  <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.tabBar }]}>
                    <Text style={styles.badgeText}>{options.tabBarBadge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.label, { color }, focused && styles.labelFocused]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: radius.xl,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  iconPill: {
    width: 48,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  labelFocused: {
    fontWeight: '700',
  },
});
