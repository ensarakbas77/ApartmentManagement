import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { PhoneEditor } from '@/components/phone-editor';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { RoleBadge } from '@/components/ui/role-badge';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { SkeletonList } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  removeUser,
  subscribeToUser,
  updateUserRole,
  type AssignableRole,
} from '@/services/users';
import type { UserProfile } from '@/types/user';

const ROLE_OPTIONS: { value: AssignableRole; label: string }[] = [
  { value: 'resident', label: 'Sakin' },
  { value: 'manager', label: 'Yönetici' },
];

export default function UserDetailScreen() {
  const colors = useThemeColors();
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const { profile: currentUser } = useAuth();

  // undefined: yükleniyor, null: bulunamadı / silindi
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined);
  const [busy, setBusy] = useState<'role' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    return subscribeToUser(uid, setUser, () => setError('Kullanıcı bilgileri yüklenemedi.'));
  }, [uid]);

  // Silme sırasında profil null'a döner; geri dönülene kadar "bulunamadı" yerine yükleniyor göster.
  if ((user === undefined && !error) || (!user && busy === 'delete')) {
    return (
      <Screen edges={['bottom']}>
        <SkeletonList />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen edges={['bottom']}>
        <Notice tone="warning" message={error ?? 'Bu kullanıcı bulunamadı. Silinmiş olabilir.'} />
        <Button title="Listeye dön" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const target = user;
  const isSelf = target.uid === currentUser?.uid;
  const isProtected = isSelf || target.role === 'admin';
  const createdAt = target.createdAt?.toDate().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  async function changeRole(role: AssignableRole) {
    if (role === target.role) return;
    setError(null);
    setBusy('role');
    try {
      await updateUserRole(target.uid, role);
    } catch {
      setError('Rol değiştirilemedi.');
    } finally {
      setBusy(null);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Kullanıcıyı sil',
      `${target.displayName} (@${target.username}) uygulamaya bir daha giriş yapamayacak. Emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setError(null);
            setBusy('delete');
            try {
              await removeUser(target.uid);
              router.back();
            } catch {
              setError('Kullanıcı silinemedi.');
              setBusy(null);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen edges={['bottom']}>
      <Card style={styles.header}>
        <Avatar name={target.displayName} apartmentNo={target.apartmentNo} size={72} />
        <Text style={[typography.title, { color: colors.text }]}>{target.displayName}</Text>
        <RoleBadge role={target.role} />
      </Card>

      <Card padded={false}>
        <InfoRow label="Kullanıcı adı" value={`@${target.username}`} />
        <InfoRow
          label="Daire"
          value={target.apartmentNo !== null ? String(target.apartmentNo) : '—'}
        />
        <InfoRow label="Kayıt tarihi" value={createdAt ?? '—'} last />
      </Card>

      {!isProtected ? (
        <Card style={styles.section}>
          <Text style={[typography.label, { color: colors.textMuted }]}>ROL</Text>
          <SegmentedControl
            options={ROLE_OPTIONS}
            value={target.role as AssignableRole}
            onChange={changeRole}
            disabled={busy !== null}
          />
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            Yönetici; duyuru, aidat, gider ve anketleri yönetebilir.
          </Text>
        </Card>
      ) : null}

      {!isProtected ? <PhoneEditor
          key={target.phone}
          uid={target.uid}
          phone={target.phone}
          hint="Aidat hatırlatmaları bu numaraya WhatsApp'tan gönderilir. Kullanıcı da kendi Hesabım ekranından değiştirebilir."
        /> : null}

      {error ? <Notice tone="danger" message={error} /> : null}

      {!isProtected ? (
        <>
          <Button
            title="Kullanıcıyı sil"
            icon="trash-outline"
            variant="danger"
            onPress={confirmDelete}
            loading={busy === 'delete'}
            disabled={busy !== null}
          />
          <Notice
            message={
              'Silinen kullanıcının erişimi hemen kapanır. Aynı kullanıcı adını tekrar kullanmak ' +
              'isterseniz hesabı Firebase Console > Authentication > Users bölümünden de silin.'
            }
          />
        </>
      ) : (
        <Notice message="Kendi hesabınızı ve admin hesaplarını buradan değiştiremezsiniz." />
      )}
    </Screen>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.infoRow,
        !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}>
      <Text style={[typography.body, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[typography.bodyStrong, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
});
