import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';

import { db } from '@/config/firebase';
import { APARTMENT_NUMBERS } from '@/constants/apartment';
import { formatMoney } from '@/lib/money';
import { sendPush } from '@/services/push';
import { formatPeriod, toPeriodId, type Due, type DuePeriod, type PaymentMethod } from '@/types/dues';
import type { UserProfile } from '@/types/user';

const periodsCollection = collection(db, 'duePeriods');
const duesCollection = collection(db, 'dues');

export const MAX_DUE_AMOUNT = 1_000_000;

/** Kullanıcıya gösterilebilecek mesaj içeren hata. */
export class DuesError extends Error {}

function toDate(value: unknown): Date | null {
  return (value as Timestamp | undefined)?.toDate?.() ?? null;
}

function toPeriod(snapshot: DocumentSnapshot<DocumentData>): DuePeriod | null {
  const data = snapshot.data({ serverTimestamps: 'estimate' });
  if (!data) return null;
  return {
    id: snapshot.id,
    year: Number(data.year),
    month: Number(data.month),
    amount: Number(data.amount),
    createdAt: toDate(data.createdAt) ?? new Date(),
  };
}

function toDue(snapshot: DocumentSnapshot<DocumentData>): Due | null {
  const data = snapshot.data({ serverTimestamps: 'estimate' });
  if (!data) return null;
  return {
    id: snapshot.id,
    periodId: String(data.periodId),
    year: Number(data.year),
    month: Number(data.month),
    apartmentNo: Number(data.apartmentNo),
    amount: Number(data.amount),
    paid: data.paid === true,
    paidAt: toDate(data.paidAt),
    method: data.method === 'cash' || data.method === 'transfer' ? data.method : null,
  };
}

function notNull<T>(value: T | null): value is T {
  return value !== null;
}

/** Tüm aidat dönemlerini en yeniden eskiye canlı dinler (yönetici). */
export function subscribeToPeriods(
  onChange: (periods: DuePeriod[]) => void,
  onError: (error: Error) => void,
) {
  // Dönem kimliği "2026-10" biçiminde olduğu için metin sıralaması tarih sıralamasıdır.
  // Sıralamayı burada yapmak Firestore'da birleşik dizin gerektirmez.
  return onSnapshot(
    periodsCollection,
    (snap) =>
      onChange(
        snap.docs
          .map(toPeriod)
          .filter(notNull)
          .sort((a, b) => b.id.localeCompare(a.id)),
      ),
    onError,
  );
}

export function subscribeToPeriod(
  periodId: string,
  onChange: (period: DuePeriod | null) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(doc(periodsCollection, periodId), (snap) => onChange(toPeriod(snap)), onError);
}

/** Tüm dairelerin tüm aidatlarını canlı dinler (yönetici; dönem özetleri için). */
export function subscribeToAllDues(onChange: (dues: Due[]) => void, onError: (error: Error) => void) {
  return onSnapshot(duesCollection, (snap) => onChange(snap.docs.map(toDue).filter(notNull)), onError);
}

/** Bir dönemdeki 9 dairenin aidatını daire sırasıyla canlı dinler (yönetici). */
export function subscribeToPeriodDues(
  periodId: string,
  onChange: (dues: Due[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    query(duesCollection, where('periodId', '==', periodId)),
    (snap) =>
      onChange(
        snap.docs
          .map(toDue)
          .filter(notNull)
          .sort((a, b) => a.apartmentNo - b.apartmentNo),
      ),
    onError,
  );
}

/**
 * Bir dairenin aidatlarını en yeniden eskiye canlı dinler (sakin).
 * Güvenlik kuralı sakinin sadece kendi dairesini sorgulamasına izin verir.
 */
export function subscribeToApartmentDues(
  apartmentNo: number,
  onChange: (dues: Due[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    // Sıralama burada yapılır; Firestore'da birleşik dizin (composite index) gerekmesin.
    query(duesCollection, where('apartmentNo', '==', apartmentNo)),
    (snap) =>
      onChange(
        snap.docs
          .map(toDue)
          .filter(notNull)
          .sort((a, b) => b.periodId.localeCompare(a.periodId)),
      ),
    onError,
  );
}

/** Yeni aidat dönemi açar ve tüm daireler için "ödenmedi" kaydı oluşturur. */
export async function createPeriod(year: number, month: number, amount: number, author: UserProfile) {
  if (!(amount > 0) || amount > MAX_DUE_AMOUNT) throw new DuesError('Geçerli bir tutar girin.');

  const periodId = toPeriodId(year, month);
  const periodRef = doc(periodsCollection, periodId);
  if ((await getDoc(periodRef)).exists()) {
    throw new DuesError('Bu ay için aidat dönemi zaten açılmış.');
  }

  // Dönem ve 9 daire kaydı tek seferde yazılır: ya hepsi kaydedilir ya hiçbiri.
  const batch = writeBatch(db);
  batch.set(periodRef, {
    year,
    month,
    amount,
    createdBy: author.uid,
    createdAt: serverTimestamp(),
  });
  for (const apartmentNo of APARTMENT_NUMBERS) {
    batch.set(doc(duesCollection, `${periodId}_${apartmentNo}`), {
      periodId,
      year,
      month,
      apartmentNo,
      amount,
      paid: false,
      paidAt: null,
      method: null,
    });
  }
  await batch.commit();

  void sendPush(
    { kind: 'all' },
    {
      title: `${formatPeriod(year, month)} aidatı`,
      body: `Bu ayın aidatı ${formatMoney(amount)}. Ödeme bilgileri uygulamada.`,
      target: { type: 'dues' },
    },
    author.uid,
  );
}

export async function markDuePaid(dueId: string, method: PaymentMethod) {
  await updateDoc(doc(duesCollection, dueId), { paid: true, paidAt: serverTimestamp(), method });
}

export async function markDueUnpaid(dueId: string) {
  await updateDoc(doc(duesCollection, dueId), { paid: false, paidAt: null, method: null });
}

/** Dönemi ve o döneme ait tüm daire kayıtlarını siler. */
export async function deletePeriod(periodId: string) {
  const batch = writeBatch(db);
  batch.delete(doc(periodsCollection, periodId));
  for (const apartmentNo of APARTMENT_NUMBERS) {
    batch.delete(doc(duesCollection, `${periodId}_${apartmentNo}`));
  }
  await batch.commit();
}

/** Aidat listesinden özet: toplam, tahsil edilen, kalan, ödeyen daire sayısı. */
export function summarizeDues(dues: Due[]) {
  const total = dues.reduce((sum, d) => sum + d.amount, 0);
  const collected = dues.filter((d) => d.paid).reduce((sum, d) => sum + d.amount, 0);
  return {
    total,
    collected,
    outstanding: total - collected,
    paidCount: dues.filter((d) => d.paid).length,
    count: dues.length,
  };
}
