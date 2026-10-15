import { FirebaseError } from 'firebase/app';

/** Firebase hata kodlarını kullanıcının anlayacağı Türkçe mesajlara çevirir. */
export function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
  }

  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Kullanıcı adı veya şifre hatalı.';
    case 'auth/user-disabled':
      return 'Bu hesap devre dışı bırakılmış. Yöneticiye başvurun.';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin.';
    case 'auth/network-request-failed':
      return 'İnternet bağlantısı yok gibi görünüyor.';
    default:
      return `Giriş yapılamadı (${error.code}).`;
  }
}
