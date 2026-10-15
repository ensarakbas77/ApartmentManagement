import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { createPoll, PollError } from '@/services/polls';
import {
  POLL_DESCRIPTION_MAX,
  POLL_MAX_OPTIONS,
  POLL_MIN_OPTIONS,
  POLL_OPTION_MAX,
  POLL_QUESTION_MAX,
} from '@/types/poll';

export default function NewPollScreen() {
  const colors = useThemeColors();
  const { profile } = useAuth();

  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['Evet', 'Hayır']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateOption(index: number, text: string) {
    setOptions((list) => list.map((o, i) => (i === index ? text : o)));
  }

  function removeOption(index: number) {
    setOptions((list) => list.filter((_, i) => i !== index));
  }

  async function handleCreate() {
    if (!profile) return;
    setError(null);
    setSaving(true);
    try {
      await createPoll({ question, description, options }, profile);
      router.back();
    } catch (err) {
      setError(err instanceof PollError ? err.message : 'Anket oluşturulamadı.');
      setSaving(false);
    }
  }

  return (
    <Screen edges={['bottom']}>
      <Card style={styles.section}>
        <TextField
          label="Soru"
          value={question}
          onChangeText={setQuestion}
          placeholder="örn. Dış cephe boyansın mı?"
          autoCapitalize="sentences"
          autoCorrect
          maxLength={POLL_QUESTION_MAX}
          editable={!saving}
        />
        <TextField
          label="Açıklama (isteğe bağlı)"
          value={description}
          onChangeText={setDescription}
          placeholder="örn. Alınan teklif daire başı 4.000 ₺."
          autoCapitalize="sentences"
          autoCorrect
          multiline
          maxLength={POLL_DESCRIPTION_MAX}
          editable={!saving}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={[typography.label, { color: colors.textMuted }]}>SEÇENEKLER</Text>
        {options.map((option, index) => (
          <View key={index} style={styles.optionRow}>
            <View style={styles.flex}>
              <TextField
                label={`Seçenek ${index + 1}`}
                value={option}
                onChangeText={(text) => updateOption(index, text)}
                placeholder={`Seçenek ${index + 1}`}
                autoCapitalize="sentences"
                autoCorrect
                maxLength={POLL_OPTION_MAX}
                editable={!saving}
              />
            </View>
            {options.length > POLL_MIN_OPTIONS ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Seçenek ${index + 1}'i kaldır`}
                onPress={() => removeOption(index)}
                hitSlop={8}
                style={styles.remove}>
                <Ionicons name="close-circle" size={26} color={colors.danger} />
              </Pressable>
            ) : null}
          </View>
        ))}
        {options.length < POLL_MAX_OPTIONS ? (
          <Button
            title="Seçenek ekle"
            icon="add"
            variant="secondary"
            onPress={() => setOptions((list) => [...list, ''])}
            disabled={saving}
          />
        ) : null}
      </Card>

      <Notice message="Her daire bir oy kullanır ve oy sonradan değiştirilemez. Sakinler kimin neye oy verdiğini göremez." />

      {error ? <Notice tone="danger" message={error} /> : null}

      <Button title="Anketi yayınla" icon="paper-plane-outline" onPress={handleCreate} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: {
    gap: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  remove: {
    paddingTop: spacing.lg,
  },
});
