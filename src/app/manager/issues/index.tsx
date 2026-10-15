import { router } from 'expo-router';

import { IssuesListScreen } from '@/components/issues/issues-list-screen';

export default function ManagerIssues() {
  return (
    <IssuesListScreen
      onOpen={(id) => router.push({ pathname: '/manager/issues/[id]', params: { id } })}
      onCreate={() => router.push('/manager/issues/new')}
    />
  );
}
