import { router } from 'expo-router';

import { HomeScreen, type HomeFeature } from '@/components/home-screen';

const FEATURES: HomeFeature[] = [
  {
    title: 'Aidatlar',
    description: 'Aylık aidatları oluştur, ödenenleri işaretle.',
    icon: 'wallet-outline',
    onPress: () => router.navigate('/manager/dues'),
  },
  { title: 'Giderler', description: 'Harcamaları ve faturaları paylaş.', icon: 'receipt-outline' },
  { title: 'Arıza talepleri', description: 'Sakinlerden gelen talepleri takip et.', icon: 'construct-outline' },
  { title: 'Anketler', description: 'Kararlar için oylama başlat.', icon: 'stats-chart-outline' },
];

export default function ManagerHome() {
  return (
    <HomeScreen
      features={FEATURES}
      onOpenAnnouncement={(id) => router.push({ pathname: '/manager/announcements/[id]', params: { id } })}
      onOpenAnnouncements={() => router.navigate('/manager/announcements')}
    />
  );
}
