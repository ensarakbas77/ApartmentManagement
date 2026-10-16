import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { IssueStatusChip, issueStatusTone } from '@/components/issues/issue-status-chip';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { SkeletonList } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { formatFullDate } from '@/lib/date';
import { deleteIssue, IssueError, subscribeToIssue, updateIssueStatus } from '@/services/issues';
import {
  ISSUE_CATEGORY_INFO,
  ISSUE_NOTE_MAX,
  ISSUE_STATUS_LABELS,
  ISSUE_STATUSES,
  type Issue,
  type IssueStatus,
} from '@/types/issue';

const STATUS_OPTIONS = ISSUE_STATUSES.map((value) => ({ value, label: ISSUE_STATUS_LABELS[value] }));

interface IssueDetailScreenProps {
  id: string;
  /** true ise durum güncelleme ve not alanı gösterilir (sadece yönetici). */
  canManage?: boolean;
}

export function IssueDetailScreen({ id, canManage = false }: IssueDetailScreenProps) {
  const colors = useThemeColors();
  const { profile } = useAuth();

  // undefined: yükleniyor, null: bulunamadı / silindi
  const [issue, setIssue] = useState<Issue | null | undefined>(undefined);
  const [status, setStatus] = useState<IssueStatus>('open');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeToIssue(id, setIssue, () => setError('Talep yüklenemedi.')), [id]);

  // Talep yüklenince/güncellenince yönetici formunu kayıtlı değerlerle doldur.
  useEffect(() => {
    if (!issue) return;
    setStatus(issue.status);
    setNote(issue.managerNote);
  }, [issue]);

  if ((issue === undefined && !error) || (!issue && busy === 'delete')) {
    return (
      <Screen edges={['bottom']}>
        <SkeletonList />
      </Screen>
    );
  }

  if (!issue) {
    return (
      <Screen edges={['bottom']}>
        <Notice tone="warning" message={error ?? 'Bu talep bulunamadı. Silinmiş olabilir.'} />
        <Button title="Geri dön" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const current = issue;
  const category = ISSUE_CATEGORY_INFO[current.category];
  const isMine = current.reporterUid === profile?.uid;
  const canDelete = canManage || (isMine && current.status === 'open');
  const dirty = status !== current.status || note.trim() !== current.managerNote;
  const tone = issueStatusTone(current.status, colors);

  async function handleSave() {
    setError(null);
    setBusy('save');
    try {
      await updateIssueStatus(current, status, note);
    } catch (err) {
      setError(err instanceof IssueError ? err.message : 'Talep güncellenemedi.');
    } finally {
      setBusy(null);
    }
  }

  function confirmDelete() {
    Alert.alert('Talebi sil', 'Bu talep kalıcı olarak silinecek. Emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          setError(null);
          setBusy('delete');
          try {
            await deleteIssue(current.id);
            router.back();
          } catch {
            setError('Talep silinemedi.');
            setBusy(null);
          }
        },
      },
    ]);
  }

  return (
    <Screen edges={['bottom']}>
      <Card style={styles.header}>
        <View style={styles.headerRow}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name={category.icon} size={24} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={[typography.caption, { color: colors.textMuted }]}>{category.label}</Text>
            <IssueStatusChip status={current.status} />
          </View>
        </View>
        <Text style={[typography.title, { color: colors.text }]} selectable>
          {current.title}
        </Text>
        {current.location ? (
          <View style={styles.inline}>
            <Ionicons name="location-outline" size={16} color={colors.textMuted} />
            <Text style={[typography.body, { color: colors.textMuted }]}>{current.location}</Text>
          </View>
        ) : null}
        {current.description ? (
          <Text style={[styles.body, { color: colors.text }]} selectable>
            {current.description}
          </Text>
        ) : null}
      </Card>

      {current.managerNote && !canManage ? (
        <Card style={[styles.noteCard, { backgroundColor: tone.bg, borderColor: 'transparent' }]}>
          <Text style={[typography.label, { color: tone.fg }]}>YÖNETİCİ NOTU</Text>
          <Text style={[typography.body, { color: colors.text }]}>{current.managerNote}</Text>
        </Card>
      ) : null}

      <Card style={styles.section}>
        <Text style={[typography.label, { color: colors.textMuted }]}>GEÇMİŞ</Text>
        <TimelineRow
          icon="flag-outline"
          title={`Bildirildi · ${isMine ? 'Siz' : `Daire ${current.apartmentNo}`}`}
          subtitle={`${current.reporterName} · ${formatFullDate(current.createdAt)}`}
        />
        {current.updatedAt && current.status !== 'resolved' ? (
          <TimelineRow
            icon="construct-outline"
            title={`Durum: ${ISSUE_STATUS_LABELS[current.status]}`}
            subtitle={formatFullDate(current.updatedAt)}
          />
        ) : null}
        {current.resolvedAt ? (
          <TimelineRow
            icon="checkmark-circle-outline"
            title="Çözüldü"
            subtitle={formatFullDate(current.resolvedAt)}
            color={colors.success}
          />
        ) : null}
      </Card>

      {canManage ? (
        <Card style={styles.section}>
          <Text style={[typography.label, { color: colors.textMuted }]}>DURUMU GÜNCELLE</Text>
          <SegmentedControl options={STATUS_OPTIONS} value={status} onChange={setStatus} disabled={busy !== null} />
          <TextField
            label="Sakinlere not (isteğe bağlı)"
            value={note}
            onChangeText={setNote}
            placeholder="örn. Usta perşembe günü gelecek."
            autoCapitalize="sentences"
            autoCorrect
            multiline
            maxLength={ISSUE_NOTE_MAX}
            editable={busy === null}
          />
          <Button
            title="Kaydet"
            icon="checkmark"
            onPress={handleSave}
            loading={busy === 'save'}
            disabled={!dirty || busy !== null}
          />
        </Card>
      ) : null}

      {error ? <Notice tone="danger" message={error} /> : null}

      {canDelete ? (
        <Button
          title="Talebi sil"
          icon="trash-outline"
          variant="danger"
          onPress={confirmDelete}
          disabled={busy !== null}
        />
      ) : null}
    </Screen>
  );
}

function TimelineRow({
  icon,
  title,
  subtitle,
  color,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  color?: string;
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.timelineRow}>
      <Ionicons name={icon} size={20} color={color ?? colors.textMuted} />
      <View style={styles.flex}>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>{title}</Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 4 },
  loading: {
    marginTop: spacing.xl,
  },
  header: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  noteCard: {
    gap: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
});
