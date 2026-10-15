import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { formatPhone } from '@/lib/phone';
import { ContactError, createContact, deleteContact, getContact, updateContact } from '@/services/contacts';

/** Rehbere numara ekleme / düzenleme. ?id= verilirse düzenleme modudur. */
export default function ComposeContactScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getContact(id)
      .then((contact) => {
        if (!contact) {
          setError('Bu kayıt bulunamadı. Silinmiş olabilir.');
          return;
        }
        setName(contact.name);
        setRole(contact.role);
        setPhone(formatPhone(contact.phone));
      })
      .catch(() => setError('Kayıt yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setError(null);
    setBusy('save');
    try {
      if (id) await updateContact(id, { name, role, phone });
      else await createContact({ name, role, phone });
      router.back();
    } catch (err) {
      setError(err instanceof ContactError ? err.message : 'Kayıt kaydedilemedi.');
      setBusy(null);
    }
  }

  function confirmDelete() {
    if (!id) return;
    Alert.alert('Kaydı sil', `${name} rehberden silinecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          setBusy('delete');
          try {
            await deleteContact(id);
            router.back();
          } catch {
            setError('Kayıt silinemedi.');
            setBusy(null);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <Screen edges={['bottom']}>
        <SkeletonList count={1} />
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: isEdit ? 'Numarayı düzenle' : 'Numara ekle' }} />

      <Card style={styles.section}>
        <TextField
          label="Görev"
          icon="briefcase-outline"
          value={role}
          onChangeText={setRole}
          placeholder="Asansör firması, tesisatçı, yönetici..."
          autoCapitalize="sentences"
          autoCorrect
          maxLength={60}
          editable={busy === null}
        />
        <TextField
          label="Ad / firma"
          icon="person-outline"
          value={name}
          onChangeText={setName}
          placeholder="ABC Asansör"
          autoCapitalize="words"
          maxLength={60}
          editable={busy === null}
        />
        <TextField
          label="Telefon"
          icon="call-outline"
          value={phone}
          onChangeText={setPhone}
          placeholder="0532 123 45 67"
          keyboardType="phone-pad"
          maxLength={20}
          editable={busy === null}
        />
      </Card>

      {error ? <Notice tone="danger" message={error} /> : null}

      <View style={styles.actions}>
        <Button title="Kaydet" icon="checkmark" onPress={handleSave} loading={busy === 'save'} disabled={busy !== null} />
        {isEdit ? (
          <Button
            title="Sil"
            icon="trash-outline"
            variant="danger"
            onPress={confirmDelete}
            loading={busy === 'delete'}
            disabled={busy !== null}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
});
