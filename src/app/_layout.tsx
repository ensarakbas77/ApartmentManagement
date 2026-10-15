import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/context/auth-context';

// Oturum kontrol edilene kadar açılış ekranı (splash) görünür kalsın.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { initializing, profile } = useAuth();
  const role = profile?.role;

  useEffect(() => {
    if (!initializing) {
      void SplashScreen.hideAsync();
    }
  }, [initializing]);

  // Stack.Protected: guard false olan ekranlara gidilemez; gidilmeye çalışılırsa
  // "index" ekranına yönlendirilir, o da kullanıcıyı rolüne uygun panele gönderir.
  // Not: Bu sadece arayüz korumasıdır. Asıl güvenlik firestore.rules dosyasındadır.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />

      <Stack.Protected guard={!profile}>
        <Stack.Screen name="login" />
      </Stack.Protected>

      <Stack.Protected guard={role === 'admin'}>
        <Stack.Screen name="admin" />
      </Stack.Protected>

      <Stack.Protected guard={role === 'manager'}>
        <Stack.Screen name="manager" />
      </Stack.Protected>

      <Stack.Protected guard={role === 'resident'}>
        <Stack.Screen name="resident" />
      </Stack.Protected>
    </Stack>
  );
}
