import { router, useLocalSearchParams } from 'expo-router';

import { ExpenseDetailScreen } from '@/components/expenses/expense-detail-screen';

export default function ManagerExpenseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ExpenseDetailScreen
      id={id}
      onEdit={() => router.push({ pathname: '/manager/expenses/compose', params: { id } })}
    />
  );
}
