import { HomeScreen, type HomeFeature } from '@/components/home-screen';

const FEATURES: HomeFeature[] = [
  { title: 'Duyurular', description: 'Apartmandaki son gelişmeler.', icon: 'megaphone-outline' },
  { title: 'Aidatlarım', description: 'Bu ayki ve geçmiş aidat durumun.', icon: 'wallet-outline' },
  { title: 'Giderler', description: 'Aidatlar nereye harcandı?', icon: 'receipt-outline' },
  { title: 'Arıza bildir', description: 'Sorunu fotoğrafla yöneticiye ilet.', icon: 'construct-outline' },
  { title: 'Anketler', description: 'Apartman kararlarında oy kullan.', icon: 'stats-chart-outline' },
];

export default function ResidentHome() {
  return <HomeScreen features={FEATURES} />;
}
