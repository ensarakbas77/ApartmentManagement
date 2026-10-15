import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, useThemeColors, type ThemeColors } from '@/constants/theme';
import { ISSUE_STATUS_LABELS, type IssueStatus } from '@/types/issue';

export function issueStatusTone(status: IssueStatus, colors: ThemeColors) {
  return {
    open: { bg: colors.dangerSoft, fg: colors.danger, icon: 'alert-circle' as const },
    in_progress: { bg: colors.warningSoft, fg: colors.warning, icon: 'construct' as const },
    resolved: { bg: colors.successSoft, fg: colors.success, icon: 'checkmark-circle' as const },
  }[status];
}

/** Kırmızı "Açık" / turuncu "İşlemde" / yeşil "Çözüldü" etiketi. */
export function IssueStatusChip({ status }: { status: IssueStatus }) {
  const colors = useThemeColors();
  const tone = issueStatusTone(status, colors);

  return (
    <View style={[styles.chip, { backgroundColor: tone.bg }]}>
      <Ionicons name={tone.icon} size={14} color={tone.fg} />
      <Text style={[styles.text, { color: tone.fg }]}>{ISSUE_STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
