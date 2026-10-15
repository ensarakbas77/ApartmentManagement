import { Alert, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RoleBadge } from '@/components/ui/role-badge';
import { Screen } from '@/components/ui/screen';
import { spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

/** "Hesabım" sekmesi: tüm roller için ortak profil ve çıkış ekranı. */
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

      <Button title="Çıkış yap" icon="log-out-outline" variant="danger" onPress={confirmSignOut} />
    </Screen>
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
});
