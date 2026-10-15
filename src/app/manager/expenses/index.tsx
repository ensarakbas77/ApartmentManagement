import { router } from 'expo-router';

import { ExpensesListScreen } from '@/components/expenses/expenses-list-screen';

export default function ManagerExpenses() {
  return (
    <ExpensesListScreen
      onOpen={(id) => router.push({ pathname: '/manager/expenses/[id]', params: { id } })}
      onCreate={() => router.push('/manager/expenses/compose')}
    />
  );
}
