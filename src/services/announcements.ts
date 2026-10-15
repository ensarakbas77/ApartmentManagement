import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type DocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';

import { db } from '@/config/firebase';
import {
  ANNOUNCEMENT_BODY_MAX,
  ANNOUNCEMENT_TITLE_MAX,
  type Announcement,
  type AnnouncementInput,
} from '@/types/announcement';
import type { UserProfile } from '@/types/user';

const announcementsCollection = collection(db, 'announcements');

/** Listede gösterilecek en fazla duyuru sayısı. */
const LIST_LIMIT = 50;

/** Kullanıcıya gösterilebilecek mesaj içeren hata. */
export class AnnouncementError extends Error {}

function toAnnouncement(snapshot: DocumentSnapshot<DocumentData>): Announcement | null {
  // Yeni yazılan dökümanda sunucu saati henüz gelmemişse tahmini saat kullan (null yerine).
  const data = snapshot.data({ serverTimestamps: 'estimate' });
  if (!data) return null;
  return {
    id: snapshot.id,
    title: String(data.title ?? ''),
    body: String(data.body ?? ''),
    important: data.important === true,
    authorUid: String(data.authorUid ?? ''),
    authorName: String(data.authorName ?? ''),
    createdAt: (data.createdAt as Timestamp | undefined)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp | undefined)?.toDate() ?? null,
  };
}

/** Duyuruları en yeniden eskiye canlı dinler. */
export function subscribeToAnnouncements(
  onChange: (announcements: Announcement[]) => void,
  onError: (error: Error) => void,
  max = LIST_LIMIT,
) {
  return onSnapshot(
    query(announcementsCollection, orderBy('createdAt', 'desc'), limit(max)),
    (snapshot) => {
      onChange(snapshot.docs.map(toAnnouncement).filter((a): a is Announcement => a !== null));
    },
    onError,
  );
}

/** Ana sayfa için en güncel duyuruyu canlı dinler. Hiç duyuru yoksa null gelir. */
export function subscribeToLatestAnnouncement(
  onChange: (announcement: Announcement | null) => void,
  onError: (error: Error) => void,
) {
  return subscribeToAnnouncements((list) => onChange(list[0] ?? null), onError, 1);
}

/** Tek bir duyuruyu canlı dinler. Silinirse null gelir. */
export function subscribeToAnnouncement(
  id: string,
  onChange: (announcement: Announcement | null) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(doc(announcementsCollection, id), (snap) => onChange(toAnnouncement(snap)), onError);
}

/** Düzenleme formunu doldurmak için duyuruyu bir kez okur. */
export async function getAnnouncement(id: string): Promise<Announcement | null> {
  return toAnnouncement(await getDoc(doc(announcementsCollection, id)));
}

function validate(input: AnnouncementInput): AnnouncementInput {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) throw new AnnouncementError('Başlık girin.');
  if (!body) throw new AnnouncementError('Duyuru metnini girin.');
  if (title.length > ANNOUNCEMENT_TITLE_MAX) {
    throw new AnnouncementError(`Başlık en fazla ${ANNOUNCEMENT_TITLE_MAX} karakter olabilir.`);
  }
  if (body.length > ANNOUNCEMENT_BODY_MAX) {
    throw new AnnouncementError(`Metin en fazla ${ANNOUNCEMENT_BODY_MAX} karakter olabilir.`);
  }
  return { title, body, important: input.important };
}

export async function createAnnouncement(input: AnnouncementInput, author: UserProfile) {
  const data = validate(input);
  await addDoc(announcementsCollection, {
    ...data,
    authorUid: author.uid,
    authorName: author.displayName,
    createdAt: serverTimestamp(),
  });
}

export async function updateAnnouncement(id: string, input: AnnouncementInput) {
  const data = validate(input);
  await updateDoc(doc(announcementsCollection, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteAnnouncement(id: string) {
  await deleteDoc(doc(announcementsCollection, id));
}
