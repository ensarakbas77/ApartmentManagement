import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { IbanCard } from '@/components/iban-card';
import { Notice } from '@/components/ui/notice';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { spacing, typography, useThemeColors } from '@/constants/theme';
import { firestoreErrorMessage } from '@/lib/firestore-errors';
import { formatMoney } from '@/lib/money';
import { subscribeToAllDues, subscribeToPeriods, summarizeDues } from '@/services/dues';
import { formatPeriod, type Due, type DuePeriod } from '@/types/dues';

export default function ManagerDuesScreen() {
  const colors = useThemeColors();
  const [periods, setPeriods] = useState<DuePeriod[] | null>(null);
  const [dues, setDues] = useState<Due[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onError = (err: Error) => setError(firestoreErrorMessage(err, 'Aidatlar yüklenemedi'));
    const stopPeriods = subscribeToPeriods(setPeriods, onError);
    const stopDues = subscribeToAllDues(setDues, onError);
    return () => {
      stopPeriods();
      stopDues();
    };
  }, []);

  const duesByPeriod = useMemo(() => {
    const map = new Map<string, Due[]>();
    for (const due of dues) {
      map.set(due.periodId, [...(map.get(due.periodId) ?? []), due]);
    }
    return map;
  }, [dues]);

  const overall = useMemo(() => summarizeDues(dues), [dues]);
  const openCreate = () => router.push('/manager/dues/new');

  return (
    <Screen
      title="Aidatlar"
      headerRight={<IconButton icon="add" accessibilityLabel="Yeni aidat dönemi aç" onPress={openCreate} />}>
      {error ? <Notice tone="danger" message={error} /> : null}

      {periods === null && !error ? <SkeletonList /> : null}

      {periods && periods.length > 0 ? (
        <Card style={styles.summary}>
          <Text style={[typography.label, { color: colors.textMuted }]}>TOPLAM BEKLEYEN AİDAT</Text>
          <Text
            style={[
              styles.summaryAmount,
              { color: overall.outstanding > 0 ? colors.danger : colors.success },
            ]}>
            {formatMoney(overall.outstanding)}
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            Bugüne kadar tahsil edilen: {formatMoney(overall.collected)}
          </Text>
        </Card>
      ) : null}

      <IbanCard onEdit={() => router.push('/manager/payment-info')} />

      {periods?.length === 0 ? (
        <EmptyState
          icon="wallet-outline"
          title="Henüz aidat dönemi yok"
          description="Bir ay için aidat dönemi açtığınızda tüm daireler için ödeme kaydı oluşur."
          action={<Button title="İlk dönemi aç" icon="add-circle-outline" onPress={openCreate} />}
        />
      ) : null}

      {periods?.map((period) => (
        <PeriodCard key={period.id} period={period} dues={duesByPeriod.get(period.id) ?? []} />
      ))}
    </Screen>
  );
}

function PeriodCard({ period, dues }: { period: DuePeriod; dues: Due[] }) {
  const colors = useThemeColors();
  const summary = summarizeDues(dues);
  const complete = summary.count > 0 && summary.paidCount === summary.count;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formatPeriod(period.year, period.month)}, ${summary.paidCount} daire ödedi`}
      onPress={() =>
        router.push({ pathname: '/manager/dues/[periodId]', params: { periodId: period.id } })
      }
      style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.periodCard}>
        <View style={styles.periodHeader}>
          <View style={styles.flex}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>
              {formatPeriod(period.year, period.month)}
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              Daire başı {formatMoney(period.amount)}
            </Text>
          </View>
          {complete ? <Ionicons name="checkmark-circle" size={22} color={colors.success} /> : null}
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        <ProgressBar value={summary.count ? summary.paidCount / summary.count : 0} />

        <View style={styles.periodFooter}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {summary.paidCount}/{summary.count} daire ödedi
          </Text>
          <Text style={[typography.caption, styles.bold, { color: colors.text }]}>
            {formatMoney(summary.collected)} / {formatMoney(summary.total)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  pressed: { opacity: 0.85 },
  loading: {
    marginTop: spacing.xl,
  },
  summary: {
    gap: spacing.xs,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  periodCard: {
    gap: spacing.sm,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  periodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
