import { router } from 'expo-router';

import {
  HeroAmount,
  HeroChip,
  HeroLabel,
  HeroLink,
  HeroProgress,
  HomeScreen,
  type ActionItem,
  type HomeTile,
} from '@/components/home-screen';
import { useAuth } from '@/context/auth-context';
import { useManagerSummary } from '@/hooks/use-home-summary';
import { formatMoney } from '@/lib/money';
import { formatPeriod } from '@/types/dues';
import type { UserProfile } from '@/types/user';

export default function ManagerHome() {
  const { profile } = useAuth();
  if (!profile) return null;
  return <ManagerHomeContent profile={profile} />;
}

function ManagerHomeContent({ profile }: { profile: UserProfile }) {
  const summary = useManagerSummary(profile);
  const activeIssueCount = summary.newIssues.length + summary.inProgressIssues.length;
  const now = new Date();
  const monthName = formatPeriod(now.getFullYear(), now.getMonth() + 1);

  const actions: ActionItem[] = [];
  if (summary.newIssues.length > 0) {
    actions.push({
      key: 'new-issues',
      icon: 'alert-circle',
      tint: 'teal',
      title:
        summary.newIssues.length === 1 ? 'Yeni bir arıza talebi var' : `${summary.newIssues.length} yeni arıza talebi`,
      subtitle: summary.newIssues[0].title,
      onPress: () =>
        summary.newIssues.length === 1
          ? router.push({ pathname: '/manager/issues/[id]', params: { id: summary.newIssues[0].id } })
          : router.push('/manager/issues'),
    });
  }
  if (!summary.loading && !summary.hasCurrentPeriod) {
    actions.push({
      key: 'open-period',
      icon: 'wallet',
      tint: 'indigo',
      title: `${monthName} aidat dönemi açılmadı`,
      subtitle: 'Dönemi açınca tüm daireler için kayıt oluşur',
      onPress: () => router.push('/manager/dues/new'),
    });
  } else if (summary.unpaidThisMonth > 0) {
    actions.push({
      key: 'unpaid',
      icon: 'wallet',
      tint: 'indigo',
      title: `${summary.unpaidThisMonth} daire bu ayın aidatını ödemedi`,
      subtitle: `Kalan: ${formatMoney(summary.month.outstanding)}`,
      onPress: () => router.push({ pathname: '/manager/dues/[periodId]', params: { periodId: summary.periodId } }),
    });
  }
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
          ? router.push({ pathname: '/manager/polls/[id]', params: { id: first.id } })
          : router.navigate('/manager/polls'),
    });
  }
  if (summary.inProgressIssues.length > 0) {
    actions.push({
      key: 'in-progress',
      icon: 'construct',
      tint: 'teal',
      title: `${summary.inProgressIssues.length} talep işlemde`,
      subtitle: 'Çözülünce "Çözüldü" olarak işaretlemeyi unutmayın',
      onPress: () => router.push('/manager/issues'),
    });
  }

  const tiles: HomeTile[] = [
    {
      title: 'Aidatlar',
      description: 'Dönem aç, ödemeleri işaretle',
      icon: 'wallet-outline',
      tint: 'indigo',
      onPress: () => router.navigate('/manager/dues'),
    },
    {
      title: 'Arıza talepleri',
      description: activeIssueCount > 0 ? `${activeIssueCount} talep bekliyor` : 'Bekleyen talep yok',
      icon: 'construct-outline',
      tint: 'teal',
      onPress: () => router.push('/manager/issues'),
      badge: activeIssueCount,
    },
    {
      title: 'Anketler',
      description: 'Kararlar için oylama aç',
      icon: 'stats-chart-outline',
      tint: 'coral',
      onPress: () => router.navigate('/manager/polls'),
    },
    {
      title: 'Giderler',
      description: 'Harcamalar ve kasa',
      icon: 'receipt-outline',
      tint: 'pink',
      onPress: () => router.push('/manager/expenses'),
    },
    {
      title: 'Önemli numaralar',
      description: 'Rehberi ve IBAN bilgisini düzenle',
      icon: 'call-outline',
      tint: 'blue',
      onPress: () => router.push('/manager/contacts'),
    },
    {
      title: 'Yıllık rapor',
      description: 'Gelir-gider özetini yayınla',
      icon: 'document-text-outline',
      tint: 'amber',
      onPress: () => router.push('/manager/report'),
    },
  ];

  return (
    <HomeScreen
      hero={<ManagerHero summary={summary} monthName={monthName} />}
      actions={actions}
      tiles={tiles}
      onOpenAnnouncement={(id) => router.push({ pathname: '/manager/announcements/[id]', params: { id } })}
      onOpenAnnouncements={() => router.navigate('/manager/announcements')}
    />
  );
}

function ManagerHero({
  summary,
  monthName,
}: {
  summary: ReturnType<typeof useManagerSummary>;
  monthName: string;
}) {
  if (summary.loading) {
    return (
      <>
        <HeroLabel>{monthName} tahsilatı</HeroLabel>
        <HeroAmount>…</HeroAmount>
      </>
    );
  }

  if (!summary.hasCurrentPeriod) {
    return (
      <>
        <HeroLabel>{monthName} tahsilatı</HeroLabel>
        <HeroAmount>Dönem açılmadı</HeroAmount>
        <HeroLink label="Aidat dönemi aç" onPress={() => router.push('/manager/dues/new')} />
      </>
    );
  }

  const { month } = summary;
  const complete = month.paidCount === month.count;

  return (
    <>
      <HeroLabel>{monthName} tahsilatı</HeroLabel>
      <HeroAmount>
        {formatMoney(month.collected)}
        <HeroLabel> / {formatMoney(month.total)}</HeroLabel>
      </HeroAmount>
      <HeroProgress value={month.count ? month.paidCount / month.count : 0} />
      <HeroChip tone={complete ? 'success' : 'neutral'} icon={complete ? 'checkmark-circle' : 'people'}>
        {complete ? 'Tüm daireler ödedi' : `${month.paidCount}/${month.count} daire ödedi`}
      </HeroChip>
      <HeroLink
        label="Ödemeleri işaretle"
        onPress={() => router.push({ pathname: '/manager/dues/[periodId]', params: { periodId: summary.periodId } })}
      />
    </>
  );
}
