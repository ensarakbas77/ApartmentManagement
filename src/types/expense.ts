import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

export const EXPENSE_CATEGORIES = [
  'elevator',
  'cleaning',
  'electricity',
  'water',
  'heating',
  'repair',
  'staff',
  'other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_INFO: Record<
  ExpenseCategory,
  { label: string; icon: ComponentProps<typeof Ionicons>['name'] }
> = {
  elevator: { label: 'Asansör bakımı', icon: 'swap-vertical-outline' },
  cleaning: { label: 'Temizlik', icon: 'sparkles-outline' },
  electricity: { label: 'Ortak elektrik', icon: 'flash-outline' },
  water: { label: 'Su', icon: 'water-outline' },
  heating: { label: 'Isınma / Doğalgaz', icon: 'flame-outline' },
  repair: { label: 'Tamir / Tadilat', icon: 'hammer-outline' },
  staff: { label: 'Görevli / Kapıcı', icon: 'person-outline' },
  other: { label: 'Diğer', icon: 'ellipsis-horizontal-circle-outline' },
};

/** expenses/{id}: apartman gideri. */
export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  /** Harcamanın yapıldığı gün. */
  date: Date;
  /** "2026-10": aylık gruplama için. */
  periodId: string;
  note: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface ExpenseInput {
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: Date;
  note: string;
}

export const EXPENSE_TITLE_MAX = 100;
export const EXPENSE_NOTE_MAX = 500;
export const EXPENSE_AMOUNT_MAX = 10_000_000;

export function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return typeof value === 'string' && (EXPENSE_CATEGORIES as readonly string[]).includes(value);
}
