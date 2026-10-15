import { router } from 'expo-router';

import { PollsListScreen } from '@/components/polls/polls-list-screen';

export default function ResidentPolls() {
  return (
    <PollsListScreen onOpen={(id) => router.push({ pathname: '/resident/polls/[id]', params: { id } })} />
  );
}
