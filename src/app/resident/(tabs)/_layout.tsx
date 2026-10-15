import { RoleTabs } from '@/components/role-tabs';
import { useUnreadAnnouncements } from '@/hooks/use-unread-announcements';

export default function ResidentTabsLayout() {
  const { count } = useUnreadAnnouncements();

  return (
    <RoleTabs
      tabs={[
        { name: 'index', title: 'Ana Sayfa', icon: 'home-outline', iconFocused: 'home' },
        {
          name: 'announcements',
          title: 'Duyurular',
          icon: 'megaphone-outline',
          iconFocused: 'megaphone',
          badge: count,
        },
        { name: 'dues', title: 'Aidatlarım', icon: 'wallet-outline', iconFocused: 'wallet' },
        { name: 'polls', title: 'Anketler', icon: 'stats-chart-outline', iconFocused: 'stats-chart' },
        { name: 'account', title: 'Hesabım', icon: 'person-circle-outline', iconFocused: 'person-circle' },
      ]}
    />
  );
}
