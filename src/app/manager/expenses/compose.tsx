import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateField } from '@/components/ui/date-field';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { parseMoney } from '@/lib/money';
import { createExpense, ExpenseError, getExpense, updateExpense } from '@/services/expenses';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_INFO,
  EXPENSE_NOTE_MAX,
  EXPENSE_TITLE_MAX,
  type ExpenseCategory,
} from '@/types/expense';

/** Gider ekleme ve düzenleme ekranı. ?id= verilirse düzenleme modudur. */
export default function ComposeExpenseScreen() {
  const colors = useThemeColors();
  const { profile } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [amountText, setAmountText] = useState('');
  const [date, setDate] = useState(() => new Date());
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getExpense(id)
      .then((expense) => {
        if (!expense) {
          setError('Bu gider bulunamadı. Silinmiş olabilir.');
          return;
        }
        setTitle(expense.title);
        setCategory(expense.category);
        setAmountText(String(expense.amount).replace('.', ','));
        setDate(expense.date);
        setNote(expense.note);
      })
      .catch(() => setError('Gider yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    if (!profile) return;
    if (!category) {
      setError('Bir kategori seçin.');
      return;
    }
    const amount = parseMoney(amountText);
    if (amount === null) {
      setError('Geçerli bir tutar girin (örn. 3000 veya 3.000,50).');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const input = { title, category, amount, date, note };
      if (id) {
        await updateExpense(id, input);
      } else {
        await createExpense(input, profile);
      }
      router.back();
    } catch (err) {
      setError(err instanceof ExpenseError ? err.message : 'Gider kaydedilemedi.');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen edges={['bottom']}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: isEdit ? 'Gideri düzenle' : 'Gider ekle' }} />

      <Card style={styles.section}>
        <Text style={[typography.label, { color: colors.textMuted }]}>KATEGORİ</Text>
        <View style={styles.categories}>
          {EXPENSE_CATEGORIES.map((key) => {
            const info = EXPENSE_CATEGORY_INFO[key];
            const selected = key === category;
            return (
              <Pressable
                key={key}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  setCategory(key);
                  // Başlık boşsa kategori adını öner.
                  if (!title.trim()) setTitle(info.label);
                }}
                disabled={saving}
                style={[
                  styles.category,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primarySoft : colors.surface,
                  },
                ]}>
                <Ionicons name={info.icon} size={18} color={selected ? colors.primary : colors.textMuted} />
                <Text
                  style={[
                    styles.categoryText,
                    { color: selected ? colors.primary : colors.text },
                    selected && styles.bold,
                  ]}>
                  {info.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.section}>
        <TextField
          label="Gider adı"
          value={title}
          onChangeText={setTitle}
          placeholder="örn. Asansör aylık bakım"
          autoCapitalize="sentences"
          autoCorrect
          maxLength={EXPENSE_TITLE_MAX}
          editable={!saving}
        />
        <TextField
          label="Tutar (₺)"
          icon="cash-outline"
          value={amountText}
          onChangeText={setAmountText}
          placeholder="örn. 3000"
          keyboardType="decimal-pad"
          editable={!saving}
        />
        <DateField label="Tarih" value={date} onChange={setDate} maximumDate={new Date()} disabled={saving} />
        <TextField
          label="Not (isteğe bağlı)"
          value={note}
          onChangeText={setNote}
          placeholder="örn. Firma: ABC Asansör, fatura no 1234"
          autoCapitalize="sentences"
          autoCorrect
          multiline
          maxLength={EXPENSE_NOTE_MAX}
          editable={!saving}
        />
      </Card>

      <Notice message="Giderler tüm sakinlere görünür. Fatura fotoğrafı ekleme yakında gelecek." />

      {error ? <Notice tone="danger" message={error} /> : null}

      <Button
        title={isEdit ? 'Değişiklikleri kaydet' : 'Gideri kaydet'}
        icon="checkmark"
        onPress={handleSave}
        loading={saving}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '700' },
  loading: {
    marginTop: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryText: {
    fontSize: 14,
  },
});
