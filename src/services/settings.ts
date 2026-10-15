import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from '@/config/firebase';

/** settings/apartment: apartmanın ödeme bilgileri. Herkes okur, yönetici düzenler. */
export interface ApartmentSettings {
  /** Boşluksuz saklanır: "TR120006200000000123456789" */
  iban: string;
  accountHolder: string;
  bankName: string;
}

export const EMPTY_SETTINGS: ApartmentSettings = { iban: '', accountHolder: '', bankName: '' };

const settingsRef = doc(db, 'settings', 'apartment');

/** Kullanıcıya gösterilebilecek mesaj içeren hata. */
export class SettingsError extends Error {}

export function subscribeToSettings(
  onChange: (settings: ApartmentSettings) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    settingsRef,
    (snap) => {
      const data = snap.data();
      onChange({
        iban: String(data?.iban ?? ''),
        accountHolder: String(data?.accountHolder ?? ''),
        bankName: String(data?.bankName ?? ''),
      });
    },
    onError,
  );
}

/** "tr12 0006 2000..." → "TR120006200000000123456789" */
export function normalizeIban(input: string): string {
  return input.replace(/\s/g, '').toUpperCase();
}

/** "TR120006200000000123456789" → "TR12 0006 2000 0000 0123 4567 89" */
export function formatIban(iban: string): string {
  return normalizeIban(iban).replace(/(.{4})/g, '$1 ').trim();
}

export async function saveSettings(input: ApartmentSettings) {
  const iban = normalizeIban(input.iban);
  if (iban && !/^TR\d{24}$/.test(iban)) {
    throw new SettingsError('IBAN "TR" ile başlamalı ve 26 karakter olmalı.');
  }
  await setDoc(settingsRef, {
    iban,
    accountHolder: input.accountHolder.trim(),
    bankName: input.bankName.trim(),
    updatedAt: serverTimestamp(),
  });
}
