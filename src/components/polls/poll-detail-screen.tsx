import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PollResults } from '@/components/polls/poll-results';
import { PollStatusChip } from '@/components/polls/poll-status-chip';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { APARTMENT_NUMBERS } from '@/constants/apartment';
import { radius, spacing, typography, useThemeColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { formatRelativeDate } from '@/lib/date';
import {
  castVote,
  deletePoll,
  PollError,
  setPollClosed,
  subscribeToMyVote,
  subscribeToPoll,
  subscribeToPollVotes,
} from '@/services/polls';
import type { Poll, PollVote } from '@/types/poll';

interface PollDetailScreenProps {
  id: string;
  /** true ise kapat/sil butonları ve daire bazlı oy dökümü gösterilir (sadece yönetici). */
  canManage?: boolean;
}

export function PollDetailScreen({ id, canManage = false }: PollDetailScreenProps) {
  const colors = useThemeColors();
  const { profile } = useAuth();
  const apartmentNo = profile?.apartmentNo ?? null;

  // undefined: yükleniyor, null: bulunamadı / silindi
  const [poll, setPoll] = useState<Poll | null | undefined>(undefined);
  const [myVote, setMyVote] = useState<PollVote | null>(null);
  const [allVotes, setAllVotes] = useState<PollVote[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState<'vote' | 'close' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeToPoll(id, setPoll, () => setError('Anket yüklenemedi.')), [id]);

  useEffect(() => {
    if (apartmentNo === null) return;
    return subscribeToMyVote(id, apartmentNo, setMyVote, () => undefined);
  }, [id, apartmentNo]);

  useEffect(() => {
    if (!canManage) return;
    return subscribeToPollVotes(id, setAllVotes, () => undefined);
  }, [id, canManage]);

  if ((poll === undefined && !error) || (!poll && busy === 'delete')) {
    return (
      <Screen edges={['bottom']}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }

  if (!poll) {
    return (
      <Screen edges={['bottom']}>
        <Notice tone="warning" message={error ?? 'Bu anket bulunamadı. Silinmiş olabilir.'} />
        <Button title="Geri dön" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const current = poll;
  const voted = apartmentNo !== null && current.votedApartments.includes(apartmentNo);
  const canVote = !current.closed && !voted && apartmentNo !== null && profile !== null;
  // Sakin, sonuçlardan etkilenmesin diye sonuçları oy verdikten veya anket kapandıktan sonra görür.
  const showResults = canManage || voted || current.closed || apartmentNo === null;

  function confirmVote() {
    const option = current.options.find((o) => o.id === selected);
    if (!option || !profile) return;
    Alert.alert(
      'Oyunuzu onaylayın',
      `Daire ${apartmentNo} adına "${option.text}" seçeneğine oy verilecek. Oy sonradan değiştirilemez.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Oy ver',
          onPress: async () => {
            setError(null);
            setBusy('vote');
            try {
              await castVote(current.id, option.id, profile);
            } catch (err) {
              setError(err instanceof PollError ? err.message : 'Oy kaydedilemedi.');
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  }

  async function toggleClosed() {
    setError(null);
    setBusy('close');
    try {
      await setPollClosed(current.id, !current.closed);
    } catch {
      setError('Anket durumu değiştirilemedi.');
    } finally {
      setBusy(null);
    }
  }

  function confirmDelete() {
    Alert.alert('Anketi sil', 'Anket ve tüm oylar kalıcı olarak silinecek. Emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          setError(null);
          setBusy('delete');
          try {
            await deletePoll(current.id);
            router.back();
          } catch {
            setError('Anket silinemedi.');
            setBusy(null);
          }
        },
      },
    ]);
  }

  return (
    <Screen edges={['bottom']}>
      <Card style={styles.header}>
        <PollStatusChip closed={current.closed} />
        <Text style={[typography.title, { color: colors.text }]}>{current.question}</Text>
        {current.description ? (
          <Text style={[typography.body, { color: colors.textMuted }]}>{current.description}</Text>
        ) : null}
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          {current.authorName} · {formatRelativeDate(current.createdAt)}
        </Text>
      </Card>

      {canVote ? (
        <Card style={styles.section}>
          <Text style={[typography.label, { color: colors.textMuted }]}>
            DAİRE {apartmentNo} ADINA OY VERİN
          </Text>
          {current.options.map((option) => {
            const isSelected = option.id === selected;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                onPress={() => setSelected(option.id)}
                disabled={busy !== null}
                style={[
                  styles.option,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primarySoft : colors.surface,
                  },
                ]}>
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={isSelected ? colors.primary : colors.textMuted}
                />
                <Text style={[typography.body, styles.flex, { color: colors.text }]}>{option.text}</Text>
              </Pressable>
            );
          })}
          <Button
            title="Oyumu gönder"
            icon="checkmark-circle-outline"
            onPress={confirmVote}
            disabled={!selected}
            loading={busy === 'vote'}
          />
        </Card>
      ) : null}

      {showResults ? (
        <Card style={styles.section}>
          <View style={styles.resultsHeader}>
            <Text style={[typography.label, styles.flex, { color: colors.textMuted }]}>SONUÇLAR</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {current.votedApartments.length}/{APARTMENT_NUMBERS.length} daire oy kullandı
            </Text>
          </View>
          <PollResults poll={current} myOptionId={myVote?.optionId} />
        </Card>
      ) : (
        <Notice message="Sonuçlar, oyunuzu kullandıktan sonra görünecek." />
      )}

      <Participation poll={current} />

      {canManage ? <VoteBreakdown poll={current} votes={allVotes} /> : null}

      {apartmentNo === null && !canManage ? (
        <Notice tone="warning" message="Hesabınıza daire atanmadığı için oy kullanamazsınız." />
      ) : null}

      {error ? <Notice tone="danger" message={error} /> : null}

      {canManage ? (
        <View style={styles.actions}>
          <Button
            title={current.closed ? 'Oylamayı yeniden aç' : 'Oylamayı kapat'}
            icon={current.closed ? 'lock-open-outline' : 'lock-closed-outline'}
            variant="secondary"
            onPress={toggleClosed}
            loading={busy === 'close'}
            disabled={busy !== null}
          />
          <Button
            title="Anketi sil"
            icon="trash-outline"
            variant="danger"
            onPress={confirmDelete}
            disabled={busy !== null}
          />
        </View>
      ) : null}
    </Screen>
  );
}

/** Hangi dairelerin oy kullandığı (neye oy verdikleri değil). */
function Participation({ poll }: { poll: Poll }) {
  const colors = useThemeColors();
  return (
    <Card style={styles.section}>
      <Text style={[typography.label, { color: colors.textMuted }]}>KATILIM</Text>
      <View style={styles.apartments}>
        {APARTMENT_NUMBERS.map((no) => {
          const voted = poll.votedApartments.includes(no);
          return (
            <View
              key={no}
              accessible
              accessibilityLabel={`Daire ${no}: ${voted ? 'oy kullandı' : 'oy kullanmadı'}`}
              style={[
                styles.apartment,
                { backgroundColor: voted ? colors.successSoft : colors.surfaceMuted },
              ]}>
              <Text style={[styles.apartmentText, { color: voted ? colors.success : colors.textMuted }]}>
                {no}
              </Text>
              {voted ? <Ionicons name="checkmark" size={12} color={colors.success} /> : null}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

/** Yönetici için daire bazlı oy dökümü. */
function VoteBreakdown({ poll, votes }: { poll: Poll; votes: PollVote[] }) {
  const colors = useThemeColors();
  if (votes.length === 0) return null;
  const optionText = (id: string) => poll.options.find((o) => o.id === id)?.text ?? '—';

  return (
    <Card style={styles.section}>
      <Text style={[typography.label, { color: colors.textMuted }]}>DAİRE BAZLI OYLAR (SADECE YÖNETİCİ)</Text>
      {votes.map((vote) => (
        <View key={vote.apartmentNo} style={styles.breakdownRow}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>Daire {vote.apartmentNo}</Text>
          <Text style={[typography.body, styles.breakdownOption, { color: colors.textMuted }]} numberOfLines={1}>
            {optionText(vote.optionId)}
          </Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: {
    marginTop: spacing.xl,
  },
  header: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apartments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  apartment: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apartmentText: {
    fontSize: 16,
    fontWeight: '700',
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  breakdownOption: {
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    gap: spacing.sm,
  },
});
