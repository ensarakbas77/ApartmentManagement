import { router } from 'expo-router';

import { HomeScreen, type HomeFeature } from '@/components/home-screen';

const FEATURES: HomeFeature[] = [
  {
    title: 'Arıza bildir',
    description: 'Bir sorunu yöneticiye ilet, durumunu takip et.',
    icon: 'construct-outline',
    onPress: () => router.push('/resident/issues'),
  },
  {
    title: 'Aidatlarım',
    description: 'Bu ayki ve geçmiş aidat durumun.',
    icon: 'wallet-outline',
    onPress: () => router.navigate('/resident/dues'),
  },
  {
    title: 'Anketler',
    description: 'Apartman kararlarında oy kullan.',
    icon: 'stats-chart-outline',
    onPress: () => router.navigate('/resident/polls'),
  },
  { title: 'Giderler', description: 'Aidatlar nereye harcandı?', icon: 'receipt-outline' },
];

export default function ResidentHome() {
  return (
    <HomeScreen
      features={FEATURES}
      onOpenAnnouncement={(id) => router.push({ pathname: '/resident/announcements/[id]', params: { id } })}
      onOpenAnnouncements={() => router.navigate('/resident/announcements')}
    />
  );
}
