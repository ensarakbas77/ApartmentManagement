import { router } from 'expo-router';
import type { NotificationResponse } from 'expo-notifications';
import { useEffect, useRef } from 'react';

import {
  getNotifications,
  parsePushTarget,
  registerForPushNotifications,
  type PushTarget,
} from '@/services/push';
import type { UserProfile, UserRole } from '@/types/user';

/** Bildirim hedefini alıcının rolüne uygun ekrana götürür. Admin'in bu ekranları yok. */
function openTarget(role: UserRole, target: PushTarget) {
  if (role === 'manager') {
    switch (target.type) {
      case 'announcement':
        return router.push({ pathname: '/manager/announcements/[id]', params: { id: target.id } });
      case 'poll':
        return router.push({ pathname: '/manager/polls/[id]', params: { id: target.id } });
      case 'issue':
        return router.push({ pathname: '/manager/issues/[id]', params: { id: target.id } });
      case 'dues':
        return router.navigate('/manager/dues');
    }
  }
  if (role === 'resident') {
    switch (target.type) {
      case 'announcement':
        return router.push({ pathname: '/resident/announcements/[id]', params: { id: target.id } });
      case 'poll':
        return router.push({ pathname: '/resident/polls/[id]', params: { id: target.id } });
      case 'issue':
        return router.push({ pathname: '/resident/issues/[id]', params: { id: target.id } });
      case 'dues':
        return router.navigate('/resident/dues');
    }
  }
}

/**
 * Oturum açan kullanıcıyı bildirimlere kaydeder ve bildirime dokunulunca ilgili ekranı açar
 * (uygulama kapalıyken dokunulup açıldıysa da). Geçici şifresini değiştirmemiş kullanıcıda beklemede kalır.
 * Expo Go'da (bildirim desteği yok) hiçbir şey yapmaz.
 */
export function usePushNotifications(profile: UserProfile | null) {
  const ready = profile !== null && !profile.mustChangePassword;
  const uid = profile?.uid;
  const role = profile?.role;
  const handledIds = useRef(new Set<string>());

  // Profil nesnesi her güncellemede değişir; kayıt sadece kullanıcı veya rolü değişince
  // yapılsın diye güncel profil bir ref'te tutulur (rol, "yöneticilere bildir" için kayıtta saklanıyor).
  const profileRef = useRef(profile);
  profileRef.current = profile;

  useEffect(() => {
    if (ready && profileRef.current) void registerForPushNotifications(profileRef.current);
  }, [ready, uid, role]);

  useEffect(() => {
    const Notifications = getNotifications();
    if (!ready || !role || !Notifications) return;

    function handle(response: NotificationResponse | null) {
      if (!response || !role || !Notifications) return;
      if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
      const id = response.notification.request.identifier;
      if (handledIds.current.has(id)) return;
      handledIds.current.add(id);
      const target = parsePushTarget(response.notification.request.content.data);
      if (target) openTarget(role, target);
    }

    // Uygulama kapalıyken bildirime dokunulup açıldıysa.
    void Notifications.getLastNotificationResponseAsync().then(handle);
    // Uygulama açıkken ya da arka plandayken dokunulursa.
    const subscription = Notifications.addNotificationResponseReceivedListener(handle);
    return () => subscription.remove();
  }, [ready, role]);
}
