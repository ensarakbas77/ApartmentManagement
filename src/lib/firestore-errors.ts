import { FirebaseError } from 'firebase/app';

/**
 * Firestore hatasını kullanıcıya gösterilecek mesaja çevirir: "<işlem>. <sebep>".
 * Canlı dinlemelerde internet kesilince Firestore hata vermez, beklemeye geçer; bu yüzden
 * gelen hatalar çoğunlukla yetki (güvenlik kuralı) hatasıdır ve öyle söylenmelidir.
 */
export function firestoreErrorMessage(error: unknown, action: string): string {
  const code = error instanceof FirebaseError ? error.code : '';
  return `${action}. ${reasonFor(code)}`;
}

function reasonFor(code: string): string {
  switch (code) {
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'Bu işlem için izin verilmedi; güvenlik kuralları güncel olmayabilir. Sorun sürerse yöneticiye bildirin.';
    case 'unavailable':
    case 'firestore/unavailable':
    case 'deadline-exceeded':
      return 'Sunucuya ulaşılamadı, internet bağlantınızı kontrol edin.';
    case 'unauthenticated':
      return 'Oturumunuz sona ermiş olabilir, tekrar giriş yapın.';
    default:
      return 'Lütfen tekrar deneyin.';
  }
}
