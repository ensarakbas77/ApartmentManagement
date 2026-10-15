import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { FloatingTabBar } from '@/components/floating-tab-bar';
import { useThemeColors } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface TabConfig {
  /** (tabs) klasöründeki dosya adı, örn. "index" veya "account". */
  name: string;
  title: string;
  icon: IconName;
  iconFocused: IconName;
  /** Sıfırdan büyükse sekme simgesinde rozet olarak gösterilir. */
  badge?: number;
}

/** Her rolün alt sekme menüsü aynı görünsün diye ortak Tabs bileşeni. */
export function RoleTabs({ tabs }: { tabs: TabConfig[] }) {
  const colors = useThemeColors();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarBadge: tab.badge ? tab.badge : undefined,
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons name={focused ? tab.iconFocused : tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
