import { router } from 'expo-router';

import { HomeScreen, type HomeFeature } from '@/components/home-screen';
import { useActiveIssueCount } from '@/hooks/use-active-issue-count';

export default function ManagerHome() {
  const activeIssues = useActiveIssueCount();

  const features: HomeFeature[] = [
    {
      title: 'Arıza talepleri',
      description:
        activeIssues > 0 ? `${activeIssues} talep çözülmeyi bekliyor.` : 'Bekleyen talep yok.',
      icon: 'construct-outline',
      onPress: () => router.push('/manager/issues'),
      badge: activeIssues,
    },
    {
      title: 'Aidatlar',
      description: 'Aylık aidatları oluştur, ödenenleri işaretle.',
      icon: 'wallet-outline',
      onPress: () => router.navigate('/manager/dues'),
    },
    {
      title: 'Anketler',
      description: 'Kararlar için oylama başlat.',
      icon: 'stats-chart-outline',
      onPress: () => router.navigate('/manager/polls'),
    },
    { title: 'Giderler', description: 'Harcamaları ve faturaları paylaş.', icon: 'receipt-outline' },
  ];

  return (
    <HomeScreen
      features={features}
      onOpenAnnouncement={(id) => router.push({ pathname: '/manager/announcements/[id]', params: { id } })}
      onOpenAnnouncements={() => router.navigate('/manager/announcements')}
    />
  );
}
