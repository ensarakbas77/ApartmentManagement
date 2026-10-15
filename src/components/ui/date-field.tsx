import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';

interface DateFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  disabled?: boolean;
}

/** Tarih seçme alanı: Android'de sistem takvimi açılır, iOS'ta kompakt seçici gösterilir. */
export function DateField({ label, value, onChange, maximumDate, disabled = false }: DateFieldProps) {
  const colors = useThemeColors();
  const text = value.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });

  function openAndroidPicker() {
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      maximumDate,
      onValueChange: (_event, date) => onChange(date),
    });
  }

  return (
    <View style={styles.wrapper}>
      <Text style={[typography.label, { color: colors.textMuted }]}>{label.toLocaleUpperCase('tr-TR')}</Text>
      {Platform.OS === 'ios' ? (
        <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
          <DateTimePicker
            value={value}
            mode="date"
            display="compact"
            locale="tr-TR"
            maximumDate={maximumDate}
            disabled={disabled}
            onValueChange={(_event, date) => onChange(date)}
          />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${text}. Değiştirmek için dokunun.`}
          onPress={Platform.OS === 'android' ? openAndroidPicker : undefined}
          disabled={disabled || Platform.OS !== 'android'}
          style={({ pressed }) => [
            styles.field,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { backgroundColor: colors.surfaceMuted },
          ]}>
          <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
          <Text style={[typography.body, styles.flex, { color: colors.text }]}>{text}</Text>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrapper: {
    gap: 6,
  },
  field: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
