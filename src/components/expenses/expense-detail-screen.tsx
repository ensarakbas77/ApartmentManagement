import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { formatFullDate } from '@/lib/date';
import { formatMoney } from '@/lib/money';
import { deleteExpense, subscribeToExpense } from '@/services/expenses';
import { EXPENSE_CATEGORY_INFO, type Expense } from '@/types/expense';

interface ExpenseDetailScreenProps {
  id: string;
  /** Verilirse düzenle/sil butonları görünür (sadece yönetici). */
  onEdit?: () => void;
}

export function ExpenseDetailScreen({ id, onEdit }: ExpenseDetailScreenProps) {
  const colors = useThemeColors();
  // undefined: yükleniyor, null: bulunamadı / silindi
  const [expense, setExpense] = useState<Expense | null | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeToExpense(id, setExpense, () => setError('Gider yüklenemedi.')), [id]);

  if ((expense === undefined && !error) || (!expense && deleting)) {
    return (
      <Screen edges={['bottom']}>
        <SkeletonList />
      </Screen>
    );
  }

  if (!expense) {
    return (
      <Screen edges={['bottom']}>
        <Notice tone="warning" message={error ?? 'Bu gider bulunamadı. Silinmiş olabilir.'} />
        <Button title="Geri dön" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const info = EXPENSE_CATEGORY_INFO[expense.category];

  function confirmDelete() {
    Alert.alert('Gideri sil', 'Bu gider kalıcı olarak silinecek. Emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          setError(null);
          setDeleting(true);
          try {
            await deleteExpense(id);
            router.back();
          } catch {
            setError('Gider silinemedi.');
            setDeleting(false);
          }
        },
      },
    ]);
  }

  return (
    <Screen edges={['bottom']}>
      <Card style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={info.icon} size={28} color={colors.primary} />
        </View>
        <Text style={[styles.amount, { color: colors.text }]}>{formatMoney(expense.amount)}</Text>
        <Text style={[typography.title, styles.center, { color: colors.text }]} selectable>
          {expense.title}
        </Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>{info.label}</Text>
      </Card>

      <Card padded={false}>
        <InfoRow
          label="Tarih"
          value={expense.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
        />
        <InfoRow label="Giren" value={expense.authorName || '—'} />
        <InfoRow label="Kayıt" value={formatFullDate(expense.createdAt)} last={!expense.updatedAt} />
        {expense.updatedAt ? <InfoRow label="Düzenlendi" value={formatFullDate(expense.updatedAt)} last /> : null}
      </Card>

      {expense.note ? (
        <Card style={styles.note}>
          <Text style={[typography.label, { color: colors.textMuted }]}>NOT</Text>
          <Text style={[typography.body, { color: colors.text }]} selectable>
            {expense.note}
          </Text>
        </Card>
      ) : null}

      <Notice message="Fatura fotoğrafı ekleme yakında gelecek." />

      {error ? <Notice tone="danger" message={error} /> : null}

      {onEdit ? (
        <View style={styles.actions}>
          <Button title="Düzenle" icon="create-outline" variant="secondary" onPress={onEdit} disabled={deleting} />
          <Button title="Sil" icon="trash-outline" variant="danger" onPress={confirmDelete} loading={deleting} />
        </View>
      ) : null}
    </Screen>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.infoRow,
        !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}>
      <Text style={[typography.body, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[typography.bodyStrong, styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: spacing.xl,
  },
  center: {
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  infoValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  note: {
    gap: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
  },
});
