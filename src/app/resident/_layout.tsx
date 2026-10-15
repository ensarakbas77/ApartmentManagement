import { Stack } from 'expo-router';

import { RoleStack } from '@/components/role-stack';

export default function ResidentLayout() {
  return (
    <RoleStack>
      <Stack.Screen name="announcements/[id]" options={{ title: 'Duyuru' }} />
    </RoleStack>
  );
}
