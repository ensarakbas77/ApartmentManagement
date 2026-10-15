import { Stack } from 'expo-router';

import { RoleStack } from '@/components/role-stack';

export default function ManagerLayout() {
  return (
    <RoleStack>
      <Stack.Screen name="announcements/compose" options={{ title: 'Yeni duyuru', presentation: 'modal' }} />
      <Stack.Screen name="announcements/[id]" options={{ title: 'Duyuru' }} />
    </RoleStack>
  );
}
