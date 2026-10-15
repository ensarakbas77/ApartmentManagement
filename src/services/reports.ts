import { doc, onSnapshot, serverTimestamp, setDoc, type Timestamp } from 'firebase/firestore';

import { db } from '@/config/firebase';
import type { Due } from '@/types/dues';
import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory } from '@/types/expense';
import type { UserProfile } from '@/types/user';

/**
 * reports/{year}: yönetici tarafından yayınlanan yıllık gelir-gider özeti.
 * Sakinler diğer dairelerin aidat kayıtlarını okuyamadığı için rapor sadece toplamları içerir.
 */
export interface YearReport {
  year: number;
  totalIncome: number;
  totalExpense: number;
  /** Ay başına (1-12) tahsil edilen aidat ve gider. */
  monthly: { month: number; income: number; expense: number }[];
  /** Kategori bazında gider toplamları. */
  categories: Partial<Record<ExpenseCategory, number>>;
  /** Yıl içindeki tüm aidat kayıtlarından kaç tanesi ödendi. */
  paidDues: number;
  totalDues: number;
  publishedAt: Date | null;
  publishedBy: string;
}

const reportRef = (year: number) => doc(db, 'reports', String(year));

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Aidat ve gider kayıtlarından yıllık raporu hesaplar (yönetici cihazında). */
export function computeYearReport(year: number, dues: Due[], expenses: Expense[]): YearReport {
  const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: 0, expense: 0 }));
  const categories: Partial<Record<ExpenseCategory, number>> = {};
  const yearDues = dues.filter((d) => d.year === year);

  for (const due of yearDues) {
    if (due.paid) monthly[due.month - 1].income += due.amount;
  }
  for (const expense of expenses) {
    if (expense.date.getFullYear() !== year) continue;
    monthly[expense.date.getMonth()].expense += expense.amount;
    categories[expense.category] = (categories[expense.category] ?? 0) + expense.amount;
  }

  const roundedMonthly = monthly.map((m) => ({ ...m, income: round(m.income), expense: round(m.expense) }));
  return {
    year,
    totalIncome: round(roundedMonthly.reduce((s, m) => s + m.income, 0)),
    totalExpense: round(roundedMonthly.reduce((s, m) => s + m.expense, 0)),
    monthly: roundedMonthly,
    categories: Object.fromEntries(
      EXPENSE_CATEGORIES.filter((c) => categories[c]).map((c) => [c, round(categories[c] ?? 0)]),
    ),
    paidDues: yearDues.filter((d) => d.paid).length,
    totalDues: yearDues.length,
    publishedAt: null,
    publishedBy: '',
  };
}

export function subscribeToReport(
  year: number,
  onChange: (report: YearReport | null) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    reportRef(year),
    (snap) => {
      const data = snap.data({ serverTimestamps: 'estimate' });
      if (!data) {
        onChange(null);
        return;
      }
      onChange({
        year: Number(data.year),
        totalIncome: Number(data.totalIncome),
        totalExpense: Number(data.totalExpense),
        monthly: Array.isArray(data.monthly)
          ? data.monthly.map((m: { month: unknown; income: unknown; expense: unknown }) => ({
              month: Number(m.month),
              income: Number(m.income),
              expense: Number(m.expense),
            }))
          : [],
        categories: (data.categories ?? {}) as YearReport['categories'],
        paidDues: Number(data.paidDues ?? 0),
        totalDues: Number(data.totalDues ?? 0),
        publishedAt: (data.publishedAt as Timestamp | undefined)?.toDate() ?? null,
        publishedBy: String(data.publishedBy ?? ''),
      });
    },
    onError,
  );
}

/** Raporu sakinlerin görmesi için yayınlar (aynı yıl için tekrar yayınlamak günceller). */
export async function publishReport(report: YearReport, author: UserProfile) {
  await setDoc(reportRef(report.year), {
    year: report.year,
    totalIncome: report.totalIncome,
    totalExpense: report.totalExpense,
    monthly: report.monthly,
    categories: report.categories,
    paidDues: report.paidDues,
    totalDues: report.totalDues,
    publishedBy: author.displayName,
    publishedAt: serverTimestamp(),
  });
}
