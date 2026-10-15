/** Ödeme yöntemi: nakit veya havale/EFT. */
export type PaymentMethod = 'cash' | 'transfer';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Nakit',
  transfer: 'EFT / Havale',
};

/** duePeriods/{periodId}: bir aylık aidat dönemi. periodId = "2026-10". */
export interface DuePeriod {
  id: string;
  year: number;
  /** 1-12 */
  month: number;
  /** Daire başına aidat tutarı (TL). */
  amount: number;
  createdAt: Date;
}

/** dues/{periodId}_{apartmentNo}: bir dairenin o aylık aidatı. */
export interface Due {
  id: string;
  periodId: string;
  year: number;
  month: number;
  apartmentNo: number;
  amount: number;
  paid: boolean;
  paidAt: Date | null;
  method: PaymentMethod | null;
}

const MONTH_NAMES = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

/** "Ekim 2026" */
export function formatPeriod(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** "2026-10" — sıralanabilir dönem kimliği. */
export function toPeriodId(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}
