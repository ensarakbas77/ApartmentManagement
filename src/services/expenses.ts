import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';

import { db } from '@/config/firebase';
import { toPeriodId } from '@/types/dues';
import {
  EXPENSE_AMOUNT_MAX,
  EXPENSE_NOTE_MAX,
  EXPENSE_TITLE_MAX,
  isExpenseCategory,
  type Expense,
  type ExpenseCategory,
  type ExpenseInput,
} from '@/types/expense';
import type { UserProfile } from '@/types/user';

const expensesCollection = collection(db, 'expenses');

/** Kullanıcıya gösterilebilecek mesaj içeren hata. */
export class ExpenseError extends Error {}

function toDate(value: unknown): Date | null {
  return (value as Timestamp | undefined)?.toDate?.() ?? null;
}

function toExpense(snapshot: DocumentSnapshot<DocumentData>): Expense | null {
  const data = snapshot.data({ serverTimestamps: 'estimate' });
  if (!data) return null;
  return {
    id: snapshot.id,
    title: String(data.title ?? ''),
    category: isExpenseCategory(data.category) ? data.category : 'other',
    amount: Number(data.amount),
    date: toDate(data.date) ?? new Date(),
    periodId: String(data.periodId ?? ''),
    note: String(data.note ?? ''),
    authorName: String(data.authorName ?? ''),
    createdAt: toDate(data.createdAt) ?? new Date(),
    updatedAt: toDate(data.updatedAt),
  };
}

/** Tüm giderleri en yeniden eskiye canlı dinler. Ay filtrelemesi ekranda yapılır. */
export function subscribeToExpenses(onChange: (expenses: Expense[]) => void, onError: (error: Error) => void) {
  return onSnapshot(
    expensesCollection,
    (snap) =>
      onChange(
        snap.docs
          .map(toExpense)
          .filter((e): e is Expense => e !== null)
          .sort((a, b) => b.date.getTime() - a.date.getTime() || b.createdAt.getTime() - a.createdAt.getTime()),
      ),
    onError,
  );
}

export function subscribeToExpense(
  id: string,
  onChange: (expense: Expense | null) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(doc(expensesCollection, id), (snap) => onChange(toExpense(snap)), onError);
}

export async function getExpense(id: string): Promise<Expense | null> {
  return toExpense(await getDoc(doc(expensesCollection, id)));
}

/** Saat dilimi kaymasıyla günün değişmemesi için tarihi o günün öğlen saatine sabitler. */
function normalizeDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
}

function validate(input: ExpenseInput) {
  const title = input.title.trim();
  const note = input.note.trim();
  if (!title) throw new ExpenseError('Gider adını yazın (örn. "Asansör aylık bakım").');
  if (title.length > EXPENSE_TITLE_MAX) throw new ExpenseError('Gider adı çok uzun.');
  if (note.length > EXPENSE_NOTE_MAX) throw new ExpenseError('Not çok uzun.');
  if (!(input.amount > 0) || input.amount > EXPENSE_AMOUNT_MAX) throw new ExpenseError('Geçerli bir tutar girin.');
  const date = normalizeDay(input.date);
  return {
    title,
    note,
    category: input.category,
    amount: input.amount,
    date: Timestamp.fromDate(date),
    periodId: toPeriodId(date.getFullYear(), date.getMonth() + 1),
  };
}

export async function createExpense(input: ExpenseInput, author: UserProfile) {
  await addDoc(expensesCollection, {
    ...validate(input),
    createdBy: author.uid,
    authorName: author.displayName,
    createdAt: serverTimestamp(),
  });
}

export async function updateExpense(id: string, input: ExpenseInput) {
  await updateDoc(doc(expensesCollection, id), { ...validate(input), updatedAt: serverTimestamp() });
}

export async function deleteExpense(id: string) {
  await deleteDoc(doc(expensesCollection, id));
}

export function sumExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

/** Kategori bazında toplamlar, büyükten küçüğe. */
export function totalsByCategory(expenses: Expense[]): { category: ExpenseCategory; total: number }[] {
  const map = new Map<ExpenseCategory, number>();
  for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  return [...map.entries()].map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total);
}
