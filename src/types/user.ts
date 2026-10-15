import type { Timestamp } from 'firebase/firestore';

/**
 * admin    → Uygulamanın sahibi: kullanıcı ekler, şifre sıfırlar, rol atar.
 * manager  → Apartman yöneticisi: duyuru, aidat, gider, anket yönetir.
 * resident → Daire sakini: görüntüler, arıza bildirir, oy kullanır.
 */
export const USER_ROLES = ['admin', 'manager', 'resident'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Yönetici',
  resident: 'Sakin',
};

/** Firestore'daki users/{uid} dökümanı. Döküman kimliği Firebase Auth uid'si ile aynıdır. */
export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  role: UserRole;
  /** Kullanıcının oturduğu daire (1-9). Dairesi olmayan admin için null. */
  apartmentNo: number | null;
  createdAt?: Timestamp;
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}
