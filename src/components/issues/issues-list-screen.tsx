import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IssueStatusChip } from '@/components/issues/issue-status-chip';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { SkeletonList } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { formatRelativeDate } from '@/lib/date';
import { subscribeToIssues } from '@/services/issues';
import { ISSUE_CATEGORY_INFO, type Issue } from '@/types/issue';

type Filter = 'active' | 'resolved' | 'all';

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: 'active', label: 'Bekleyen' },
  { value: 'resolved', label: 'Çözülen' },
  { value: 'all', label: 'Tümü' },
];

interface IssuesListScreenProps {
  onOpen: (id: string) => void;
  /** Verilmezse (örn. dairesi olmayan kullanıcı) yeni talep butonu gösterilmez. */
  onCreate?: () => void;
}

/** Yönetici ve sakin için ortak arıza/istek listesi. Talepler şeffaflık için herkese açıktır. */
export function IssuesListScreen({ onOpen, onCreate }: IssuesListScreenProps) {
  const colors = useThemeColors();
  const { profile } = useAuth();
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [filter, setFilter] = useState<Filter>('active');
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeToIssues(
        (list) => {
          setIssues(list);
          setError(null);
        },
        () => setError('Talepler yüklenemedi. İnternet bağlantınızı kontrol edin.'),
      ),
    [],
  );

  const visible = useMemo(() => {
    if (!issues) return null;
    if (filter === 'active') return issues.filter((i) => i.status !== 'resolved');
    if (filter === 'resolved') return issues.filter((i) => i.status === 'resolved');
    return issues;
  }, [issues, filter]);

  const canCreate = Boolean(onCreate) && profile?.apartmentNo != null;

  return (
    <Screen edges={['bottom']}>
      {canCreate ? (
        <Button title="Yeni arıza / istek bildir" icon="add-circle-outline" onPress={() => onCreate?.()} />
      ) : null}

      <SegmentedControl options={FILTER_OPTIONS} value={filter} onChange={setFilter} />

      {error ? <Notice tone="danger" message={error} /> : null}

      {visible === null && !error ? <SkeletonList /> : null}

      {visible?.length === 0 ? (
        <EmptyState
          icon={filter === 'resolved' ? 'checkmark-done-outline' : 'construct-outline'}
          title={filter === 'active' ? 'Bekleyen talep yok' : filter === 'resolved' ? 'Çözülen talep yok' : 'Henüz talep yok'}
          description={
            filter === 'active'
              ? 'Asansör, aydınlatma gibi bir sorun gördüğünüzde buradan bildirebilirsiniz.'
              : undefined
          }
        />
      ) : null}

      {visible?.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          isMine={issue.reporterUid === profile?.uid}
          onPress={() => onOpen(issue.id)}
        />
      ))}
    </Screen>
  );
}

function IssueCard({ issue, isMine, onPress }: { issue: Issue; isMine: boolean; onPress: () => void }) {
  const colors = useThemeColors();
  const category = ISSUE_CATEGORY_INFO[issue.category];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${issue.title}, ${category.label}`}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name={category.icon} size={20} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={2}>
              {issue.title}
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
              {category.label}
              {issue.location ? ` · ${issue.location}` : ''}
            </Text>
          </View>
        </View>

        {issue.managerNote ? (
          <View style={[styles.note, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.textMuted} />
            <Text style={[typography.caption, styles.flex, { color: colors.text }]} numberOfLines={2}>
              {issue.managerNote}
            </Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <IssueStatusChip status={issue.status} />
          <Text style={[typography.caption, styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
            {isMine ? 'Sizin talebiniz' : `Daire ${issue.apartmentNo}`} · {formatRelativeDate(issue.createdAt)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  loading: {
    marginTop: spacing.xl,
  },
  card: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  meta: {
    flex: 1,
    textAlign: 'right',
  },
});
