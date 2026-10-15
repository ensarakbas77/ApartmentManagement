import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { ROLE_LABELS } from '@/types/user';

export interface HomeFeature {
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
}

/** Yönetici ve sakin ana sayfası: karşılama ve özellik kutucukları. */
export function HomeScreen({ features }: { features: HomeFeature[] }) {
  const colors = useThemeColors();
  const { profile } = useAuth();

  if (!profile) return null;

  const firstName = profile.displayName.split(' ')[0] || profile.displayName;
  const subtitle = [
    profile.apartmentNo !== null ? `Daire ${profile.apartmentNo}` : null,
    ROLE_LABELS[profile.role],
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen title={`Merhaba, ${firstName}`} subtitle={subtitle}>
      <Card style={[styles.announcement, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
        <Ionicons name="megaphone-outline" size={22} color={colors.primaryText} />
        <View style={styles.flex}>
          <Text style={[typography.bodyStrong, { color: colors.primaryText }]}>Son duyuru</Text>
          <Text style={[typography.caption, { color: colors.primaryText, opacity: 0.85 }]}>
            Duyurular bölümü eklendiğinde en güncel duyuru burada görünecek.
          </Text>
        </View>
      </Card>

      <View style={styles.grid}>
        {features.map((feature) => (
          <Card key={feature.title} style={styles.tile}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name={feature.icon} size={22} color={colors.primary} />
            </View>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>{feature.title}</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={2}>
              {feature.description}
            </Text>
            <View style={[styles.soon, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.soonText, { color: colors.textMuted }]}>Yakında</Text>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  announcement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  tile: {
    width: '48%',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soon: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  soonText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
