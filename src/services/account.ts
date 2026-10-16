import { FirebaseError } from 'firebase/app';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

import { auth, db } from '@/config/firebase';

export const MIN_PASSWORD_LENGTH = 6;

/** Kullanıcıya gösterilebilecek mesaj içeren hata. */
export class AccountError extends Error {}

/**
 * Giriş yapmış kullanıcının kendi şifresini değiştirir.
 * Firebase, şifre değişikliği için yakın zamanda giriş yapılmış olmasını ister; bu yüzden
 * önce mevcut şifreyle kimlik yeniden doğrulanır (bu aynı zamanda mevcut şifreyi kontrol eder).
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser;
  if (!user?.email) throw new AccountError('Oturum bulunamadı. Lütfen tekrar giriş yapın.');

  if (!currentPassword) throw new AccountError('Mevcut şifrenizi girin.');
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new AccountError(`Yeni şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`);
  }
  if (newPassword === currentPassword) {
    throw new AccountError('Yeni şifre mevcut şifreden farklı olmalı.');
  }

  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
  } catch (error) {
    throw new AccountError(getReauthErrorMessage(error));
  }

  try {
    await updatePassword(user, newPassword);
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/weak-password') {
      throw new AccountError('Yeni şifre çok zayıf. Daha uzun bir şifre seçin.');
    }
    if (error instanceof FirebaseError && error.code === 'auth/network-request-failed') {
      throw new AccountError('Şifre değiştirilemedi. İnternet bağlantınızı kontrol edin.');
    }
    throw new AccountError('Şifre değiştirilemedi. Lütfen tekrar deneyin.');
  }

  // İlk giriş zorunluluğunu kaldır. Başarısız olursa şifre yine de değişmiştir; kullanıcı
  // ekranda kalır ve yeni şifresini "mevcut şifre" olarak girip tekrar deneyebilir.
  await updateDoc(doc(db, 'users', user.uid), { mustChangePassword: false }).catch(() => undefined);
}

function getReauthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Mevcut şifre hatalı.';
      case 'auth/too-many-requests':
        return 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin.';
      case 'auth/network-request-failed':
        return 'İnternet bağlantısı yok gibi görünüyor.';
    }
  }
  return 'Kimlik doğrulanamadı. Lütfen tekrar deneyin.';
}
