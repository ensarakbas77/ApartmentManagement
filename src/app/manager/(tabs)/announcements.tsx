import { router } from 'expo-router';

import { AnnouncementsListScreen } from '@/components/announcements/announcements-list-screen';

export default function ManagerAnnouncements() {
  return (
    <AnnouncementsListScreen
      onOpen={(id) => router.push({ pathname: '/manager/announcements/[id]', params: { id } })}
      onCreate={() => router.push('/manager/announcements/compose')}
    />
  );
}
