import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { APARTMENT_COUNT } from '@/constants/apartment';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { formatMoney, parseMoney } from '@/lib/money';
import { createPeriod, DuesError, MAX_DUE_AMOUNT, subscribeToPeriods } from '@/services/dues';
import { formatPeriod, toPeriodId, type DuePeriod } from '@/types/dues';

export default function NewDuePeriodScreen() {
  const colors = useThemeColors();
  const { profile } = useAuth();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [amountText, setAmountText] = useState('');
  const [amountTouched, setAmountTouched] = useState(false);
  const [periods, setPeriods] = useState<DuePeriod[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeToPeriods(setPeriods, () => undefined), []);

  // Son dönemin tutarını varsayılan olarak öner (elle değiştirilmediyse).
  const lastAmount = periods[0]?.amount;
  useEffect(() => {
    if (!amountTouched && lastAmount !== undefined) {
      setAmountText(String(lastAmount).replace('.', ','));
    }
  }, [lastAmount, amountTouched]);

  const existingIds = useMemo(() => new Set(periods.map((p) => p.id)), [periods]);
  const alreadyExists = existingIds.has(toPeriodId(year, month));
  const amount = parseMoney(amountText);

  function shiftMonth(delta: number) {
    const date = new Date(year, month - 1 + delta, 1);
    setYear(date.getFullYear());
    setMonth(date.getMonth() + 1);
    setError(null);
  }

  async function handleCreate() {
    if (!profile) return;
    if (amount === null || amount > MAX_DUE_AMOUNT) {
      setError('Geçerli bir tutar girin (örn. 1500 veya 1.500,50).');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await createPeriod(year, month, amount, profile);
      router.back();
    } catch (err) {
      setError(err instanceof DuesError ? err.message : 'Aidat dönemi oluşturulamadı.');
      setSaving(false);
    }
  }

  return (
    <Screen edges={['bottom']}>
      <Card style={styles.section}>
        <Text style={[typography.label, { color: colors.textMuted }]}>DÖNEM</Text>
        <View style={styles.monthPicker}>
          <MonthArrow icon="chevron-back" label="Önceki ay" onPress={() => shiftMonth(-1)} />
          <Text style={[typography.title, styles.monthText, { color: colors.text }]}>
            {formatPeriod(year, month)}
          </Text>
          <MonthArrow icon="chevron-forward" label="Sonraki ay" onPress={() => shiftMonth(1)} />
        </View>
        {alreadyExists ? (
          <Notice tone="warning" message="Bu ay için aidat dönemi zaten açılmış." />
        ) : null}
      </Card>

      <Card style={styles.section}>
        <TextField
          label="Daire başı aidat (₺)"
          icon="cash-outline"
          value={amountText}
          onChangeText={(text) => {
            setAmountText(text);
            setAmountTouched(true);
          }}
          placeholder="örn. 1500"
          keyboardType="decimal-pad"
          editable={!saving}
        />
        {amount !== null ? (
          <Text style={[typography.body, { color: colors.textMuted }]}>
            {APARTMENT_COUNT} daire × {formatMoney(amount)} ={' '}
            <Text style={[styles.bold, { color: colors.text }]}>
              {formatMoney(amount * APARTMENT_COUNT)}
            </Text>
          </Text>
        ) : null}
      </Card>

      <Notice
        message={`Tüm ${APARTMENT_COUNT} daire için "ödenmedi" kaydı oluşturulur. Ödeme aldıkça daireleri işaretlersiniz.`}
      />

      {error ? <Notice tone="danger" message={error} /> : null}

      <Button
        title="Dönemi aç"
        icon="add-circle-outline"
        onPress={handleCreate}
        loading={saving}
        disabled={alreadyExists || amount === null}
      />
    </Screen>
  );
}

function MonthArrow({
  icon,
  label,
  onPress,
}: {
  icon: 'chevron-back' | 'chevron-forward';
  label: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.arrow,
        { backgroundColor: colors.surfaceMuted },
        pressed && { opacity: 0.7 },
      ]}>
      <Ionicons name={icon} size={22} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '700' },
  section: {
    gap: spacing.md,
  },
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  monthText: {
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
});
