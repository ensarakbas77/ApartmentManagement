import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef, useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { radius, spacing, typography, useThemeColors } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface TextFieldProps extends TextInputProps {
  label: string;
  icon?: IconName;
  hint?: string;
  /** Şifre alanı: göster/gizle butonu ekler. */
  password?: boolean;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, icon, hint, password = false, style, ...inputProps },
  ref,
) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const multiline = inputProps.multiline === true;
  const length = inputProps.value?.length ?? 0;

  return (
    <View style={styles.wrapper}>
      <Text style={[typography.label, { color: colors.textMuted }]}>{label.toLocaleUpperCase('tr-TR')}</Text>
      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          {
            backgroundColor: colors.surface,
            borderColor: focused ? colors.primary : colors.border,
          },
        ]}>
        {icon ? <Ionicons name={icon} size={20} color={colors.textMuted} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={password && hidden}
          autoCapitalize="none"
          autoCorrect={false}
          {...inputProps}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline, { color: colors.text }, style]}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Şifreyi göster' : 'Şifreyi gizle'}
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {hint || inputProps.maxLength ? (
        <View style={styles.footer}>
          <Text style={[typography.caption, styles.hint, { color: colors.textMuted }]}>{hint}</Text>
          {inputProps.maxLength ? (
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {length}/{inputProps.maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
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
  fieldMultiline: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.sm,
  },
  inputMultiline: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  hint: {
    flex: 1,
  },
});
