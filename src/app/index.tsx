import { Redirect, type Href } from 'expo-router';

import { useAuth } from '@/context/auth-context';
import type { UserRole } from '@/types/user';

const HOME_BY_ROLE: Record<UserRole, Href> = {
  admin: '/admin',
  manager: '/manager',
  resident: '/resident',
};

/** Giriş noktası: kullanıcıyı oturum durumuna ve rolüne göre doğru ekrana yönlendirir. */
export default function Index() {
  const { initializing, profile } = useAuth();

  // Splash ekranı görünürken hiçbir şey çizme.
  if (initializing) return null;

  if (!profile) return <Redirect href="/login" />;

  return <Redirect href={HOME_BY_ROLE[profile.role]} />;
}
