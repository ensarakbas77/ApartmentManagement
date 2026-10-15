import { DashboardScreen, type DashboardFeature } from '@/components/dashboard-screen';

const FEATURES: DashboardFeature[] = [
  { title: 'Duyurular', description: 'Apartmandaki son gelişmeleri gör.' },
  { title: 'Aidatlarım', description: 'Bu ayki ve geçmiş aidat durumun.' },
  { title: 'Giderler', description: 'Aidatların nereye harcandığını incele.' },
  { title: 'Arıza bildir', description: 'Bir sorunu fotoğrafla yöneticiye ilet.' },
  { title: 'Anketler', description: 'Apartman kararlarında oyunu kullan.' },
];

export default function ResidentDashboard() {
  return <DashboardScreen title="Ana Sayfa" features={FEATURES} />;
}
