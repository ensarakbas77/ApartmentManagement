import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { radius, spacing, useThemeColors } from '@/constants/theme';

/** Yeşil "Ödendi" / kırmızı "Ödenmedi" etiketi. */
export function DueStatusChip({ paid }: { paid: boolean }) {
  const colors = useThemeColors();
  const bg = paid ? colors.successSoft : colors.dangerSoft;
  const fg = paid ? colors.success : colors.danger;

  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Ionicons name={paid ? 'checkmark-circle' : 'close-circle'} size={14} color={fg} />
      <Text style={[styles.text, { color: fg }]}>{paid ? 'Ödendi' : 'Ödenmedi'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
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
