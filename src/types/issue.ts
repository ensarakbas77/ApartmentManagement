import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

export type IssueStatus = 'open' | 'in_progress' | 'resolved';

export const ISSUE_STATUSES: IssueStatus[] = ['open', 'in_progress', 'resolved'];

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: 'Açık',
  in_progress: 'İşlemde',
  resolved: 'Çözüldü',
};

export const ISSUE_CATEGORIES = [
  'elevator',
  'lighting',
  'plumbing',
  'heating',
  'cleaning',
  'common_area',
  'other',
] as const;

export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const ISSUE_CATEGORY_INFO: Record<
  IssueCategory,
  { label: string; icon: ComponentProps<typeof Ionicons>['name'] }
> = {
  elevator: { label: 'Asansör', icon: 'swap-vertical-outline' },
  lighting: { label: 'Elektrik / Aydınlatma', icon: 'bulb-outline' },
  plumbing: { label: 'Su / Tesisat', icon: 'water-outline' },
  heating: { label: 'Isınma / Doğalgaz', icon: 'flame-outline' },
  cleaning: { label: 'Temizlik', icon: 'sparkles-outline' },
  common_area: { label: 'Ortak alan / Bahçe', icon: 'leaf-outline' },
  other: { label: 'Diğer', icon: 'ellipsis-horizontal-circle-outline' },
};

/** issues/{id}: sakinin bildirdiği arıza veya istek. */
export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  /** Örn. "3. kat koridor". Boş olabilir. */
  location: string;
  status: IssueStatus;
  apartmentNo: number;
  reporterUid: string;
  reporterName: string;
  /** Yöneticinin sakine notu, örn. "Usta perşembe gelecek". */
  managerNote: string;
  createdAt: Date;
  updatedAt: Date | null;
  resolvedAt: Date | null;
}

export const ISSUE_TITLE_MAX = 100;
export const ISSUE_DESCRIPTION_MAX = 1000;
export const ISSUE_LOCATION_MAX = 100;
export const ISSUE_NOTE_MAX = 500;

export function isIssueCategory(value: unknown): value is IssueCategory {
  return typeof value === 'string' && (ISSUE_CATEGORIES as readonly string[]).includes(value);
}

export function isIssueStatus(value: unknown): value is IssueStatus {
  return typeof value === 'string' && (ISSUE_STATUSES as string[]).includes(value);
}
