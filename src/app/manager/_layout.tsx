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
      <Stack.Screen name="issues/index" options={{ title: 'Arıza ve istekler' }} />
      <Stack.Screen name="issues/new" options={{ title: 'Arıza / istek bildir', presentation: 'modal' }} />
      <Stack.Screen name="issues/[id]" options={{ title: 'Talep' }} />
      <Stack.Screen name="expenses/index" options={{ title: 'Giderler' }} />
      <Stack.Screen name="expenses/compose" options={{ title: 'Gider ekle', presentation: 'modal' }} />
      <Stack.Screen name="expenses/[id]" options={{ title: 'Gider' }} />
      <Stack.Screen name="payment-info" options={{ title: 'Ödeme bilgileri', presentation: 'modal' }} />
      <Stack.Screen name="contacts/index" options={{ title: 'Önemli numaralar' }} />
      <Stack.Screen name="contacts/compose" options={{ title: 'Numara ekle', presentation: 'modal' }} />
      <Stack.Screen name="report" options={{ title: 'Yıllık rapor' }} />
    </RoleStack>
  );
}
