import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { TextField } from '@/components/ui/text-field';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export default function LoginScreen() {
  const colors = useThemeColors();
  const { signIn, loadingProfile, profileError } = useAuth();
  const passwordRef = useRef<TextInput>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = submitting || loadingProfile;
  const message = error ?? profileError;

  async function handleSubmit() {
    if (!username.trim() || !password) {
      setError('Kullanıcı adı ve şifre girin.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await signIn(username, password);
      // Başarılı girişte yönlendirmeyi _layout.tsx'teki Stack.Protected yapar.
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={[styles.logo, { backgroundColor: colors.primary }]}>
              <Ionicons name="business" size={36} color={colors.primaryText} />
            </View>
            <Text style={[typography.largeTitle, { color: colors.text }]}>Apartman Yönetimi</Text>
            <Text style={[typography.body, { color: colors.textMuted }]}>
              Devam etmek için giriş yapın
            </Text>
          </View>

          <Card style={styles.form}>
            <TextField
              label="Kullanıcı adı"
              icon="person-outline"
              value={username}
              onChangeText={setUsername}
              placeholder="örn. daire5"
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              submitBehavior="submit"
              editable={!busy}
            />
            <TextField
              ref={passwordRef}
              label="Şifre"
              icon="lock-closed-outline"
              password
              value={password}
              onChangeText={setPassword}
              placeholder="Şifreniz"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              editable={!busy}
            />

            {message ? <Notice tone="danger" message={message} /> : null}

            <Button title="Giriş yap" onPress={handleSubmit} loading={busy} />
          </Card>

          <Text style={[typography.caption, styles.hint, { color: colors.textMuted }]}>
            Şifrenizi unuttuysanız apartman yöneticisine başvurun.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  form: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  hint: {
    textAlign: 'center',
  },
});
