import { FirebaseError, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  inMemoryPersistence,
  initializeAuth,
  getAuth,
  signOut,
  type Auth,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';

import { app, db } from '@/config/firebase';
import { firestoreErrorMessage } from '@/lib/firestore-errors';
import { isValidPhone, normalizePhone } from '@/lib/phone';
import { unregisterPushNotifications } from '@/services/push';
import { isValidUsername, normalizeUsername, usernameToEmail } from '@/lib/username';
import { isUserRole, type UserProfile, type UserRole } from '@/types/user';

const usersCollection = collection(db, 'users');

/** Admin panelinden atanabilecek roller. Admin rolü sadece Firebase Console'dan verilir. */
export type AssignableRole = Exclude<UserRole, 'admin'>;

export interface NewUserInput {
  displayName: string;
  username: string;
  password: string;
  role: AssignableRole;
  apartmentNo: number;
  /** İsteğe bağlı; boş bırakılabilir. */
  phone: string;
}

/** Kullanıcıya gösterilebilecek mesaj içeren hata. */
export class UserServiceError extends Error {}

export function toUserProfile(snapshot: DocumentSnapshot<DocumentData>): UserProfile | null {
  const data = snapshot.data();
  if (!data || !isUserRole(data.role)) return null;
  return {
    uid: snapshot.id,
    username: String(data.username ?? ''),
    displayName: String(data.displayName ?? data.username ?? ''),
    role: data.role,
    apartmentNo: typeof data.apartmentNo === 'number' ? data.apartmentNo : null,
    phone: typeof data.phone === 'string' ? data.phone : '',
    mustChangePassword: data.mustChangePassword === true,
    createdAt: data.createdAt,
  };
}

/** Boş telefon geçerlidir; doluysa normalleştirilip doğrulanır. */
function validatePhone(input: string): string {
  const phone = normalizePhone(input);
  if (phone && !isValidPhone(phone)) throw new UserServiceError('Geçerli bir telefon numarası girin.');
  return phone;
}

/** Daire numarasına, sonra isme göre sıralar. Dairesi olmayan (admin) en üstte. */
function compareUsers(a: UserProfile, b: UserProfile): number {
  const aNo = a.apartmentNo ?? 0;
  const bNo = b.apartmentNo ?? 0;
  if (aNo !== bNo) return aNo - bNo;
  return a.displayName.localeCompare(b.displayName, 'tr');
}

/** Tüm kullanıcıları canlı dinler. Dönen fonksiyon dinlemeyi durdurur. */
export function subscribeToUsers(
  onChange: (users: UserProfile[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    usersCollection,
    (snapshot) => {
      const users = snapshot.docs
        .map(toUserProfile)
        .filter((u): u is UserProfile => u !== null)
        .sort(compareUsers);
      onChange(users);
    },
    onError,
  );
}

/** Tek bir kullanıcıyı canlı dinler. Kullanıcı silinirse null gelir. */
export function subscribeToUser(
  uid: string,
  onChange: (user: UserProfile | null) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(doc(usersCollection, uid), (snap) => onChange(toUserProfile(snap)), onError);
}

/**
 * Yeni kullanıcı oluşturmak için ikinci bir Firebase örneği.
 * Neden? createUserWithEmailAndPassword yeni kullanıcıyla oturum açar. Ana örneği kullansaydık
 * admin'in oturumu kapanırdı. İkinci örnek sadece bellekte yaşar, admin'in oturumuna dokunmaz.
 */
function getUserCreatorAuth(): Auth {
  const name = 'user-creator';
  const existing = getApps().find((a) => a.name === name);
  if (existing) return getAuth(existing);
  const secondaryApp = initializeApp(app.options, name);
  return initializeAuth(secondaryApp, { persistence: inMemoryPersistence });
}

export async function createUser(input: NewUserInput): Promise<UserProfile> {
  const username = normalizeUsername(input.username);
  const displayName = input.displayName.trim();

  if (!displayName) throw new UserServiceError('Ad soyad girin.');
  if (!isValidUsername(username)) {
    throw new UserServiceError(
      'Kullanıcı adı 3-30 karakter olmalı; sadece harf, rakam, nokta, tire ve alt çizgi içerebilir.',
    );
  }
  if (input.password.length < 6) throw new UserServiceError('Şifre en az 6 karakter olmalı.');
  const phone = validatePhone(input.phone);

  const existing = await getDocs(query(usersCollection, where('username', '==', username), limit(1)));
  if (!existing.empty) throw new UserServiceError(`"${username}" kullanıcı adı zaten kullanılıyor.`);

  const creatorAuth = getUserCreatorAuth();
  let credential;
  try {
    credential = await createUserWithEmailAndPassword(
      creatorAuth,
      usernameToEmail(username),
      input.password,
    );
  } catch (error) {
    throw new UserServiceError(getCreateErrorMessage(error, username));
  }

  const profile: UserProfile = {
    uid: credential.user.uid,
    username,
    displayName,
    role: input.role,
    apartmentNo: input.apartmentNo,
    phone,
    mustChangePassword: true,
  };

  try {
    // Firestore'a admin'in kendi oturumuyla (ana db) yazılır; güvenlik kuralı admin'i kontrol eder.
    await setDoc(doc(usersCollection, profile.uid), {
      username: profile.username,
      displayName: profile.displayName,
      role: profile.role,
      apartmentNo: profile.apartmentNo,
      phone: profile.phone,
      // Admin'in WhatsApp'tan ilettiği geçici şifre ilk girişte değiştirilmeli.
      mustChangePassword: true,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Profil yazılamadıysa yarım kalan Auth hesabını geri al ki kullanıcı adı boşa gitmesin.
    await deleteUser(credential.user).catch(() => undefined);
    throw new UserServiceError(firestoreErrorMessage(error, 'Kullanıcı kaydedilemedi'));
  } finally {
    await signOut(creatorAuth).catch(() => undefined);
  }

  return profile;
}

/**
 * Kullanıcının uygulamaya erişimini kaldırır (Firestore profilini siler).
 * Profil silinince kullanıcı oturumdaysa anında çıkış yaptırılır, bir daha giriş yapamaz.
 * Not: Ücretsiz planda Firebase Auth hesabı uygulamadan silinemez; kullanıcı adını yeniden
 * kullanmak için Firebase Console > Authentication > Users'tan da silinmelidir.
 */
export async function removeUser(uid: string): Promise<void> {
  await deleteDoc(doc(usersCollection, uid));
  // Silinen kişiye artık bildirim gitmesin.
  await unregisterPushNotifications(uid);
}

export async function updateUserRole(uid: string, role: AssignableRole): Promise<void> {
  await updateDoc(doc(usersCollection, uid), { role });
}

export async function updateUserPhone(uid: string, phone: string): Promise<void> {
  await updateDoc(doc(usersCollection, uid), { phone: validatePhone(phone) });
}

function getCreateErrorMessage(error: unknown, username: string): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return (
          `"${username}" daha önce kullanılmış ve Firebase'de hesabı duruyor. ` +
          'Farklı bir kullanıcı adı seçin ya da eski hesabı Firebase Console > Authentication bölümünden silin.'
        );
      case 'auth/weak-password':
        return 'Şifre çok zayıf. En az 6 karakter kullanın.';
      case 'auth/network-request-failed':
        return 'İnternet bağlantısı yok gibi görünüyor.';
      case 'auth/too-many-requests':
        return 'Çok fazla işlem yapıldı. Biraz bekleyip tekrar deneyin.';
    }
    return `Kullanıcı oluşturulamadı (${error.code}).`;
  }
  return 'Kullanıcı oluşturulamadı.';
}

/** Teslim edilecek geçici şifre üretir. Karışabilecek karakterler (0/O, 1/l/I) çıkarıldı. */
export function generateTemporaryPassword(length = 8): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return password;
}
