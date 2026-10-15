import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { formatRelativeDate } from '@/lib/date';
import type { Announcement } from '@/types/announcement';

interface AnnouncementCardProps {
  announcement: Announcement;
  onPress: () => void;
  /** Bu telefonda henüz açılmadıysa "Yeni" etiketi gösterilir. */
  isNew?: boolean;
}

/** Duyuru listesindeki tek kart: başlık, kısa metin, tarih; önemliyse vurgulu. */
export function AnnouncementCard({ announcement, onPress, isNew = false }: AnnouncementCardProps) {
  const colors = useThemeColors();
  const { important } = announcement;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${isNew ? 'Yeni. ' : ''}${important ? 'Önemli duyuru: ' : ''}${announcement.title}`}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <Card style={[styles.card, important && { borderColor: colors.warning, borderWidth: 1 }]}>
        {important || isNew ? (
          <View style={styles.badges}>
            {isNew ? (
              <View style={[styles.importantBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.importantText, { color: colors.primaryText }]}>Yeni</Text>
              </View>
            ) : null}
            {important ? (
              <View style={[styles.importantBadge, { backgroundColor: colors.warningSoft }]}>
                <Ionicons name="alert-circle" size={14} color={colors.warning} />
                <Text style={[styles.importantText, { color: colors.warning }]}>Önemli</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={2}>
          {announcement.title}
        </Text>
        <Text style={[styles.body, { color: colors.textMuted }]} numberOfLines={3}>
          {announcement.body}
        </Text>
        <View style={styles.meta}>
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {formatRelativeDate(announcement.createdAt)}
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>·</Text>
          <Text style={[typography.caption, styles.author, { color: colors.textMuted }]} numberOfLines={1}>
            {announcement.authorName}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  card: {
    gap: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  importantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  importantText: {
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  author: {
    flexShrink: 1,
  },
});
