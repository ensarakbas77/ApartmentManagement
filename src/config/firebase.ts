import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// EXPO_PUBLIC_ ile başlayan değişkenler derleme sırasında koda gömülür.
// Bu yüzden her biri process.env.XXX şeklinde tek tek (statik) okunmalı.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  throw new Error(
    `Firebase ayarları eksik: ${missingKeys.join(', ')}. ` +
      '.env dosyasını .env.example dosyasına göre doldurup Expo sunucusunu yeniden başlatın.',
  );
}

// Hızlı yenileme (fast refresh) sırasında uygulamanın iki kez başlatılmasını engelle.
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function createAuth(): Auth {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }
  try {
    // Oturumu telefonda sakla: uygulama kapatılıp açılınca tekrar giriş istenmez.
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Auth zaten başlatılmışsa (fast refresh) mevcut örneği kullan.
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
// Storage, Firebase'in Blaze planında etkinleşir (fatura/arıza fotoğrafları için).
export const storage = getStorage(app);
