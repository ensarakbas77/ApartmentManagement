import { router, useLocalSearchParams } from 'expo-router';

import { AnnouncementDetailScreen } from '@/components/announcements/announcement-detail-screen';

export default function ManagerAnnouncementDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <AnnouncementDetailScreen
      id={id}
      onEdit={() => router.push({ pathname: '/manager/announcements/compose', params: { id } })}
    />
  );
}
