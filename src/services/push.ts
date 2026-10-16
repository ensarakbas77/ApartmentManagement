import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { Platform } from 'react-native';

import { db } from '@/config/firebase';
import type { UserProfile } from '@/types/user';

/**
 * Bildirimler: her kullanıcının telefonundaki Expo bildirim adresi pushTokens/{uid}'de tutulur.
 * Gönderme, Expo'nun ücretsiz bildirim servisine doğrudan uygulamadan yapılır (sunucu gerekmez).
 * Okuma yetkisi: yönetici/admin herkesinkini, sakin sadece yöneticilerinkini okuyabilir.
 */
const pushTokensCollection = collection(db, 'pushTokens');
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const ANDROID_CHANNEL_ID = 'default';

/** Bildirime dokununca hangi ekranın açılacağını belirler (alıcının rolüne göre çevrilir). */
export type PushTarget =
  | { type: 'announcement'; id: string }
  | { type: 'poll'; id: string }
  | { type: 'issue'; id: string }
  | { type: 'dues' };

export type PushAudience = { kind: 'all' } | { kind: 'managers' } | { kind: 'user'; uid: string };

interface PushMessage {
  title: string;
  body: string;
  target: PushTarget;
}

// Uygulama açıkken gelen bildirimler de üstte görünsün.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Gerçek cihazda, APK içinde mi çalışıyoruz? (Expo Go Android'de uzaktan bildirim desteklemez.) */
export function isPushSupported(): boolean {
  return (
    Platform.OS !== 'web' &&
    Device.isDevice &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient
  );
}

/** İzin ister, bildirim adresini alır ve kullanıcının kaydına yazar. Hata olursa sessizce vazgeçer. */
export async function registerForPushNotifications(profile: UserProfile) {
  if (!isPushSupported()) return;
  try {
    if (Platform.OS === 'android') {
      // Android 13+ izin penceresi ancak bir bildirim kanalı varsa çıkar.
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Apartman bildirimleri',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: '#26215C',
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    await setDoc(doc(pushTokensCollection, profile.uid), {
      token,
      role: profile.role,
      apartmentNo: profile.apartmentNo,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Bildirim kaydı kritik değil; bir sonraki açılışta tekrar denenir.
  }
}

/** Çıkış yaparken bu kullanıcıya bildirim gitmesin diye adresini siler. */
export async function unregisterPushNotifications(uid: string) {
  await deleteDoc(doc(pushTokensCollection, uid)).catch(() => undefined);
}

async function tokensFor(audience: PushAudience): Promise<{ uid: string; token: string }[]> {
  if (audience.kind === 'user') {
    const snap = await getDoc(doc(pushTokensCollection, audience.uid));
    const token = snap.data()?.token;
    return typeof token === 'string' ? [{ uid: snap.id, token }] : [];
  }
  const snap = await getDocs(
    audience.kind === 'managers'
      ? query(pushTokensCollection, where('role', '==', 'manager'))
      : pushTokensCollection,
  );
  return snap.docs
    .map((d) => ({ uid: d.id, token: d.data().token }))
    .filter((t): t is { uid: string; token: string } => typeof t.token === 'string');
}

/**
 * Bildirim gönderir. Asıl işlem (duyuru, anket...) zaten kaydedildiği için hata fırlatmaz;
 * çağıran yer `void sendPush(...)` ile beklemeden devam edebilir.
 * excludeUid: gönderen kişinin kendisine bildirim gitmesin.
 */
export async function sendPush(audience: PushAudience, message: PushMessage, excludeUid?: string) {
  try {
    const recipients = (await tokensFor(audience)).filter((r) => r.uid !== excludeUid);
    if (recipients.length === 0) return;

    const payload = recipients.map((r) => ({
      to: r.token,
      title: message.title,
      body: message.body,
      sound: 'default',
      channelId: ANDROID_CHANNEL_ID,
      data: message.target,
    }));

    // Expo tek istekte en fazla 100 bildirim kabul eder.
    for (let i = 0; i < payload.length; i += 100) {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload.slice(i, i + 100)),
      });
    }
  } catch {
    // Bildirim gönderilemese de asıl işlem başarılı; kullanıcıya hata göstermiyoruz.
  }
}

export function parsePushTarget(data: unknown): PushTarget | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (d.type === 'dues') return { type: 'dues' };
  if ((d.type === 'announcement' || d.type === 'poll' || d.type === 'issue') && typeof d.id === 'string') {
    return { type: d.type, id: d.id };
  }
  return null;
}
