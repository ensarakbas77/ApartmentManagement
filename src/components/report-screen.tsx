import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Notice } from '@/components/ui/notice';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { APARTMENT_NAME } from '@/constants/apartment';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { formatFullDate } from '@/lib/date';
import { firestoreErrorMessage } from '@/lib/firestore-errors';
import { successFeedback } from '@/lib/haptics';
import { formatMoney } from '@/lib/money';
import { subscribeToAllDues } from '@/services/dues';
import { subscribeToExpenses } from '@/services/expenses';
import { computeYearReport, publishReport, subscribeToReport, type YearReport } from '@/services/reports';
import type { Due } from '@/types/dues';
import { EXPENSE_CATEGORY_INFO, type Expense, type ExpenseCategory } from '@/types/expense';

const MONTH_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

interface ReportScreenProps {
  /** true ise canlı önizleme ve "yayınla" butonu gösterilir (sadece yönetici). */
  canPublish?: boolean;
}

/** Yıllık gelir-gider raporu. Yönetici canlı hesaplar ve yayınlar; sakinler yayınlananı görür. */
export function ReportScreen({ canPublish = false }: ReportScreenProps) {
  const colors = useThemeColors();
  const { profile } = useAuth();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);

  // undefined: yükleniyor, null: yayınlanmamış
  const [published, setPublished] = useState<YearReport | null | undefined>(undefined);
  const [dues, setDues] = useState<Due[] | null>(null);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPublished(undefined);
    return subscribeToReport(year, setPublished, () => setPublished(null));
  }, [year]);

  useEffect(() => {
    if (!canPublish) return;
    const stopDues = subscribeToAllDues(setDues, () => setDues([]));
    const stopExpenses = subscribeToExpenses(setExpenses, () => setExpenses([]));
    return () => {
      stopDues();
      stopExpenses();
    };
  }, [canPublish]);

  const preview = useMemo(
    () => (canPublish && dues && expenses ? computeYearReport(year, dues, expenses) : null),
    [canPublish, dues, expenses, year],
  );

  const report = canPublish ? preview : published;
  const loading = canPublish ? preview === null : published === undefined;

  function confirmPublish() {
    if (!preview || !profile) return;
    Alert.alert(
      published ? 'Raporu güncelle' : 'Raporu yayınla',
      `${year} raporu tüm sakinlerin görmesi için ${published ? 'güncellenecek' : 'yayınlanacak'}.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: published ? 'Güncelle' : 'Yayınla',
          onPress: async () => {
            setError(null);
            setPublishing(true);
            try {
              await publishReport(preview, profile);
              successFeedback();
            } catch (err) {
              setError(firestoreErrorMessage(err, 'Rapor yayınlanamadı'));
            } finally {
              setPublishing(false);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen edges={['bottom']}>
      <View style={styles.yearRow}>
        <YearArrow icon="chevron-back" label="Önceki yıl" onPress={() => setYear((y) => y - 1)} />
        <Text style={[typography.title, styles.yearText, { color: colors.text }]}>{year}</Text>
        <YearArrow
          icon="chevron-forward"
          label="Sonraki yıl"
          onPress={() => setYear((y) => y + 1)}
          disabled={year >= thisYear}
        />
      </View>

      {canPublish ? (
        <Notice
          message={
            published?.publishedAt
              ? `Son yayın: ${formatFullDate(published.publishedAt)}. Aşağıdaki canlı önizlemedir; sakinler yayınladığınız son sürümü görür.`
              : 'Aşağıdaki canlı önizlemedir. Sakinler raporu siz yayınladıktan sonra görür.'
          }
        />
      ) : null}

      {loading ? <SkeletonList count={2} /> : null}

      {!loading && !report ? (
        <EmptyState
          icon="document-text-outline"
          title={`${year} raporu henüz yok`}
          description="Yönetici yıllık raporu yayınladığında burada gelir ve giderleri görebilirsiniz."
        />
      ) : null}

      {report ? <ReportView report={report} /> : null}

      {!canPublish && published?.publishedAt ? (
        <Text style={[typography.caption, styles.center, { color: colors.textMuted }]}>
          {published.publishedBy} tarafından {formatFullDate(published.publishedAt)} tarihinde yayınlandı.
        </Text>
      ) : null}

      {error ? <Notice tone="danger" message={error} /> : null}

      {canPublish && preview ? (
        <Button
          title={published ? 'Yayınlanan raporu güncelle' : 'Raporu sakinlerle paylaş'}
          icon="paper-plane-outline"
          onPress={confirmPublish}
          loading={publishing}
        />
      ) : null}
    </Screen>
  );
}

function ReportView({ report }: { report: YearReport }) {
  const colors = useThemeColors();
  const net = report.totalIncome - report.totalExpense;
  const maxMonthly = Math.max(1, ...report.monthly.flatMap((m) => [m.income, m.expense]));
  const categories = (Object.entries(report.categories) as [ExpenseCategory, number][]).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <Card style={styles.summary}>
        <Text style={[typography.label, { color: colors.textMuted }]}>
          {APARTMENT_NAME.toLocaleUpperCase('tr-TR')} · {report.year}
        </Text>
        <View style={styles.summaryRow}>
          <SummaryItem label="Gelir (aidat)" value={formatMoney(report.totalIncome)} color={colors.success} />
          <SummaryItem label="Gider" value={formatMoney(report.totalExpense)} color={colors.danger} />
        </View>
        <View style={[styles.netRow, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[typography.bodyStrong, styles.flex, { color: colors.text }]}>Yıl sonu farkı</Text>
          <Text style={[styles.net, { color: net >= 0 ? colors.success : colors.danger }]}>
            {net >= 0 ? '+' : '−'}
            {formatMoney(Math.abs(net))}
          </Text>
        </View>
        {report.totalDues > 0 ? (
          <View style={styles.collection}>
            <View style={styles.collectionLabel}>
              <Text style={[typography.caption, styles.flex, { color: colors.textMuted }]}>Aidat tahsilat oranı</Text>
              <Text style={[typography.caption, styles.bold, { color: colors.text }]}>
                %{Math.round((report.paidDues / report.totalDues) * 100)}
              </Text>
            </View>
            <ProgressBar value={report.paidDues / report.totalDues} />
          </View>
        ) : null}
      </Card>

      <Card style={styles.section}>
        <View style={styles.chartHeader}>
          <Text style={[typography.label, styles.flex, { color: colors.textMuted }]}>AYLIK</Text>
          <Legend color={colors.primary} label="Gelir" />
          <Legend color={colors.tints.pink.fg} label="Gider" />
        </View>
        <View style={styles.chart}>
          {report.monthly.map((m) => (
            <View
              key={m.month}
              accessible
              accessibilityLabel={`${MONTH_SHORT[m.month - 1]}: gelir ${formatMoney(m.income)}, gider ${formatMoney(m.expense)}`}
              style={styles.chartColumn}>
              <View style={styles.bars}>
                <View
                  style={[styles.bar, { height: `${(m.income / maxMonthly) * 100}%`, backgroundColor: colors.primary }]}
                />
                <View
                  style={[
                    styles.bar,
                    { height: `${(m.expense / maxMonthly) * 100}%`, backgroundColor: colors.tints.pink.fg },
                  ]}
                />
              </View>
              <Text style={[styles.monthLabel, { color: colors.textMuted }]}>{MONTH_SHORT[m.month - 1]}</Text>
            </View>
          ))}
        </View>
      </Card>

      {categories.length > 0 ? (
        <Card style={styles.section}>
          <Text style={[typography.label, { color: colors.textMuted }]}>GİDER DAĞILIMI</Text>
          {categories.map(([category, total]) => (
            <View key={category} style={styles.categoryRow}>
              <View style={styles.categoryLabel}>
                <Text style={[typography.caption, styles.flex, { color: colors.text }]}>
                  {EXPENSE_CATEGORY_INFO[category].label}
                </Text>
                <Text style={[typography.caption, styles.bold, { color: colors.text }]}>{formatMoney(total)}</Text>
              </View>
              <ProgressBar
                value={report.totalExpense ? total / report.totalExpense : 0}
                color={colors.tints.pink.fg}
              />
            </View>
          ))}
        </Card>
      ) : null}
    </>
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

function Legend({ color, label }: { color: string; label: string }) {
  const colors = useThemeColors();
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function YearArrow({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: 'chevron-back' | 'chevron-forward';
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.arrow,
        { backgroundColor: colors.surfaceMuted },
        (pressed || disabled) && { opacity: disabled ? 0.35 : 0.7 },
      ]}>
      <Ionicons name={icon} size={22} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  center: { textAlign: 'center' },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  yearText: {
    flex: 1,
    textAlign: 'center',
  },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  netRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  net: {
    fontSize: 18,
    fontWeight: '800',
  },
  collection: {
    gap: 6,
  },
  collectionLabel: {
    flexDirection: 'row',
  },
  section: {
    gap: spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    gap: 2,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    height: '100%',
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
  },
  bar: {
    width: 7,
    minHeight: 2,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  monthLabel: {
    fontSize: 10,
  },
  categoryRow: {
    gap: 4,
  },
  categoryLabel: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
