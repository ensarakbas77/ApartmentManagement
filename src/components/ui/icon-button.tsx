import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useThemeColors } from '@/constants/theme';
import { tapFeedback } from '@/lib/haptics';

interface IconButtonProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  accessibilityLabel: string;
}

/** Yuvarlak, vurgulu ikon butonu (örn. başlıktaki "+" butonu). */
export function IconButton({ icon, onPress, accessibilityLabel }: IconButtonProps) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.primary },
        pressed && styles.pressed,
      ]}>
      <Ionicons name={icon} size={24} color={colors.primaryText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
