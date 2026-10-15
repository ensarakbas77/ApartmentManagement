import { router } from 'expo-router';

import { PollsListScreen } from '@/components/polls/polls-list-screen';

export default function ManagerPolls() {
  return (
    <PollsListScreen
      onOpen={(id) => router.push({ pathname: '/manager/polls/[id]', params: { id } })}
      onCreate={() => router.push('/manager/polls/new')}
    />
  );
}
