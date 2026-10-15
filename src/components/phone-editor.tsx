import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { formatPhone, normalizePhone } from '@/lib/phone';
import { updateUserPhone, UserServiceError } from '@/services/users';

interface PhoneEditorProps {
  uid: string;
  phone: string;
  hint: string;
}

/**
 * Telefon numarası düzenleme kartı. Kayıt değişince bileşeni sıfırlamak için
 * çağıran yer key={phone} vermelidir.
 */
export function PhoneEditor({ uid, phone, hint }: PhoneEditorProps) {
  const [value, setValue] = useState(formatPhone(phone));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'danger' | 'info'; text: string } | null>(null);
  const changed = normalizePhone(value) !== phone;

  async function save() {
    setMessage(null);
    setSaving(true);
    try {
      await updateUserPhone(uid, value);
      setMessage({ tone: 'info', text: 'Telefon kaydedildi.' });
    } catch (err) {
      setMessage({
        tone: 'danger',
        text: err instanceof UserServiceError ? err.message : 'Telefon kaydedilemedi.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card style={styles.card}>
      <TextField
        label="Telefon"
        icon="call-outline"
        value={value}
        onChangeText={(text) => {
          setValue(text);
          setMessage(null);
        }}
        placeholder="0532 123 45 67"
        keyboardType="phone-pad"
        maxLength={20}
        hint={hint}
        editable={!saving}
      />
      {message ? <Notice tone={message.tone} message={message.text} /> : null}
      {changed ? <Button title="Telefonu kaydet" icon="checkmark" onPress={save} loading={saving} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
});
