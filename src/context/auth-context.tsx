import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { auth, db } from '@/config/firebase';
import { usernameToEmail } from '@/lib/username';
import { isUserRole, type UserProfile } from '@/types/user';

interface AuthContextValue {
  /** Firebase Auth kullanıcısı (oturum açık mı?). */
  user: User | null;
  /** Firestore'daki users/{uid} dökümanı (rol burada). */
  profile: UserProfile | null;
  /** Uygulama ilk açılırken oturum ve profil kontrol ediliyor mu? */
  initializing: boolean;
  /** Giriş yapıldı ama profil henüz gelmedi. */
  loadingProfile: boolean;
  /** Profil bulunamadı / rol geçersiz gibi durumlarda gösterilecek mesaj. */
  profileError: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const profileUnsubscribe = useRef<Unsubscribe | null>(null);

  const stopProfileListener = useCallback(() => {
    profileUnsubscribe.current?.();
    profileUnsubscribe.current = null;
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      stopProfileListener();
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setInitializing(false);
        return;
      }

      // Profili canlı dinle: admin rolü değiştirirse kullanıcı anında doğru panele geçer.
      profileUnsubscribe.current = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        (snapshot) => {
          const data = snapshot.data();

          if (!snapshot.exists() || !data || !isUserRole(data.role)) {
            setProfile(null);
            setProfileError('Hesabınız için rol tanımlanmamış. Lütfen yöneticiye başvurun.');
            setInitializing(false);
            void firebaseSignOut(auth);
            return;
          }

          setProfile({
            uid: snapshot.id,
            username: String(data.username ?? ''),
            displayName: String(data.displayName ?? data.username ?? ''),
            role: data.role,
            apartmentNo: typeof data.apartmentNo === 'number' ? data.apartmentNo : null,
            createdAt: data.createdAt,
          });
          setProfileError(null);
          setInitializing(false);
        },
        () => {
          // Çıkış yapılırken gelen yetki hatalarını yok say.
          if (!auth.currentUser) return;
          setProfile(null);
          setProfileError('Kullanıcı bilgileri alınamadı. İnternet bağlantınızı kontrol edin.');
          setInitializing(false);
          void firebaseSignOut(auth);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      stopProfileListener();
    };
  }, [stopProfileListener]);

  const signIn = useCallback(async (username: string, password: string) => {
    setProfileError(null);
    await signInWithEmailAndPassword(auth, usernameToEmail(username), password);
  }, []);

  const signOut = useCallback(async () => {
    stopProfileListener();
    await firebaseSignOut(auth);
  }, [stopProfileListener]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      initializing,
      loadingProfile: user !== null && profile === null && profileError === null,
      profileError,
      signIn,
      signOut,
    }),
    [user, profile, initializing, profileError, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth, AuthProvider içinde kullanılmalı.');
  }
  return context;
}
