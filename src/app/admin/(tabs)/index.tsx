import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { Notice } from '@/components/ui/notice';
import { RoleBadge } from '@/components/ui/role-badge';
import { Screen } from '@/components/ui/screen';
import { APARTMENT_COUNT } from '@/constants/apartment';
import { spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { subscribeToUsers } from '@/services/users';
import type { UserProfile } from '@/types/user';

export default function UsersScreen() {
  const colors = useThemeColors();
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeToUsers(
        (list) => {
          setUsers(list);
          setError(null);
        },
        () => setError('Kullanıcılar yüklenemedi. İnternet bağlantınızı kontrol edin.'),
      ),
    [],
  );

  const stats = useMemo(() => {
    const list = users ?? [];
    const apartments = new Set(list.map((u) => u.apartmentNo).filter((n) => n !== null));
    return {
      apartments: apartments.size,
      managers: list.filter((u) => u.role === 'manager').length,
      residents: list.filter((u) => u.role === 'resident').length,
    };
  }, [users]);

  return (
    <Screen
      title="Kullanıcılar"
      subtitle={`${stats.apartments}/${APARTMENT_COUNT} daire kayıtlı`}
      headerRight={
        <IconButton
          icon="add"
          accessibilityLabel="Yeni kullanıcı ekle"
          onPress={() => router.push('/admin/users/new')}
        />
      }>
      <View style={styles.stats}>
        <StatCard label="Toplam" value={users?.length ?? 0} />
        <StatCard label="Yönetici" value={stats.managers} />
        <StatCard label="Sakin" value={stats.residents} />
      </View>

      {error ? <Notice tone="danger" message={error} /> : null}

      {users === null && !error ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : null}

      {users && users.length > 0 ? (
        <Card padded={false}>
          {users.map((user, index) => (
            <UserRow
              key={user.uid}
              user={user}
              isSelf={user.uid === profile?.uid}
              showDivider={index < users.length - 1}
            />
          ))}
        </Card>
      ) : null}

      {users && users.length === 0 ? (
        <Notice message='Henüz kullanıcı yok. Sağ üstteki "+" ile ilk daireyi ekleyin.' />
      ) : null}
    </Screen>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  const colors = useThemeColors();
  return (
    <Card style={styles.statCard}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
    </Card>
  );
}

function UserRow({
  user,
  isSelf,
  showDivider,
}: {
  user: UserProfile;
  isSelf: boolean;
  showDivider: boolean;
}) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/admin/users/[uid]', params: { uid: user.uid } })}
      style={({ pressed }) => [
        styles.row,
        showDivider && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
        pressed && { backgroundColor: colors.surfaceMuted },
      ]}>
      <Avatar name={user.displayName} apartmentNo={user.apartmentNo} />
      <View style={styles.rowText}>
        <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
          {user.displayName}
          {isSelf ? <Text style={{ color: colors.textMuted }}> (sen)</Text> : null}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
          @{user.username}
          {user.apartmentNo !== null ? ` · Daire ${user.apartmentNo}` : ''}
        </Text>
      </View>
      <RoleBadge role={user.role} />
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.md,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  loading: {
    marginTop: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
