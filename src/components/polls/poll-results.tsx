import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { totalVotes, type Poll } from '@/types/poll';

interface PollResultsProps {
  poll: Poll;
  /** Bu dairenin seçtiği seçenek (vurgulanır). */
  myOptionId?: string | null;
}

/** Seçenek başına yüzdeli yatay çubuk grafik. En çok oy alan seçenek koyu renkte. */
export function PollResults({ poll, myOptionId }: PollResultsProps) {
  const colors = useThemeColors();
  const total = totalVotes(poll);
  const max = Math.max(0, ...Object.values(poll.counts));

  return (
    <View style={styles.list}>
      {poll.options.map((option) => {
        const count = poll.counts[option.id] ?? 0;
        const ratio = total > 0 ? count / total : 0;
        const leading = count > 0 && count === max;
        const mine = option.id === myOptionId;

        return (
          <View
            key={option.id}
            accessible
            accessibilityLabel={`${option.text}: ${count} oy, yüzde ${Math.round(ratio * 100)}${mine ? ', sizin oyunuz' : ''}`}
            style={styles.item}>
            <View style={styles.labelRow}>
              <Text
                style={[typography.body, styles.optionText, { color: colors.text }, leading && styles.bold]}
                numberOfLines={2}>
                {option.text}
              </Text>
              {mine ? (
                <View style={[styles.mine, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="checkmark" size={12} color={colors.primary} />
                  <Text style={[styles.mineText, { color: colors.primary }]}>Oyunuz</Text>
                </View>
              ) : null}
              <Text style={[typography.bodyStrong, { color: colors.text }]}>
                %{Math.round(ratio * 100)}
              </Text>
            </View>
            <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${ratio * 100}%`,
                    backgroundColor: leading ? colors.primary : colors.primarySoft,
                  },
                ]}
              />
            </View>
            <Text style={[typography.caption, { color: colors.textMuted }]}>{count} oy</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  item: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionText: {
    flex: 1,
  },
  bold: {
    fontWeight: '700',
  },
  mine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mineText: {
    fontSize: 11,
    fontWeight: '700',
  },
  track: {
    height: 12,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
