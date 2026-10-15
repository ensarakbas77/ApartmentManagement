import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import { useAuth } from '@/context/auth-context';
import {
  getReadStoreVersion,
  isAnnouncementRead,
  isReadStoreLoaded,
  loadReadAnnouncements,
  seedIfFirstRun,
  subscribeReadStore,
} from '@/lib/read-announcements';
import { subscribeToAnnouncements } from '@/services/announcements';
import type { Announcement } from '@/types/announcement';

/** Bu telefonda henüz açılmamış duyuruların kimlikleri ve sayısı. */
export function useUnreadAnnouncements() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const version = useSyncExternalStore(subscribeReadStore, getReadStoreVersion);

  useEffect(() => {
    if (uid) void loadReadAnnouncements(uid);
  }, [uid]);

  useEffect(() => subscribeToAnnouncements(setAnnouncements, () => setAnnouncements([])), []);

  useEffect(() => {
    if (announcements && isReadStoreLoaded()) seedIfFirstRun(announcements.map((a) => a.id));
  }, [announcements, version]);

  return useMemo(() => {
    if (!announcements || !isReadStoreLoaded()) return { unreadIds: new Set<string>(), count: 0 };
    const unreadIds = new Set(
      announcements
        // Kişinin kendi yazdığı duyuru yeni sayılmaz.
        .filter((a) => a.authorUid !== uid && !isAnnouncementRead(a.id))
        .map((a) => a.id),
    );
    return { unreadIds, count: unreadIds.size };
    // "version", okunanlar listesi değiştiğinde yeniden hesaplatmak için bağımlılıklarda.
  }, [announcements, version, uid]);
}
