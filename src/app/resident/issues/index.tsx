import { router } from 'expo-router';

import { IssuesListScreen } from '@/components/issues/issues-list-screen';

export default function ResidentIssues() {
  return (
    <IssuesListScreen
      onOpen={(id) => router.push({ pathname: '/resident/issues/[id]', params: { id } })}
      onCreate={() => router.push('/resident/issues/new')}
    />
  );
}
