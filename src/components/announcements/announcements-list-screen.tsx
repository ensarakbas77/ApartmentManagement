import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AnnouncementCard } from '@/components/announcements/announcement-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { spacing, useThemeColors } from '@/constants/theme';
import { useUnreadAnnouncements } from '@/hooks/use-unread-announcements';
import { firestoreErrorMessage } from '@/lib/firestore-errors';
import { subscribeToAnnouncements } from '@/services/announcements';
import type { Announcement } from '@/types/announcement';

interface AnnouncementsListScreenProps {
  onOpen: (id: string) => void;
  /** Verilirse "yeni duyuru" butonları görünür (sadece yönetici). */
  onCreate?: () => void;
}

/** Yönetici ve sakin için ortak duyuru listesi. Liste canlıdır; yeni duyuru anında görünür. */
export function AnnouncementsListScreen({ onOpen, onCreate }: AnnouncementsListScreenProps) {
  const colors = useThemeColors();
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { unreadIds } = useUnreadAnnouncements();

  useEffect(
    () =>
      subscribeToAnnouncements(
        (list) => {
          setAnnouncements(list);
          setError(null);
        },
        (err) => setError(firestoreErrorMessage(err, 'Duyurular yüklenemedi')),
      ),
    [],
  );

  return (
    <Screen
      title="Duyurular"
      headerRight={
        onCreate ? (
          <IconButton icon="add" accessibilityLabel="Yeni duyuru yaz" onPress={onCreate} />
        ) : undefined
      }>
      {error ? <Notice tone="danger" message={error} /> : null}

      {announcements === null && !error ? (
        <SkeletonList />
      ) : null}

      {announcements?.length === 0 ? (
        <EmptyState
          icon="megaphone-outline"
          title="Henüz duyuru yok"
          description={
            onCreate
              ? 'Su kesintisi, toplantı gibi bilgileri buradan tüm sakinlere duyurabilirsiniz.'
              : 'Yönetici bir duyuru yayınladığında burada görünecek.'
          }
          action={
            onCreate ? <Button title="İlk duyuruyu yaz" icon="create-outline" onPress={onCreate} /> : null
          }
        />
      ) : null}

      {announcements?.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          isNew={unreadIds.has(announcement.id)}
          onPress={() => onOpen(announcement.id)}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: spacing.xl,
  },
});
