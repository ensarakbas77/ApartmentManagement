import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, useThemeColors } from '@/constants/theme';

export function PollStatusChip({ closed }: { closed: boolean }) {
  const colors = useThemeColors();
  return (
    <View
      style={[styles.chip, { backgroundColor: closed ? colors.surfaceMuted : colors.successSoft }]}>
      <View style={[styles.dot, { backgroundColor: closed ? colors.textMuted : colors.success }]} />
      <Text style={[styles.text, { color: closed ? colors.textMuted : colors.success }]}>
        {closed ? 'Kapandı' : 'Oylama açık'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
