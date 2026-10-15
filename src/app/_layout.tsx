import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/context/auth-context';

// Oturum kontrol edilip yazı tipleri yüklenene kadar açılış ekranı (splash) görünür kalsın.
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

  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  // Yazı tipi yüklenemezse uygulama sistem yazı tipiyle açılmaya devam eder.
  const ready = !initializing && (fontsLoaded || fontError !== null);

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!fontsLoaded && !fontError) return null;

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
