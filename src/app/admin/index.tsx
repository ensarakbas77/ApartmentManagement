import { DashboardScreen, type DashboardFeature } from '@/components/dashboard-screen';

const FEATURES: DashboardFeature[] = [
  { title: 'Kullanıcılar', description: 'Daire hesaplarını oluştur, düzenle ve listele.' },
  { title: 'Şifre sıfırlama', description: 'Şifresini unutan sakine yeni şifre ver.' },
  { title: 'Rol yönetimi', description: 'Yönetici ve sakin rollerini ata.' },
];

export default function AdminDashboard() {
  return <DashboardScreen title="Admin Paneli" features={FEATURES} />;
}
