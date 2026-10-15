import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { useThemeColors } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface TabConfig {
  /** (tabs) klasöründeki dosya adı, örn. "index" veya "account". */
  name: string;
  title: string;
  icon: IconName;
  iconFocused: IconName;
}

/** Her rolün alt sekme menüsü aynı görünsün diye ortak Tabs bileşeni. */
export function RoleTabs({ tabs }: { tabs: TabConfig[] }) {
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons name={focused ? tab.iconFocused : tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
