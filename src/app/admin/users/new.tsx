import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { APARTMENT_NAME, APARTMENT_NUMBERS } from '@/constants/apartment';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { sendWhatsApp } from '@/lib/phone';
import {
  createUser,
  generateTemporaryPassword,
  subscribeToUsers,
  UserServiceError,
  type AssignableRole,
} from '@/services/users';
import type { UserProfile } from '@/types/user';

const ROLE_OPTIONS: { value: AssignableRole; label: string }[] = [
  { value: 'resident', label: 'Sakin' },
  { value: 'manager', label: 'Yönetici' },
];

export default function NewUserScreen() {
  const colors = useThemeColors();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [apartmentNo, setApartmentNo] = useState<number | null>(null);
  const [role, setRole] = useState<AssignableRole>('resident');
  const [password, setPassword] = useState(() => generateTemporaryPassword());
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Hangi dairelerde zaten kayıtlı kullanıcı olduğunu göstermek için.
  useEffect(() => subscribeToUsers(setUsers, () => undefined), []);
  const occupied = useMemo(() => new Set(users.map((u) => u.apartmentNo)), [users]);

  function selectApartment(no: number) {
    setApartmentNo(no);
    // Kullanıcı adını elle değiştirmediyse "daire5" gibi otomatik öner.
    if (!usernameEdited) setUsername(`daire${no}`);
  }

  async function handleSubmit() {
    if (apartmentNo === null) {
      setError('Bir daire seçin.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const user = await createUser({ displayName, username, password, role, apartmentNo, phone });
      const message =
        `${APARTMENT_NAME} uygulaması giriş bilgileri\n` +
        `Kullanıcı adı: ${user.username}\n` +
        `Geçici şifre: ${password}\n\n` +
        'İlk girişte kendi şifrenizi belirlemeniz istenecek.';

      Alert.alert('Kullanıcı oluşturuldu', `${message}\n\nBu bilgileri sakine iletin.`, [
        {
          // Telefon girildiyse doğrudan o kişinin WhatsApp sohbeti, yoksa paylaşım menüsü açılır.
          text: user.phone ? 'WhatsApp ile gönder' : 'Paylaş',
          onPress: () => {
            void sendWhatsApp(user.phone || null, message);
            router.back();
          },
        },
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (err) {
      setError(err instanceof UserServiceError ? err.message : 'Kullanıcı oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen edges={['bottom']}>
      <Card style={styles.section}>
        <Text style={[typography.label, { color: colors.textMuted }]}>DAİRE</Text>
        <View style={styles.apartments}>
          {APARTMENT_NUMBERS.map((no) => {
            const selected = apartmentNo === no;
            const taken = occupied.has(no);
            return (
              <Pressable
                key={no}
                accessibilityRole="button"
                accessibilityLabel={`Daire ${no}${taken ? ', kayıtlı kullanıcı var' : ''}`}
                accessibilityState={{ selected }}
                onPress={() => selectApartment(no)}
                style={[
                  styles.apartment,
                  {
                    backgroundColor: selected ? colors.primary : colors.surfaceMuted,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}>
                <Text
                  style={[styles.apartmentText, { color: selected ? colors.primaryText : colors.text }]}>
                  {no}
                </Text>
                {taken ? (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: selected ? colors.primaryText : colors.success },
                    ]}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          Yeşil nokta: o dairede zaten kayıtlı bir kullanıcı var.
        </Text>

        <Text style={[typography.label, styles.roleLabel, { color: colors.textMuted }]}>ROL</Text>
        <SegmentedControl options={ROLE_OPTIONS} value={role} onChange={setRole} />
      </Card>

      <Card style={styles.section}>
        <TextField
          label="Ad soyad"
          icon="person-outline"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="örn. Ahmet Yılmaz"
          autoCapitalize="words"
          editable={!submitting}
        />
        <TextField
          label="Kullanıcı adı"
          icon="at"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            setUsernameEdited(true);
          }}
          placeholder="örn. daire5"
          hint="Sakin giriş yaparken bunu yazacak. Türkçe karakterler otomatik düzeltilir."
          editable={!submitting}
        />
        <TextField
          label="Telefon (isteğe bağlı)"
          icon="logo-whatsapp"
          value={phone}
          onChangeText={setPhone}
          placeholder="0532 123 45 67"
          keyboardType="phone-pad"
          maxLength={20}
          hint="Giriş bilgilerini ve aidat hatırlatmalarını WhatsApp'tan göndermek için."
          editable={!submitting}
        />
        <TextField
          label="Geçici şifre"
          icon="key-outline"
          value={password}
          onChangeText={setPassword}
          hint="En az 6 karakter. Sakine iletmeyi unutmayın."
          editable={!submitting}
        />
        <Button
          title="Yeni şifre üret"
          icon="refresh"
          variant="secondary"
          onPress={() => setPassword(generateTemporaryPassword())}
          disabled={submitting}
        />
      </Card>

      {error ? <Notice tone="danger" message={error} /> : null}

      <Button title="Kullanıcıyı oluştur" icon="person-add" onPress={handleSubmit} loading={submitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  apartments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  apartment: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apartmentText: {
    fontSize: 18,
    fontWeight: '700',
  },
  dot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  roleLabel: {
    marginTop: spacing.xs,
  },
});
