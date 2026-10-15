import { router } from 'expo-router';

import {
  HeroAmount,
  HeroChip,
  HeroLabel,
  HeroLink,
  HomeScreen,
  type ActionItem,
  type HomeTile,
} from '@/components/home-screen';
import { useAuth } from '@/context/auth-context';
import { useResidentSummary } from '@/hooks/use-home-summary';
import { formatMoney } from '@/lib/money';
import type { UserProfile } from '@/types/user';

const TILES: HomeTile[] = [
  {
    title: 'Aidatlarım',
    description: 'Bu ayki ve geçmiş aidatların',
    icon: 'wallet-outline',
    tint: 'indigo',
    onPress: () => router.navigate('/resident/dues'),
  },
  {
    title: 'Arıza bildir',
    description: 'Sorunu yöneticiye ilet',
    icon: 'construct-outline',
    tint: 'teal',
    onPress: () => router.push('/resident/issues'),
  },
  {
    title: 'Anketler',
    description: 'Kararlarda oyunu kullan',
    icon: 'stats-chart-outline',
    tint: 'coral',
    onPress: () => router.navigate('/resident/polls'),
  },
  {
    title: 'Giderler',
    description: 'Aidatlar nereye harcandı?',
    icon: 'receipt-outline',
    tint: 'pink',
    onPress: () => router.push('/resident/expenses'),
  },
  {
    title: 'Önemli numaralar',
    description: 'Yönetici, tesisatçı, asansör...',
    icon: 'call-outline',
    tint: 'blue',
    onPress: () => router.push('/resident/contacts'),
  },
  {
    title: 'Yıllık rapor',
    description: 'Yılın gelir-gider özeti',
    icon: 'document-text-outline',
    tint: 'amber',
    onPress: () => router.push('/resident/report'),
  },
];

export default function ResidentHome() {
  const { profile } = useAuth();
  if (!profile) return null;
  return <ResidentHomeContent profile={profile} />;
}

function ResidentHomeContent({ profile }: { profile: UserProfile }) {
  const summary = useResidentSummary(profile);

  const actions: ActionItem[] = [];
  if (summary.pendingPolls.length > 0) {
    const first = summary.pendingPolls[0];
    actions.push({
      key: 'polls',
      icon: 'stats-chart',
      tint: 'coral',
      title:
        summary.pendingPolls.length === 1
          ? 'Bir anket oyunuzu bekliyor'
          : `${summary.pendingPolls.length} anket oyunuzu bekliyor`,
      subtitle: first.question,
      onPress: () =>
        summary.pendingPolls.length === 1
          ? router.push({ pathname: '/resident/polls/[id]', params: { id: first.id } })
          : router.navigate('/resident/polls'),
    });
  }
  for (const issue of summary.activeIssues) {
    actions.push({
      key: `issue-${issue.id}`,
      icon: issue.status === 'in_progress' ? 'construct' : 'time-outline',
      tint: 'teal',
      title: issue.status === 'in_progress' ? 'Talebiniz işlemde' : 'Talebiniz yöneticiye iletildi',
      subtitle: issue.managerNote || issue.title,
      onPress: () => router.push({ pathname: '/resident/issues/[id]', params: { id: issue.id } }),
    });
  }
  for (const issue of summary.recentlyResolved) {
    actions.push({
      key: `resolved-${issue.id}`,
      icon: 'checkmark-circle',
      tint: 'teal',
      title: 'Talebiniz çözüldü',
      subtitle: issue.title,
      onPress: () => router.push({ pathname: '/resident/issues/[id]', params: { id: issue.id } }),
    });
  }

  return (
    <HomeScreen
      hero={<ResidentHero summary={summary} />}
      actions={actions}
      tiles={TILES}
      onOpenAnnouncement={(id) => router.push({ pathname: '/resident/announcements/[id]', params: { id } })}
      onOpenAnnouncements={() => router.navigate('/resident/announcements')}
    />
  );
}

function ResidentHero({ summary }: { summary: ReturnType<typeof useResidentSummary> }) {
  const openDues = () => router.navigate('/resident/dues');

  if (summary.loading) {
    return (
      <>
        <HeroLabel>Aidat durumu</HeroLabel>
        <HeroAmount>…</HeroAmount>
      </>
    );
  }

  if (!summary.hasDues) {
    return (
      <>
        <HeroLabel>Aidat durumu</HeroLabel>
        <HeroAmount>Henüz aidat yok</HeroAmount>
        <HeroChip tone="neutral" icon="information-circle">
          Yönetici dönem açınca burada görünecek
        </HeroChip>
      </>
    );
  }

  if (summary.outstanding > 0) {
    return (
      <>
        <HeroLabel>Ödenmemiş aidat</HeroLabel>
        <HeroAmount>{formatMoney(summary.outstanding)}</HeroAmount>
        <HeroChip tone="danger" icon="alert-circle">
          {summary.unpaidCount === 1 ? '1 ay ödenmedi' : `${summary.unpaidCount} ay ödenmedi`}
        </HeroChip>
        <HeroLink label="Aidatlarımı gör" onPress={openDues} />
      </>
    );
  }

  return (
    <>
      <HeroLabel>Aidat durumu</HeroLabel>
      <HeroAmount>Borcunuz yok</HeroAmount>
      <HeroChip tone="success" icon="checkmark-circle">
        {summary.currentDue ? 'Bu ayın aidatı ödendi' : 'Tüm aidatlar ödendi'}
      </HeroChip>
      <HeroLink label="Aidatlarımı gör" onPress={openDues} />
    </>
  );
}
