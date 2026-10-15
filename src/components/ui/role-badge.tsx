import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, useThemeColors } from '@/constants/theme';
import { ROLE_LABELS, type UserRole } from '@/types/user';

export function RoleBadge({ role }: { role: UserRole }) {
  const colors = useThemeColors();
  const tone = {
    admin: { bg: colors.primarySoft, fg: colors.primary },
    manager: { bg: colors.warningSoft, fg: colors.warning },
    resident: { bg: colors.successSoft, fg: colors.success },
  }[role];

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{ROLE_LABELS[role]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
