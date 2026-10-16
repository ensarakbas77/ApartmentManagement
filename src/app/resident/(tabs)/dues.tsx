import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DueStatusChip } from '@/components/dues/due-status-chip';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { IbanCard } from '@/components/iban-card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { formatRelativeDate } from '@/lib/date';
import { firestoreErrorMessage } from '@/lib/firestore-errors';
import { formatMoney } from '@/lib/money';
import { subscribeToApartmentDues, summarizeDues } from '@/services/dues';
import { formatPeriod, PAYMENT_METHOD_LABELS, type Due } from '@/types/dues';

export default function ResidentDuesScreen() {
  const colors = useThemeColors();
  const { profile } = useAuth();
  const apartmentNo = profile?.apartmentNo ?? null;

  const [dues, setDues] = useState<Due[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (apartmentNo === null) return;
    return subscribeToApartmentDues(
      apartmentNo,
      (list) => {
        setDues(list);
        setError(null);
      },
      (err) => setError(firestoreErrorMessage(err, 'Aidatlar yüklenemedi')),
    );
  }, [apartmentNo]);

  const summary = useMemo(() => summarizeDues(dues ?? []), [dues]);
  const unpaidCount = summary.count - summary.paidCount;

  if (apartmentNo === null) {
    return (
      <Screen title="Aidatlarım">
        <Notice tone="warning" message="Hesabınıza bir daire atanmamış. Lütfen yöneticiye başvurun." />
      </Screen>
    );
  }

  return (
    <Screen title="Aidatlarım" subtitle={`Daire ${apartmentNo}`}>
      {error ? <Notice tone="danger" message={error} /> : null}

      {dues === null && !error ? <SkeletonList /> : null}

      {dues && dues.length > 0 ? (
        <Card
          style={[
            styles.summary,
            { backgroundColor: unpaidCount > 0 ? colors.dangerSoft : colors.successSoft, borderColor: 'transparent' },
          ]}>
          <View style={styles.summaryHeader}>
            <Ionicons
              name={unpaidCount > 0 ? 'alert-circle' : 'checkmark-circle'}
              size={22}
              color={unpaidCount > 0 ? colors.danger : colors.success}
            />
            <Text
              style={[
                typography.label,
                { color: unpaidCount > 0 ? colors.danger : colors.success },
              ]}>
              {unpaidCount > 0 ? 'ÖDENMEMİŞ AİDAT' : 'BORCUNUZ YOK'}
            </Text>
          </View>
          <Text
            style={[styles.summaryAmount, { color: unpaidCount > 0 ? colors.danger : colors.success }]}>
            {formatMoney(summary.outstanding)}
          </Text>
          <Text style={[typography.caption, { color: colors.text }]}>
            {unpaidCount > 0
              ? `${unpaidCount} aylık ödenmemiş aidatınız var. Ödemeyi yöneticiye nakit veya EFT ile yapabilirsiniz.`
              : 'Tüm aidatlarınız ödenmiş. Teşekkürler!'}
          </Text>
        </Card>
      ) : null}

      <IbanCard />

      {dues?.length === 0 ? (
        <EmptyState
          icon="wallet-outline"
          title="Henüz aidat yok"
          description="Yönetici bir aidat dönemi açtığında burada görünecek."
        />
      ) : null}

      {dues && dues.length > 0 ? (
        <Card padded={false}>
          {dues.map((due, index) => (
            <DueRow key={due.id} due={due} showDivider={index < dues.length - 1} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

function DueRow({ due, showDivider }: { due: Due; showDivider: boolean }) {
  const colors = useThemeColors();
  const paidInfo = [
    due.method ? PAYMENT_METHOD_LABELS[due.method] : null,
    due.paidAt ? formatRelativeDate(due.paidAt) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View
      style={[
        styles.row,
        showDivider && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}>
      <View style={[styles.indicator, { backgroundColor: due.paid ? colors.success : colors.danger }]} />
      <View style={styles.flex}>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>{formatPeriod(due.year, due.month)}</Text>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {formatMoney(due.amount)}
          {due.paid && paidInfo ? ` · ${paidInfo}` : ''}
        </Text>
      </View>
      <DueStatusChip paid={due.paid} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: {
    marginTop: spacing.xl,
  },
  summary: {
    gap: spacing.xs,
    padding: spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryAmount: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  indicator: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: radius.full,
  },
});
