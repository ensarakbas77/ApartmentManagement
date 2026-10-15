import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MonthSwitcher } from '@/components/ui/month-switcher';
import { Notice } from '@/components/ui/notice';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { formatMoney } from '@/lib/money';
import { subscribeToAllDues, summarizeDues } from '@/services/dues';
import { subscribeToExpenses, sumExpenses, totalsByCategory } from '@/services/expenses';
import { toPeriodId, type Due } from '@/types/dues';
import { EXPENSE_CATEGORY_INFO, type Expense } from '@/types/expense';

interface ExpensesListScreenProps {
  onOpen: (id: string) => void;
  /** Verilirse "gider ekle" butonu ve kasa bakiyesi görünür (sadece yönetici). */
  onCreate?: () => void;
}

/** Dijital pano: ay ay apartman giderleri, kategori dağılımı. Herkese açık. */
export function ExpensesListScreen({ onOpen, onCreate }: ExpensesListScreenProps) {
  const colors = useThemeColors();
  const isManager = Boolean(onCreate);
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [dues, setDues] = useState<Due[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeToExpenses(
        (list) => {
          setExpenses(list);
          setError(null);
        },
        () => setError('Giderler yüklenemedi. İnternet bağlantınızı kontrol edin.'),
      ),
    [],
  );

  // Kasa bakiyesi için tüm aidatlar (sadece yönetici okuyabilir).
  useEffect(() => {
    if (!isManager) return;
    return subscribeToAllDues(setDues, () => undefined);
  }, [isManager]);

  const periodId = toPeriodId(year, month);
  const monthExpenses = useMemo(
    () => (expenses ?? []).filter((e) => e.periodId === periodId),
    [expenses, periodId],
  );
  const monthTotal = sumExpenses(monthExpenses);
  const categories = useMemo(() => totalsByCategory(monthExpenses), [monthExpenses]);
  const balance = summarizeDues(dues).collected - sumExpenses(expenses ?? []);

  return (
    <Screen edges={['bottom']}>
      {isManager && expenses ? (
        <Card style={styles.balance}>
          <Text style={[typography.label, { color: colors.textMuted }]}>KASA BAKİYESİ</Text>
          <Text style={[styles.balanceAmount, { color: balance >= 0 ? colors.success : colors.danger }]}>
            {formatMoney(balance)}
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            Tahsil edilen aidatlar − tüm giderler. Sadece siz görüyorsunuz.
          </Text>
        </Card>
      ) : null}

      {onCreate ? <Button title="Gider ekle" icon="add-circle-outline" onPress={onCreate} /> : null}

      <MonthSwitcher
        year={year}
        month={month}
        onChange={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
        disableFuture
      />

      {error ? <Notice tone="danger" message={error} /> : null}

      {expenses === null && !error ? <SkeletonList /> : null}

      {expenses && monthExpenses.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="Bu ay gider yok"
          description={
            isManager
              ? 'Asansör bakımı, temizlik malzemesi gibi harcamaları ekleyerek sakinlerle paylaşın.'
              : 'Yönetici bu ay için henüz gider girmedi.'
          }
        />
      ) : null}

      {monthExpenses.length > 0 ? (
        <Card style={styles.summary}>
          <Text style={[typography.label, { color: colors.textMuted }]}>BU AYIN TOPLAMI</Text>
          <Text style={[styles.total, { color: colors.text }]}>{formatMoney(monthTotal)}</Text>
          <View style={styles.categories}>
            {categories.map(({ category, total }) => (
              <View key={category} style={styles.categoryRow}>
                <View style={styles.categoryLabel}>
                  <Text style={[typography.caption, styles.flex, { color: colors.text }]} numberOfLines={1}>
                    {EXPENSE_CATEGORY_INFO[category].label}
                  </Text>
                  <Text style={[typography.caption, styles.bold, { color: colors.text }]}>
                    {formatMoney(total)}
                  </Text>
                </View>
                <ProgressBar value={monthTotal ? total / monthTotal : 0} color={colors.primary} />
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {monthExpenses.length > 0 ? (
        <Card padded={false}>
          {monthExpenses.map((expense, index) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              showDivider={index < monthExpenses.length - 1}
              onPress={() => onOpen(expense.id)}
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

function ExpenseRow({
  expense,
  showDivider,
  onPress,
}: {
  expense: Expense;
  showDivider: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const info = EXPENSE_CATEGORY_INFO[expense.category];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${expense.title}, ${formatMoney(expense.amount)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        showDivider && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
        pressed && { backgroundColor: colors.surfaceMuted },
      ]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={info.icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.flex}>
        <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
          {expense.title}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
          {expense.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} · {info.label}
        </Text>
      </View>
      <Text style={[typography.bodyStrong, { color: colors.text }]}>{formatMoney(expense.amount)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  loading: {
    marginTop: spacing.xl,
  },
  balance: {
    gap: spacing.xs,
  },
  balanceAmount: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  summary: {
    gap: spacing.sm,
  },
  total: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  categories: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  categoryRow: {
    gap: 4,
  },
  categoryLabel: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
