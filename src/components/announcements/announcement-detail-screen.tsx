import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { formatFullDate } from '@/lib/date';
import { deleteAnnouncement, subscribeToAnnouncement } from '@/services/announcements';
import type { Announcement } from '@/types/announcement';

interface AnnouncementDetailScreenProps {
  id: string;
  /** Verilirse düzenle/sil butonları görünür (sadece yönetici). */
  onEdit?: () => void;
}

export function AnnouncementDetailScreen({ id, onEdit }: AnnouncementDetailScreenProps) {
  const colors = useThemeColors();
  // undefined: yükleniyor, null: bulunamadı / silindi
  const [announcement, setAnnouncement] = useState<Announcement | null | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => subscribeToAnnouncement(id, setAnnouncement, () => setError('Duyuru yüklenemedi.')),
    [id],
  );

  if ((announcement === undefined && !error) || (!announcement && deleting)) {
    return (
      <Screen edges={['bottom']}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }

  if (!announcement) {
    return (
      <Screen edges={['bottom']}>
        <Notice tone="warning" message={error ?? 'Bu duyuru bulunamadı. Silinmiş olabilir.'} />
        <Button title="Geri dön" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  function confirmDelete() {
    Alert.alert('Duyuruyu sil', 'Bu duyuru tüm sakinlerden kaldırılacak. Emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          setError(null);
          setDeleting(true);
          try {
            await deleteAnnouncement(id);
            router.back();
          } catch {
            setError('Duyuru silinemedi.');
            setDeleting(false);
          }
        },
      },
    ]);
  }

  return (
    <Screen edges={['bottom']}>
      <Card style={styles.card}>
        {announcement.important ? (
          <View style={[styles.importantBadge, { backgroundColor: colors.warningSoft }]}>
            <Ionicons name="alert-circle" size={16} color={colors.warning} />
            <Text style={[styles.importantText, { color: colors.warning }]}>Önemli duyuru</Text>
          </View>
        ) : null}

        <Text style={[typography.title, { color: colors.text }]} selectable>
          {announcement.title}
        </Text>

        <View style={styles.meta}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {announcement.authorName} · {formatFullDate(announcement.createdAt)}
          </Text>
          {announcement.updatedAt ? (
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              Düzenlendi: {formatFullDate(announcement.updatedAt)}
            </Text>
          ) : null}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.body, { color: colors.text }]} selectable>
          {announcement.body}
        </Text>
      </Card>

      {error ? <Notice tone="danger" message={error} /> : null}

      {onEdit ? (
        <View style={styles.actions}>
          <Button title="Düzenle" icon="create-outline" variant="secondary" onPress={onEdit} disabled={deleting} />
          <Button
            title="Sil"
            icon="trash-outline"
            variant="danger"
            onPress={confirmDelete}
            loading={deleting}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: spacing.xl,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  importantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  importantText: {
    fontSize: 13,
    fontWeight: '700',
  },
  meta: {
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    gap: spacing.sm,
  },
});
