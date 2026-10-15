import { router } from 'expo-router';

import { AnnouncementsListScreen } from '@/components/announcements/announcements-list-screen';

export default function ResidentAnnouncements() {
  return (
    <AnnouncementsListScreen
      onOpen={(id) => router.push({ pathname: '/resident/announcements/[id]', params: { id } })}
    />
  );
}
