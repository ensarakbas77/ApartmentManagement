import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { APARTMENT_NAME } from '@/constants/apartment';
import { radius, spacing, typography, useThemeColors, type TintName } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { formatRelativeDate } from '@/lib/date';
import { tapFeedback } from '@/lib/haptics';
import { subscribeToLatestAnnouncement } from '@/services/announcements';
import type { Announcement } from '@/types/announcement';
import { ROLE_LABELS } from '@/types/user';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** "Sizi bekleyenler" listesindeki tek satır. */
export interface ActionItem {
  key: string;
  icon: IconName;
  tint: TintName;
  title: string;
  subtitle?: string;
  onPress: () => void;
}

/** Hızlı erişim kutucuğu. */
export interface HomeTile {
  title: string;
  description: string;
  icon: IconName;
  tint: TintName;
  onPress: () => void;
  /** Sıfırdan büyükse rozet olarak gösterilir. */
  badge?: number;
}

interface HomeScreenProps {
  /** Koyu üst paneldeki kişisel özet (aidat durumu, tahsilat vb.). */
  hero: ReactNode;
  actions: ActionItem[];
  tiles: HomeTile[];
  onOpenAnnouncement: (id: string) => void;
  onOpenAnnouncements: () => void;
}

/** Özet panolu ana sayfa: koyu üst panel, sizi bekleyenler, son duyuru, hızlı erişim. */
export function HomeScreen({ hero, actions, tiles, onOpenAnnouncement, onOpenAnnouncements }: HomeScreenProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  // Koyu panelin üstünde durum çubuğu yazıları beyaz olsun; sayfadan çıkınca eski haline dönsün.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('auto');
    }, []),
  );

  if (!profile) return null;

  const firstName = profile.displayName.split(' ')[0] || profile.displayName;
  const subtitle = [
    APARTMENT_NAME,
    profile.apartmentNo !== null ? `Daire ${profile.apartmentNo}` : null,
    ROLE_LABELS[profile.role],
  ]
    .filter(Boolean)
    .join(' · ');
  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}>
      <View style={[styles.hero, { backgroundColor: colors.hero, paddingTop: insets.top + spacing.md }]}>
        <View style={styles.heroHeader}>
          <View style={styles.flex}>
            <Text style={[styles.heroDate, { color: colors.heroMuted }]}>{today}</Text>
            <Text style={[styles.heroGreeting, { color: colors.heroText }]}>Merhaba, {firstName}</Text>
            <Text style={[typography.caption, { color: colors.heroMuted }]}>{subtitle}</Text>
          </View>
          <View style={[styles.heroAvatar, { backgroundColor: colors.heroCard }]}>
            <Text style={[styles.heroAvatarText, { color: colors.heroText }]}>
              {profile.apartmentNo ?? firstName[0]?.toLocaleUpperCase('tr-TR')}
            </Text>
          </View>
        </View>
        <Animated.View entering={FadeInDown.duration(350)} style={[styles.heroCard, { backgroundColor: colors.heroCard }]}>
          {hero}
        </Animated.View>
      </View>

      <View style={styles.body}>
        <Animated.View entering={FadeInDown.delay(80).duration(350)}>
          <SectionTitle>Sizi bekleyenler</SectionTitle>
          <Card padded={false}>
            {actions.length === 0 ? (
              <View style={styles.actionRow}>
                <View style={[styles.actionIcon, { backgroundColor: colors.tints.teal.bg }]}>
                  <Ionicons name="checkmark-done" size={20} color={colors.tints.teal.fg} />
                </View>
                <View style={styles.flex}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>Her şey yolunda</Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    Şu an ilgilenmeniz gereken bir şey yok.
                  </Text>
                </View>
              </View>
            ) : (
              actions.map((action, index) => (
                <ActionRow key={action.key} action={action} showDivider={index < actions.length - 1} />
              ))
            )}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(350)}>
          <SectionTitle>Son duyuru</SectionTitle>
          <LatestAnnouncementCard onOpen={onOpenAnnouncement} onOpenAll={onOpenAnnouncements} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(350)}>
          <SectionTitle>Hızlı erişim</SectionTitle>
          <View style={styles.grid}>
            {tiles.map((tile) => (
              <QuickTile key={tile.title} tile={tile} />
            ))}
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

/* ---------- Üst panel yapı taşları (rol ekranları hero içeriğini bunlarla kurar) ---------- */

export function HeroLabel({ children }: { children: ReactNode }) {
  const colors = useThemeColors();
  return <Text style={[styles.heroLabel, { color: colors.heroMuted }]}>{children}</Text>;
}

export function HeroAmount({ children }: { children: ReactNode }) {
  const colors = useThemeColors();
  return <Text style={[styles.heroAmount, { color: colors.heroText }]}>{children}</Text>;
}

export function HeroChip({ tone, icon, children }: { tone: 'danger' | 'success' | 'neutral'; icon?: IconName; children: ReactNode }) {
  const colors = useThemeColors();
  const bg = { danger: colors.danger, success: colors.success, neutral: colors.hero }[tone];
  return (
    <View style={[styles.heroChip, { backgroundColor: bg }]}>
      {icon ? <Ionicons name={icon} size={13} color="#FFFFFF" /> : null}
      <Text style={styles.heroChipText}>{children}</Text>
    </View>
  );
}

export function HeroProgress({ value }: { value: number }) {
  const colors = useThemeColors();
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <View style={[styles.heroTrack, { backgroundColor: colors.hero }]}>
      <View style={[styles.heroFill, { width: `${clamped * 100}%`, backgroundColor: colors.success }]} />
    </View>
  );
}

export function HeroLink({ label, onPress }: { label: string; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={styles.heroLink}>
      <Text style={[styles.heroLinkText, { color: colors.heroText }]}>{label}</Text>
      <Ionicons name="arrow-forward" size={15} color={colors.heroText} />
    </Pressable>
  );
}

/* ---------- İç bileşenler ---------- */

function SectionTitle({ children }: { children: ReactNode }) {
  const colors = useThemeColors();
  return <Text style={[styles.sectionTitle, { color: colors.text }]}>{children}</Text>;
}

function ActionRow({ action, showDivider }: { action: ActionItem; showDivider: boolean }) {
  const colors = useThemeColors();
  const tint = colors.tints[action.tint];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tapFeedback();
        action.onPress();
      }}
      style={({ pressed }) => [
        styles.actionRow,
        showDivider && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
        pressed && { backgroundColor: colors.surfaceMuted },
      ]}>
      <View style={[styles.actionIcon, { backgroundColor: tint.bg }]}>
        <Ionicons name={action.icon} size={20} color={tint.fg} />
      </View>
      <View style={styles.flex}>
        <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={2}>
          {action.title}
        </Text>
        {action.subtitle ? (
          <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
            {action.subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function QuickTile({ tile }: { tile: HomeTile }) {
  const colors = useThemeColors();
  const tint = colors.tints[tile.tint];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tile.badge ? `${tile.title}, ${tile.badge} bekleyen` : tile.title}
      onPress={() => {
        tapFeedback();
        tile.onPress();
      }}
      style={({ pressed }) => [styles.tile, { backgroundColor: tint.bg }, pressed && styles.pressed]}>
      <View style={styles.tileHeader}>
        <View style={[styles.tileIcon, { backgroundColor: colors.surface }]}>
          <Ionicons name={tile.icon} size={22} color={tint.fg} />
        </View>
        {tile.badge ? (
          <View style={[styles.badge, { backgroundColor: colors.danger }]}>
            <Text style={styles.badgeText}>{tile.badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[typography.bodyStrong, { color: tint.fg }]}>{tile.title}</Text>
      <Text style={[typography.caption, { color: tint.fg, opacity: 0.8 }]} numberOfLines={2}>
        {tile.description}
      </Text>
    </Pressable>
  );
}

function LatestAnnouncementCard({ onOpen, onOpenAll }: { onOpen: (id: string) => void; onOpenAll: () => void }) {
  const colors = useThemeColors();
  // undefined: yükleniyor, null: hiç duyuru yok
  const [latest, setLatest] = useState<Announcement | null | undefined>(undefined);

  useEffect(() => subscribeToLatestAnnouncement(setLatest, () => setLatest(null)), []);

  const accent = latest?.important ? colors.warning : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={latest ? `Son duyuru: ${latest.title}` : 'Duyurular'}
      onPress={() => {
        tapFeedback();
        if (latest) onOpen(latest.id);
        else onOpenAll();
      }}
      style={({ pressed }) => pressed && styles.pressed}>
      <Card padded={false} style={styles.announcement}>
        <View style={[styles.announcementAccent, { backgroundColor: accent }]} />
        <View style={styles.announcementBody}>
          <View style={styles.announcementMeta}>
            <Ionicons name={latest?.important ? 'alert-circle' : 'megaphone'} size={15} color={accent} />
            <Text style={[styles.announcementLabel, { color: accent }]}>
              {latest?.important ? 'Önemli' : 'Duyuru'}
            </Text>
            {latest ? (
              <Text style={[typography.caption, styles.announcementDate, { color: colors.textMuted }]}>
                {formatRelativeDate(latest.createdAt)}
              </Text>
            ) : null}
          </View>
          <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={2}>
            {latest === undefined ? 'Yükleniyor…' : (latest?.title ?? 'Henüz duyuru yok')}
          </Text>
          {latest ? (
            <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={2}>
              {latest.body}
            </Text>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  scroll: {
    paddingBottom: spacing.xl,
  },
  hero: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    gap: spacing.md,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  heroGreeting: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTrack: {
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginVertical: 4,
  },
  heroFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  heroLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 4,
  },
  heroLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  body: {
    padding: spacing.md,
    gap: spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcement: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  announcementAccent: {
    width: 5,
  },
  announcementBody: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
  },
  announcementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  announcementLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  announcementDate: {
    marginLeft: 'auto',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm + 4,
  },
  tile: {
    width: '48.3%',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  tileIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
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
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
