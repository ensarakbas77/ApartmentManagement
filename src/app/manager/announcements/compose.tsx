import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  AnnouncementError,
  createAnnouncement,
  getAnnouncement,
  updateAnnouncement,
} from '@/services/announcements';
import { ANNOUNCEMENT_BODY_MAX, ANNOUNCEMENT_TITLE_MAX } from '@/types/announcement';

/** Yeni duyuru yazma ve mevcut duyuruyu düzenleme ekranı. ?id= verilirse düzenleme modudur. */
export default function ComposeAnnouncementScreen() {
  const colors = useThemeColors();
  const { profile } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [important, setImportant] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getAnnouncement(id)
      .then((announcement) => {
        if (!announcement) {
          setError('Bu duyuru bulunamadı. Silinmiş olabilir.');
          return;
        }
        setTitle(announcement.title);
        setBody(announcement.body);
        setImportant(announcement.important);
      })
      .catch(() => setError('Duyuru yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    if (!profile) return;
    setError(null);
    setSaving(true);
    try {
      const input = { title, body, important };
      if (id) {
        await updateAnnouncement(id, input);
      } else {
        await createAnnouncement(input, profile);
      }
      router.back();
    } catch (err) {
      setError(err instanceof AnnouncementError ? err.message : 'Duyuru kaydedilemedi.');
      setSaving(false);
    }
  }

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: isEdit ? 'Duyuruyu düzenle' : 'Yeni duyuru' }} />

      {loading ? (
        <SkeletonList />
      ) : (
        <>
          <Card style={styles.section}>
            <TextField
              label="Başlık"
              value={title}
              onChangeText={setTitle}
              placeholder="örn. Su kesintisi"
              autoCapitalize="sentences"
              autoCorrect
              maxLength={ANNOUNCEMENT_TITLE_MAX}
              editable={!saving}
            />
            <TextField
              label="Duyuru metni"
              value={body}
              onChangeText={setBody}
              placeholder="örn. Yarın 10:00 - 12:00 arası bakım nedeniyle su kesintisi olacaktır."
              autoCapitalize="sentences"
              autoCorrect
              multiline
              maxLength={ANNOUNCEMENT_BODY_MAX}
              editable={!saving}
            />
          </Card>

          <Card style={styles.toggleRow}>
            <View style={styles.flex}>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>Önemli duyuru</Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                Listede ve ana sayfada vurgulu gösterilir.
              </Text>
            </View>
            <Switch
              value={important}
              onValueChange={setImportant}
              disabled={saving}
              trackColor={{ true: colors.warning, false: colors.surfaceMuted }}
              thumbColor={colors.surface}
            />
          </Card>

          {error ? <Notice tone="danger" message={error} /> : null}

          <Button
            title={isEdit ? 'Değişiklikleri kaydet' : 'Duyuruyu yayınla'}
            icon={isEdit ? 'checkmark' : 'paper-plane-outline'}
            onPress={handleSave}
            loading={saving}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: {
    marginTop: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
