import { useLocalSearchParams } from 'expo-router';

import { ExpenseDetailScreen } from '@/components/expenses/expense-detail-screen';

export default function ResidentExpenseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ExpenseDetailScreen id={id} />;
}
