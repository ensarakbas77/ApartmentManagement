import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, StyleSheet, type TextInput } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { AccountError, changePassword, MIN_PASSWORD_LENGTH } from '@/services/account';

/** Tüm roller için ortak şifre değiştirme ekranı. */
export function ChangePasswordScreen() {
  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && next !== confirm;

  async function handleSave() {
    if (next !== confirm) {
      setError('Yeni şifreler birbiriyle aynı değil.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await changePassword(current, next);
      Alert.alert('Şifre değiştirildi', 'Bir sonraki girişinizde yeni şifrenizi kullanın.', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (err) {
      setError(err instanceof AccountError ? err.message : 'Şifre değiştirilemedi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen edges={['bottom']}>
      <Card style={styles.section}>
        <TextField
          label="Mevcut şifre"
          icon="lock-closed-outline"
          password
          value={current}
          onChangeText={setCurrent}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="next"
          onSubmitEditing={() => newRef.current?.focus()}
          submitBehavior="submit"
          editable={!saving}
        />
        <TextField
          ref={newRef}
          label="Yeni şifre"
          icon="key-outline"
          password
          value={next}
          onChangeText={setNext}
          hint={`En az ${MIN_PASSWORD_LENGTH} karakter.`}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          submitBehavior="submit"
          editable={!saving}
        />
        <TextField
          ref={confirmRef}
          label="Yeni şifre (tekrar)"
          icon="key-outline"
          password
          value={confirm}
          onChangeText={setConfirm}
          hint={mismatch ? 'Şifreler aynı değil.' : undefined}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={handleSave}
          editable={!saving}
        />
      </Card>

      {error ? <Notice tone="danger" message={error} /> : null}

      <Button
        title="Şifreyi değiştir"
        icon="checkmark"
        onPress={handleSave}
        loading={saving}
        disabled={!current || !next || !confirm}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
});
