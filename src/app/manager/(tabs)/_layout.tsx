import { RoleTabs } from '@/components/role-tabs';

export default function ManagerTabsLayout() {
  return (
    <RoleTabs
      tabs={[
        { name: 'index', title: 'Ana Sayfa', icon: 'home-outline', iconFocused: 'home' },
        { name: 'announcements', title: 'Duyurular', icon: 'megaphone-outline', iconFocused: 'megaphone' },
        { name: 'dues', title: 'Aidatlar', icon: 'wallet-outline', iconFocused: 'wallet' },
        { name: 'account', title: 'Hesabım', icon: 'person-circle-outline', iconFocused: 'person-circle' },
      ]}
    />
  );
}
