import { RoleTabs } from '@/components/role-tabs';

export default function AdminTabsLayout() {
  return (
    <RoleTabs
      tabs={[
        { name: 'index', title: 'Kullanıcılar', icon: 'people-outline', iconFocused: 'people' },
        { name: 'account', title: 'Hesabım', icon: 'person-circle-outline', iconFocused: 'person-circle' },
      ]}
    />
  );
}
