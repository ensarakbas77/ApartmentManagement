import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { radius, spacing, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export default function LoginScreen() {
  const colors = useThemeColors();
  const { signIn, loadingProfile, profileError } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Apartman Yönetimi</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Devam etmek için giriş yapın
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.text }]}>Kullanıcı adı</Text>
            <TextInput
              style={inputStyle}
              value={username}
              onChangeText={setUsername}
              placeholder="örn. daire5"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              editable={!busy}
            />

            <Text style={[styles.label, { color: colors.text }]}>Şifre</Text>
            <View>
              <TextInput
                style={[inputStyle, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Şifreniz"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                editable={!busy}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                onPress={() => setShowPassword((v) => !v)}
                style={styles.toggle}
                hitSlop={8}>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  {showPassword ? 'Gizle' : 'Göster'}
                </Text>
              </Pressable>
            </View>

            {message && (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerSurface }]}>
                <Text style={{ color: colors.danger }}>{message}</Text>
              </View>
            )}

            <View style={styles.submit}>
              <Button title="Giriş yap" onPress={handleSubmit} loading={busy} />
            </View>

            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Şifrenizi unuttuysanız yöneticiye başvurun.
            </Text>
          </View>
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
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  passwordInput: {
    paddingRight: 80,
  },
  toggle: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  errorBox: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  submit: {
    marginTop: spacing.md,
  },
  hint: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
