import { Stack } from 'expo-router';

import { RoleStack } from '@/components/role-stack';

export default function ResidentLayout() {
  return (
    <RoleStack>
      <Stack.Screen name="announcements/[id]" options={{ title: 'Duyuru' }} />
      <Stack.Screen name="polls/[id]" options={{ title: 'Anket' }} />
      <Stack.Screen name="issues/index" options={{ title: 'Arıza ve istekler' }} />
      <Stack.Screen name="issues/new" options={{ title: 'Arıza / istek bildir', presentation: 'modal' }} />
      <Stack.Screen name="issues/[id]" options={{ title: 'Talep' }} />
      <Stack.Screen name="expenses/index" options={{ title: 'Giderler' }} />
      <Stack.Screen name="expenses/[id]" options={{ title: 'Gider' }} />
      <Stack.Screen name="contacts" options={{ title: 'Önemli numaralar' }} />
      <Stack.Screen name="report" options={{ title: 'Yıllık rapor' }} />
    </RoleStack>
  );
}
