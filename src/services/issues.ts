import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type DocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';

import { db } from '@/config/firebase';
import {
  ISSUE_DESCRIPTION_MAX,
  ISSUE_LOCATION_MAX,
  ISSUE_NOTE_MAX,
  ISSUE_TITLE_MAX,
  isIssueCategory,
  isIssueStatus,
  type Issue,
  type IssueCategory,
  type IssueStatus,
} from '@/types/issue';
import type { UserProfile } from '@/types/user';

const issuesCollection = collection(db, 'issues');

/** Kullanıcıya gösterilebilecek mesaj içeren hata. */
export class IssueError extends Error {}

function toDate(value: unknown): Date | null {
  return (value as Timestamp | undefined)?.toDate?.() ?? null;
}

function toIssue(snapshot: DocumentSnapshot<DocumentData>): Issue | null {
  const data = snapshot.data({ serverTimestamps: 'estimate' });
  if (!data) return null;
  return {
    id: snapshot.id,
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    category: isIssueCategory(data.category) ? data.category : 'other',
    location: String(data.location ?? ''),
    status: isIssueStatus(data.status) ? data.status : 'open',
    apartmentNo: Number(data.apartmentNo),
    reporterUid: String(data.reporterUid ?? ''),
    reporterName: String(data.reporterName ?? ''),
    managerNote: String(data.managerNote ?? ''),
    createdAt: toDate(data.createdAt) ?? new Date(),
    updatedAt: toDate(data.updatedAt),
    resolvedAt: toDate(data.resolvedAt),
  };
}

const STATUS_ORDER: Record<IssueStatus, number> = { open: 0, in_progress: 1, resolved: 2 };

/** Tüm talepleri canlı dinler: önce açık, sonra işlemde, sonra çözülen; her grupta en yeni üstte. */
export function subscribeToIssues(onChange: (issues: Issue[]) => void, onError: (error: Error) => void) {
  return onSnapshot(
    issuesCollection,
    (snap) =>
      onChange(
        snap.docs
          .map(toIssue)
          .filter((i): i is Issue => i !== null)
          .sort(
            (a, b) =>
              STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
              b.createdAt.getTime() - a.createdAt.getTime(),
          ),
      ),
    onError,
  );
}

export function subscribeToIssue(
  id: string,
  onChange: (issue: Issue | null) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(doc(issuesCollection, id), (snap) => onChange(toIssue(snap)), onError);
}

export interface NewIssueInput {
  category: IssueCategory;
  title: string;
  location: string;
  description: string;
}

export async function createIssue(input: NewIssueInput, reporter: UserProfile) {
  if (reporter.apartmentNo === null) {
    throw new IssueError('Talep bildirmek için hesabınıza daire atanmış olmalı.');
  }
  const title = input.title.trim();
  const location = input.location.trim();
  const description = input.description.trim();

  if (!title) throw new IssueError('Kısa bir başlık yazın (örn. "Asansör çalışmıyor").');
  if (title.length > ISSUE_TITLE_MAX) throw new IssueError('Başlık çok uzun.');
  if (location.length > ISSUE_LOCATION_MAX) throw new IssueError('Yer bilgisi çok uzun.');
  if (description.length > ISSUE_DESCRIPTION_MAX) throw new IssueError('Açıklama çok uzun.');

  await addDoc(issuesCollection, {
    title,
    location,
    description,
    category: input.category,
    status: 'open',
    apartmentNo: reporter.apartmentNo,
    reporterUid: reporter.uid,
    reporterName: reporter.displayName,
    managerNote: '',
    createdAt: serverTimestamp(),
  });
}

/** Yönetici talebin durumunu ve notunu günceller. */
export async function updateIssueStatus(id: string, status: IssueStatus, managerNote: string) {
  const note = managerNote.trim();
  if (note.length > ISSUE_NOTE_MAX) throw new IssueError('Not çok uzun.');
  await updateDoc(doc(issuesCollection, id), {
    status,
    managerNote: note,
    updatedAt: serverTimestamp(),
    resolvedAt: status === 'resolved' ? serverTimestamp() : null,
  });
}

export async function deleteIssue(id: string) {
  await deleteDoc(doc(issuesCollection, id));
}

export function countActiveIssues(issues: Issue[]): number {
  return issues.filter((i) => i.status !== 'resolved').length;
}
