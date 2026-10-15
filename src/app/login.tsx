import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type TextInput,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { APARTMENT_NAME } from '@/constants/apartment';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export default function LoginScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
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
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { backgroundColor: colors.hero, paddingTop: insets.top + spacing.xl }]}>
            <Animated.View entering={FadeInDown.duration(400)} style={styles.brand}>
              <View style={[styles.logo, { backgroundColor: colors.heroCard }]}>
                <Ionicons name="business" size={34} color={colors.heroText} />
              </View>
              <Text style={[styles.title, { color: colors.heroText }]}>{APARTMENT_NAME}</Text>
              <Text style={[typography.body, styles.center, { color: colors.heroMuted }]}>
                Hoş geldiniz, devam etmek için giriş yapın
              </Text>
            </Animated.View>
          </View>

          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.formWrapper}>
            <Card style={styles.form}>
              <TextField
                label="Kullanıcı adı"
                icon="person-outline"
                value={username}
                onChangeText={setUsername}
                placeholder="Kullanıcı adınız"
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

              <Button title="Giriş yap" icon="arrow-forward" onPress={handleSubmit} loading={busy} />
            </Card>

            <Text style={[typography.caption, styles.hint, { color: colors.textMuted }]}>
              Şifrenizi unuttuysanız apartman yöneticisine başvurun.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 48,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  formWrapper: {
    marginTop: -48,
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
  },
  form: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  hint: {
    textAlign: 'center',
  },
  center: {
    textAlign: 'center',
  },
});
