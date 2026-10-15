import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PollStatusChip } from '@/components/polls/poll-status-chip';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { Notice } from '@/components/ui/notice';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { APARTMENT_COUNT } from '@/constants/apartment';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { subscribeToPolls } from '@/services/polls';
import type { Poll } from '@/types/poll';

interface PollsListScreenProps {
  onOpen: (id: string) => void;
  /** Verilirse "yeni anket" butonları görünür (sadece yönetici). */
  onCreate?: () => void;
}

export function PollsListScreen({ onOpen, onCreate }: PollsListScreenProps) {
  const colors = useThemeColors();
  const [polls, setPolls] = useState<Poll[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeToPolls(
        (list) => {
          setPolls(list);
          setError(null);
        },
        () => setError('Anketler yüklenemedi. İnternet bağlantınızı kontrol edin.'),
      ),
    [],
  );

  return (
    <Screen
      title="Anketler"
      headerRight={
        onCreate ? <IconButton icon="add" accessibilityLabel="Yeni anket aç" onPress={onCreate} /> : undefined
      }>
      {error ? <Notice tone="danger" message={error} /> : null}

      {polls === null && !error ? <SkeletonList /> : null}

      {polls?.length === 0 ? (
        <EmptyState
          icon="stats-chart-outline"
          title="Henüz anket yok"
          description={
            onCreate
              ? '"Dış cephe boyansın mı?" gibi kararları dairelere oylatabilirsiniz. Her daire bir oy kullanır.'
              : 'Yönetici bir anket açtığında burada oy kullanabileceksiniz.'
          }
          action={onCreate ? <Button title="İlk anketi aç" icon="add-circle-outline" onPress={onCreate} /> : null}
        />
      ) : null}

      {polls?.map((poll) => <PollCard key={poll.id} poll={poll} onPress={() => onOpen(poll.id)} />)}
    </Screen>
  );
}

function PollCard({ poll, onPress }: { poll: Poll; onPress: () => void }) {
  const colors = useThemeColors();
  const { profile } = useAuth();
  const voted = profile?.apartmentNo != null && poll.votedApartments.includes(profile.apartmentNo);
  const participation = poll.votedApartments.length;
  const needsVote = !poll.closed && !voted && profile?.apartmentNo != null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${poll.question}${needsVote ? ', oyunuzu bekliyor' : ''}`}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <Card style={[styles.card, needsVote && { borderColor: colors.primary, borderWidth: 1 }]}>
        <View style={styles.header}>
          <PollStatusChip closed={poll.closed} />
          {voted ? (
            <View style={[styles.voted, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="checkmark-done" size={14} color={colors.primary} />
              <Text style={[styles.votedText, { color: colors.primary }]}>Oy verdiniz</Text>
            </View>
          ) : null}
        </View>

        <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={3}>
          {poll.question}
        </Text>

        <ProgressBar value={participation / APARTMENT_COUNT} color={colors.primary} />
        <View style={styles.footer}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {participation}/{APARTMENT_COUNT} daire oy kullandı
          </Text>
          {needsVote ? (
            <Text style={[typography.caption, styles.bold, { color: colors.primary }]}>Oy ver →</Text>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: spacing.xl,
  },
  pressed: {
    opacity: 0.85,
  },
  bold: {
    fontWeight: '700',
  },
  card: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  voted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  votedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
