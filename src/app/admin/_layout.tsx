import { Stack } from 'expo-router';

import { RoleStack } from '@/components/role-stack';

export default function AdminLayout() {
  return (
    <RoleStack>
      <Stack.Screen name="users/new" options={{ title: 'Yeni kullanıcı', presentation: 'modal' }} />
      <Stack.Screen name="users/[uid]" options={{ title: 'Kullanıcı' }} />
    </RoleStack>
  );
}
