import { useLocalSearchParams } from 'expo-router';

import { PollDetailScreen } from '@/components/polls/poll-detail-screen';

export default function ManagerPollDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PollDetailScreen id={id} canManage />;
}
