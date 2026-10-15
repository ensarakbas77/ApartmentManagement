import { HomeScreen, type HomeFeature } from '@/components/home-screen';

const FEATURES: HomeFeature[] = [
  { title: 'Duyurular', description: 'Su kesintisi, toplantı gibi duyuruları yayınla.', icon: 'megaphone-outline' },
  { title: 'Aidatlar', description: 'Aylık aidatları oluştur, ödenenleri işaretle.', icon: 'wallet-outline' },
  { title: 'Giderler', description: 'Harcamaları ve faturaları paylaş.', icon: 'receipt-outline' },
  { title: 'Arıza talepleri', description: 'Sakinlerden gelen talepleri takip et.', icon: 'construct-outline' },
  { title: 'Anketler', description: 'Kararlar için oylama başlat.', icon: 'stats-chart-outline' },
];

export default function ManagerHome() {
  return <HomeScreen features={FEATURES} />;
}
