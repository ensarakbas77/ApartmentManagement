import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/constants/theme';

interface AvatarProps {
  name: string;
  /** Verilirse baş harf yerine daire numarası gösterilir. */
  apartmentNo?: number | null;
  size?: number;
}

export function Avatar({ name, apartmentNo, size = 44 }: AvatarProps) {
  const colors = useThemeColors();
  const label =
    apartmentNo != null ? String(apartmentNo) : (name.trim()[0] ?? '?').toLocaleUpperCase('tr-TR');

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft },
      ]}>
      <Text style={{ color: colors.primary, fontSize: size * 0.4, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
