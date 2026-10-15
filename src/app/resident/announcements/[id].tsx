import { useLocalSearchParams } from 'expo-router';

import { AnnouncementDetailScreen } from '@/components/announcements/announcement-detail-screen';

export default function ResidentAnnouncementDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AnnouncementDetailScreen id={id} />;
}
