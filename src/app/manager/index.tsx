import { DashboardScreen, type DashboardFeature } from '@/components/dashboard-screen';

const FEATURES: DashboardFeature[] = [
  { title: 'Duyurular', description: 'Su kesintisi, toplantı gibi duyuruları yayınla.' },
  { title: 'Aidat takibi', description: 'Aylık aidatları oluştur, ödenenleri işaretle.' },
  { title: 'Giderler', description: 'Apartman harcamalarını ve faturaları paylaş.' },
  { title: 'Arıza talepleri', description: 'Sakinlerden gelen talepleri takip et.' },
  { title: 'Anketler', description: 'Karar gerektiren konularda oylama başlat.' },
];

export default function ManagerDashboard() {
  return <DashboardScreen title="Yönetici Paneli" features={FEATURES} />;
}
