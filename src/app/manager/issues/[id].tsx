import { useLocalSearchParams } from 'expo-router';

import { IssueDetailScreen } from '@/components/issues/issue-detail-screen';

export default function ManagerIssueDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <IssueDetailScreen id={id} canManage />;
}
