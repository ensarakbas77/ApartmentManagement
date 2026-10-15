import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { PhoneEditor } from '@/components/phone-editor';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RoleBadge } from '@/components/ui/role-badge';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import type { UserRole } from '@/types/user';

const CHANGE_PASSWORD_PATH: Record<UserRole, Href> = {
  admin: '/admin/change-password',
  manager: '/manager/change-password',
  resident: '/resident/change-password',
};

/** "Hesabım" sekmesi: tüm roller için ortak profil, ayarlar ve çıkış ekranı. */
export function AccountScreen() {
  const colors = useThemeColors();
  const { profile, signOut } = useAuth();

  if (!profile) return null;

  function confirmSignOut() {
    Alert.alert('Çıkış yap', 'Hesabınızdan çıkmak istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış yap', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  return (
    <Screen title="Hesabım">
      <Card style={styles.profile}>
        <Avatar name={profile.displayName} size={64} />
        <View style={styles.profileText}>
          <Text style={[typography.title, { color: colors.text }]}>{profile.displayName}</Text>
          <Text style={[typography.body, { color: colors.textMuted }]}>@{profile.username}</Text>
          <View style={styles.badges}>
            <RoleBadge role={profile.role} />
            {profile.apartmentNo !== null ? (
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                Daire {profile.apartmentNo}
              </Text>
            ) : null}
          </View>
        </View>
      </Card>

      <Text style={[typography.label, styles.sectionLabel, { color: colors.textMuted }]}>İLETİŞİM</Text>
      <PhoneEditor
        key={profile.phone}
        uid={profile.uid}
        phone={profile.phone}
        hint="Yönetici size aidat hatırlatmalarını bu numaradan WhatsApp ile gönderebilir."
      />

      <Text style={[typography.label, styles.sectionLabel, { color: colors.textMuted }]}>GÜVENLİK</Text>
      <Card padded={false}>
        <SettingsRow
          icon="key-outline"
          title="Şifre değiştir"
          subtitle="Size verilen geçici şifreyi değiştirmenizi öneririz."
          onPress={() => router.push(CHANGE_PASSWORD_PATH[profile.role])}
        />
      </Card>

      <Button title="Çıkış yap" icon="log-out-outline" variant="danger" onPress={confirmSignOut} />
    </Screen>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionLabel: {
    marginTop: spacing.sm,
    marginBottom: -spacing.xs,
    marginLeft: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
