import { forwardRef } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';

import { fonts } from '@/constants/theme';

type Weight = NonNullable<TextStyle['fontWeight']>;

function familyFor(weight: Weight | undefined): string {
  switch (String(weight ?? '400')) {
    case '500':
    case 'medium':
      return fonts.medium;
    case '600':
    case 'semibold':
      return fonts.semibold;
    case '700':
    case 'bold':
      return fonts.bold;
    case '800':
    case '900':
    case 'heavy':
    case 'black':
      return fonts.extrabold;
    default:
      return fonts.regular;
  }
}

/**
 * Özel yazı tipleri her ağırlık için ayrı bir aile olarak yüklenir. Bu yardımcı, stildeki
 * fontWeight'e bakıp doğru aileyi seçer ve fontWeight'i kaldırır (Android'de ikisi birlikte
 * kullanılınca yazı tipi sistem fontuna düşebiliyor).
 */
function withFont(style: TextProps['style']): TextStyle {
  const flat = StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily) return flat;
  const { fontWeight, ...rest } = flat;
  return { ...rest, fontFamily: familyFor(fontWeight) };
}

/** Uygulamanın yazı tipini otomatik uygulayan Text. react-native'in Text'i yerine bunu kullanın. */
export const Text = forwardRef<RNText, TextProps>(function Text({ style, ...props }, ref) {
  return <RNText ref={ref} {...props} style={withFont(style)} />;
});

/** Uygulamanın yazı tipini otomatik uygulayan TextInput. */
export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(
  { style, ...props },
  ref,
) {
  return <RNTextInput ref={ref} {...props} style={withFont(style)} />;
});
