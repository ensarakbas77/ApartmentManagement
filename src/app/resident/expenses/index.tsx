import { router } from 'expo-router';

import { ExpensesListScreen } from '@/components/expenses/expenses-list-screen';

export default function ResidentExpenses() {
  return (
    <ExpensesListScreen onOpen={(id) => router.push({ pathname: '/resident/expenses/[id]', params: { id } })} />
  );
}
