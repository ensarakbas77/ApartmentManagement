import { router } from 'expo-router';

import { ContactsScreen } from '@/components/contacts-screen';

export default function ManagerContacts() {
  return (
    <ContactsScreen
      onCreate={() => router.push('/manager/contacts/compose')}
      onEdit={(id) => router.push({ pathname: '/manager/contacts/compose', params: { id } })}
    />
  );
}
