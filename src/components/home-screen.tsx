import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { formatRelativeDate } from '@/lib/date';
import { subscribeToLatestAnnouncement } from '@/services/announcements';
import type { Announcement } from '@/types/announcement';
import { ROLE_LABELS } from '@/types/user';

export interface HomeFeature {
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  /** Verilmezse özellik henüz hazır değildir ve "Yakında" etiketi gösterilir. */
  onPress?: () => void;
  /** Sıfırdan büyükse kutucukta rozet olarak gösterilir (örn. bekleyen talep sayısı). */
  badge?: number;
}

interface HomeScreenProps {
  features: HomeFeature[];
  onOpenAnnouncement: (id: string) => void;
  onOpenAnnouncements: () => void;
}

/** Yönetici ve sakin ana sayfası: karşılama, son duyuru ve özellik kutucukları. */
export function HomeScreen({ features, onOpenAnnouncement, onOpenAnnouncements }: HomeScreenProps) {
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
      <LatestAnnouncementCard onOpen={onOpenAnnouncement} onOpenAll={onOpenAnnouncements} />

      {features.length > 0 ? (
        <View style={styles.grid}>
          {features.map((feature) => {
            const ready = Boolean(feature.onPress);
            return (
              <Pressable
                key={feature.title}
                accessibilityRole="button"
                accessibilityLabel={ready ? feature.title : `${feature.title}, yakında`}
                accessibilityState={{ disabled: !ready }}
                disabled={!ready}
                onPress={feature.onPress}
                style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
                <Card style={[styles.tileCard, !ready && styles.tileDisabled]}>
                  <View style={styles.tileHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
                      <Ionicons name={feature.icon} size={22} color={colors.primary} />
                    </View>
                    {feature.badge ? (
                      <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                        <Text style={[styles.badgeText, { color: colors.primaryText }]}>{feature.badge}</Text>
                      </View>
                    ) : ready ? (
                      <Ionicons name="arrow-forward" size={18} color={colors.textMuted} />
                    ) : null}
                  </View>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>{feature.title}</Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={2}>
                    {feature.description}
                  </Text>
                  {!ready ? (
                    <View style={[styles.soon, { backgroundColor: colors.surfaceMuted }]}>
                      <Text style={[styles.soonText, { color: colors.textMuted }]}>Yakında</Text>
                    </View>
                  ) : null}
                </Card>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </Screen>
  );
}

function LatestAnnouncementCard({
  onOpen,
  onOpenAll,
}: {
  onOpen: (id: string) => void;
  onOpenAll: () => void;
}) {
  const colors = useThemeColors();
  // undefined: yükleniyor, null: hiç duyuru yok
  const [latest, setLatest] = useState<Announcement | null | undefined>(undefined);

  useEffect(() => subscribeToLatestAnnouncement(setLatest, () => setLatest(null)), []);

  const hasAnnouncement = Boolean(latest);
  const background = latest?.important ? colors.warning : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={latest ? `Son duyuru: ${latest.title}` : 'Duyurular'}
      onPress={() => (latest ? onOpen(latest.id) : onOpenAll())}
      style={({ pressed }) => pressed && styles.pressed}>
      <Card style={[styles.announcement, { backgroundColor: background, borderColor: background }]}>
        <View style={styles.announcementHeader}>
          <Ionicons
            name={latest?.important ? 'alert-circle' : 'megaphone'}
            size={18}
            color={colors.primaryText}
          />
          <Text style={[styles.announcementLabel, { color: colors.primaryText }]}>
            {latest?.important ? 'ÖNEMLİ DUYURU' : 'SON DUYURU'}
          </Text>
          {latest ? (
            <Text style={[typography.caption, styles.announcementDate, { color: colors.primaryText }]}>
              {formatRelativeDate(latest.createdAt)}
            </Text>
          ) : null}
        </View>

        <Text style={[typography.title, { color: colors.primaryText }]} numberOfLines={2}>
          {latest === undefined ? 'Yükleniyor…' : (latest?.title ?? 'Henüz duyuru yok')}
        </Text>
        {hasAnnouncement ? (
          <Text style={[styles.announcementBody, { color: colors.primaryText }]} numberOfLines={3}>
            {latest?.body}
          </Text>
        ) : null}

        <View style={styles.announcementFooter}>
          <Text style={[typography.caption, styles.bold, { color: colors.primaryText }]}>
            {hasAnnouncement ? 'Devamını oku' : 'Duyurulara git'}
          </Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primaryText} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },
  bold: {
    fontWeight: '700',
  },
  announcement: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  announcementLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  announcementDate: {
    marginLeft: 'auto',
    opacity: 0.85,
  },
  announcementBody: {
    fontSize: 15,
    lineHeight: 21,
    opacity: 0.9,
  },
  announcementFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  tile: {
    width: '48%',
  },
  tileCard: {
    flex: 1,
    gap: spacing.sm,
  },
  tileDisabled: {
    opacity: 0.65,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
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
