import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { useApartmentSettings } from '@/hooks/use-apartment-settings';
import { formatIban, saveSettings, SettingsError } from '@/services/settings';

/** Yönetici: apartman hesabının IBAN, hesap sahibi ve banka bilgisini düzenler. */
export default function PaymentInfoScreen() {
  const settings = useApartmentSettings();
  const [iban, setIban] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings || initialized) return;
    setIban(settings.iban ? formatIban(settings.iban) : '');
    setAccountHolder(settings.accountHolder);
    setBankName(settings.bankName);
    setInitialized(true);
  }, [settings, initialized]);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await saveSettings({ iban, accountHolder, bankName });
      router.back();
    } catch (err) {
      setError(err instanceof SettingsError ? err.message : 'Bilgiler kaydedilemedi.');
      setSaving(false);
    }
  }

  if (!initialized) {
    return (
      <Screen edges={['bottom']}>
        <SkeletonList count={1} />
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <Card style={styles.section}>
        <TextField
          label="IBAN"
          icon="card-outline"
          value={iban}
          onChangeText={setIban}
          placeholder="TR00 0000 0000 0000 0000 0000 00"
          autoCapitalize="characters"
          maxLength={32}
          editable={!saving}
        />
        <TextField
          label="Hesap sahibi"
          icon="person-outline"
          value={accountHolder}
          onChangeText={setAccountHolder}
          placeholder="Sürur Apartmanı Yönetimi"
          autoCapitalize="words"
          maxLength={80}
          editable={!saving}
        />
        <TextField
          label="Banka"
          icon="business-outline"
          value={bankName}
          onChangeText={setBankName}
          placeholder="Banka adı"
          autoCapitalize="words"
          maxLength={60}
          editable={!saving}
        />
      </Card>

      <Notice message="Bu bilgiler sakinlerin Aidatlarım ekranında ve WhatsApp hatırlatmalarında görünür." />

      {error ? <Notice tone="danger" message={error} /> : null}

      <Button title="Kaydet" icon="checkmark" onPress={handleSave} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
});
