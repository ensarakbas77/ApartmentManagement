import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, useThemeColors } from '@/constants/theme';

interface NoticeProps {
  message: string;
  tone?: 'info' | 'danger' | 'warning';
}

/** Bilgi / hata / uyarı kutusu. */
export function Notice({ message, tone = 'info' }: NoticeProps) {
  const colors = useThemeColors();
  const style = {
    info: { bg: colors.primarySoft, fg: colors.primary, icon: 'information-circle' as const },
    danger: { bg: colors.dangerSoft, fg: colors.danger, icon: 'alert-circle' as const },
    warning: { bg: colors.warningSoft, fg: colors.warning, icon: 'warning' as const },
  }[tone];

  return (
    <View style={[styles.box, { backgroundColor: style.bg }]}>
      <Ionicons name={style.icon} size={20} color={style.fg} />
      <Text style={[styles.text, { color: style.fg }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
