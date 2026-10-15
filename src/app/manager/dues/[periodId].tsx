import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { DueStatusChip } from '@/components/dues/due-status-chip';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { spacing, typography, useThemeColors } from '@/constants/theme';
import { formatRelativeDate } from '@/lib/date';
import { formatMoney } from '@/lib/money';
import {
  deletePeriod,
  markDuePaid,
  markDueUnpaid,
  subscribeToPeriod,
  subscribeToPeriodDues,
  summarizeDues,
} from '@/services/dues';
import { subscribeToUsers } from '@/services/users';
import { formatPeriod, PAYMENT_METHOD_LABELS, type Due, type DuePeriod, type PaymentMethod } from '@/types/dues';
import type { UserProfile } from '@/types/user';

export default function DuePeriodDetailScreen() {
  const colors = useThemeColors();
  const { periodId } = useLocalSearchParams<{ periodId: string }>();

  // undefined: yükleniyor, null: bulunamadı / silindi
  const [period, setPeriod] = useState<DuePeriod | null | undefined>(undefined);
  const [dues, setDues] = useState<Due[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [busyDueId, setBusyDueId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onError = () => setError('Aidat bilgileri yüklenemedi.');
    const stops = [
      subscribeToPeriod(periodId, setPeriod, onError),
      subscribeToPeriodDues(periodId, setDues, onError),
      subscribeToUsers(setUsers, () => undefined),
    ];
    return () => stops.forEach((stop) => stop());
  }, [periodId]);

  // Daire numarasına göre o dairede kayıtlı kişilerin adları.
  const residentsByApartment = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const user of users) {
      if (user.apartmentNo === null) continue;
      map.set(user.apartmentNo, [...(map.get(user.apartmentNo) ?? []), user.displayName]);
    }
    return map;
  }, [users]);

  const summary = summarizeDues(dues);

  if ((period === undefined && !error) || (!period && deleting)) {
    return (
      <Screen edges={['bottom']}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }

  if (!period) {
    return (
      <Screen edges={['bottom']}>
        <Notice tone="warning" message={error ?? 'Bu aidat dönemi bulunamadı. Silinmiş olabilir.'} />
        <Button title="Geri dön" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const periodName = formatPeriod(period.year, period.month);

  async function run(dueId: string, action: () => Promise<void>) {
    setError(null);
    setBusyDueId(dueId);
    try {
      await action();
    } catch {
      setError('İşlem kaydedilemedi. İnternet bağlantınızı kontrol edin.');
    } finally {
      setBusyDueId(null);
    }
  }

  function openDueActions(due: Due) {
    const title = `Daire ${due.apartmentNo} · ${periodName}`;
    if (due.paid) {
      Alert.alert(title, `${formatMoney(due.amount)} ödendi olarak kayıtlı.`, [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Ödenmedi yap',
          style: 'destructive',
          onPress: () => void run(due.id, () => markDueUnpaid(due.id)),
        },
      ]);
      return;
    }
    const pay = (method: PaymentMethod) => () => void run(due.id, () => markDuePaid(due.id, method));
    Alert.alert(title, `${formatMoney(due.amount)} nasıl ödendi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: PAYMENT_METHOD_LABELS.cash, onPress: pay('cash') },
      { text: PAYMENT_METHOD_LABELS.transfer, onPress: pay('transfer') },
    ]);
  }

  function confirmDelete() {
    Alert.alert(
      'Dönemi sil',
      `${periodName} dönemi ve tüm dairelerin ödeme kayıtları silinecek. Bu işlem geri alınamaz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setError(null);
            setDeleting(true);
            try {
              await deletePeriod(periodId);
              router.back();
            } catch {
              setError('Dönem silinemedi.');
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: periodName }} />

      <Card style={styles.summary}>
        <View style={styles.summaryRow}>
          <SummaryItem label="Tahsil edilen" value={formatMoney(summary.collected)} color={colors.success} />
          <SummaryItem
            label="Kalan"
            value={formatMoney(summary.outstanding)}
            color={summary.outstanding > 0 ? colors.danger : colors.textMuted}
          />
        </View>
        <ProgressBar value={summary.count ? summary.paidCount / summary.count : 0} />
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {summary.paidCount}/{summary.count} daire ödedi · Daire başı {formatMoney(period.amount)}
        </Text>
      </Card>

      <Text style={[typography.caption, { color: colors.textMuted }]}>
        Ödeme aldığınız daireye dokunup işaretleyin.
      </Text>

      {error ? <Notice tone="danger" message={error} /> : null}

      <Card padded={false}>
        {dues.map((due, index) => (
          <DueRow
            key={due.id}
            due={due}
            residents={residentsByApartment.get(due.apartmentNo) ?? []}
            busy={busyDueId === due.id}
            disabled={busyDueId !== null || deleting}
            showDivider={index < dues.length - 1}
            onPress={() => openDueActions(due)}
          />
        ))}
      </Card>

      <Button
        title="Dönemi sil"
        icon="trash-outline"
        variant="danger"
        onPress={confirmDelete}
        loading={deleting}
        disabled={busyDueId !== null}
      />
    </Screen>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useThemeColors();
  return (
    <View style={styles.flex}>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

function DueRow({
  due,
  residents,
  busy,
  disabled,
  showDivider,
  onPress,
}: {
  due: Due;
  residents: string[];
  busy: boolean;
  disabled: boolean;
  showDivider: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const detail = due.paid
    ? [due.method ? PAYMENT_METHOD_LABELS[due.method] : null, due.paidAt ? formatRelativeDate(due.paidAt) : null]
        .filter(Boolean)
        .join(' · ')
    : formatMoney(due.amount);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Daire ${due.apartmentNo}, ${due.paid ? 'ödendi' : 'ödenmedi'}`}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        showDivider && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
        pressed && { backgroundColor: colors.surfaceMuted },
      ]}>
      <Avatar name="" apartmentNo={due.apartmentNo} size={40} />
      <View style={styles.flex}>
        <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
          {residents.length > 0 ? residents.join(', ') : `Daire ${due.apartmentNo}`}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
          {residents.length === 0 ? 'Kayıtlı sakin yok · ' : ''}
          {detail}
        </Text>
      </View>
      {busy ? <ActivityIndicator color={colors.primary} /> : <DueStatusChip paid={due.paid} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: {
    marginTop: spacing.xl,
  },
  summary: {
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
});
