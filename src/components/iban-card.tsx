import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { useApartmentSettings } from '@/hooks/use-apartment-settings';
import { successFeedback } from '@/lib/haptics';
import { formatIban } from '@/services/settings';

interface IbanCardProps {
  /** Verilirse "Düzenle" bağlantısı görünür (sadece yönetici). */
  onEdit?: () => void;
}

/** Apartman hesabının IBAN'ı ve tek dokunuşla kopyalama. */
export function IbanCard({ onEdit }: IbanCardProps) {
  const colors = useThemeColors();
  const settings = useApartmentSettings();
  const [copied, setCopied] = useState(false);

  if (!settings) return null;
  if (!settings.iban && !onEdit) return null;

  async function copy() {
    if (!settings?.iban) return;
    await Clipboard.setStringAsync(settings.iban);
    successFeedback();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.tints.indigo.bg }]}>
          <Ionicons name="card-outline" size={20} color={colors.tints.indigo.fg} />
        </View>
        <View style={styles.flex}>
          <Text style={[typography.label, { color: colors.textMuted }]}>ÖDEME BİLGİLERİ</Text>
          {settings.bankName || settings.accountHolder ? (
            <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
              {[settings.bankName, settings.accountHolder].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>
        {onEdit ? (
          <Pressable accessibilityRole="button" onPress={onEdit} hitSlop={8}>
            <Text style={[typography.caption, styles.bold, { color: colors.primary }]}>Düzenle</Text>
          </Pressable>
        ) : null}
      </View>

      {settings.iban ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`IBAN: ${formatIban(settings.iban)}. Kopyalamak için dokunun.`}
          onPress={() => void copy()}
          style={({ pressed }) => [
            styles.ibanRow,
            { backgroundColor: colors.surfaceMuted },
            pressed && { opacity: 0.8 },
          ]}>
          <Text style={[styles.iban, { color: colors.text }]} selectable>
            {formatIban(settings.iban)}
          </Text>
          <View style={[styles.copy, { backgroundColor: copied ? colors.success : colors.primary }]}>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={colors.primaryText} />
            <Text style={[styles.copyText, { color: colors.primaryText }]}>{copied ? 'Kopyalandı' : 'Kopyala'}</Text>
          </View>
        </Pressable>
      ) : (
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          IBAN henüz girilmedi. Sakinlerin EFT yapabilmesi için ekleyin.
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ibanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.sm,
    paddingLeft: spacing.md,
  },
  iban: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copyText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
