import { Stack } from 'expo-router';

import { RoleStack } from '@/components/role-stack';

export default function ManagerLayout() {
  return (
    <RoleStack>
      <Stack.Screen name="announcements/compose" options={{ title: 'Yeni duyuru', presentation: 'modal' }} />
      <Stack.Screen name="announcements/[id]" options={{ title: 'Duyuru' }} />
      <Stack.Screen name="dues/new" options={{ title: 'Yeni aidat dönemi', presentation: 'modal' }} />
      <Stack.Screen name="dues/[periodId]" options={{ title: 'Aidat dönemi' }} />
      <Stack.Screen name="polls/new" options={{ title: 'Yeni anket', presentation: 'modal' }} />
      <Stack.Screen name="polls/[id]" options={{ title: 'Anket' }} />
    </RoleStack>
  );
}
