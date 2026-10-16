import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';

import { db } from '@/config/firebase';
import { sendPush } from '@/services/push';
import {
  POLL_DESCRIPTION_MAX,
  POLL_MAX_OPTIONS,
  POLL_MIN_OPTIONS,
  POLL_OPTION_IDS,
  POLL_OPTION_MAX,
  POLL_QUESTION_MAX,
  type Poll,
  type PollOption,
  type PollVote,
} from '@/types/poll';
import type { UserProfile } from '@/types/user';

const pollsCollection = collection(db, 'polls');
const votesCollection = (pollId: string) => collection(db, 'polls', pollId, 'votes');

/** Kullanıcıya gösterilebilecek mesaj içeren hata. */
export class PollError extends Error {}

function toDate(value: unknown): Date | null {
  return (value as Timestamp | undefined)?.toDate?.() ?? null;
}

function toPoll(snapshot: DocumentSnapshot<DocumentData>): Poll | null {
  const data = snapshot.data({ serverTimestamps: 'estimate' });
  if (!data) return null;
  const options: PollOption[] = Array.isArray(data.options)
    ? data.options.map((o: { id?: unknown; text?: unknown }) => ({ id: String(o.id), text: String(o.text) }))
    : [];
  const rawCounts = (data.counts ?? {}) as Record<string, unknown>;
  return {
    id: snapshot.id,
    question: String(data.question ?? ''),
    description: String(data.description ?? ''),
    options,
    counts: Object.fromEntries(options.map((o) => [o.id, Number(rawCounts[o.id] ?? 0)])),
    votedApartments: Array.isArray(data.votedApartments) ? data.votedApartments.map(Number) : [],
    closed: data.closed === true,
    authorName: String(data.authorName ?? ''),
    createdAt: toDate(data.createdAt) ?? new Date(),
  };
}

function toVote(snapshot: DocumentSnapshot<DocumentData>): PollVote | null {
  const data = snapshot.data({ serverTimestamps: 'estimate' });
  if (!data) return null;
  return {
    apartmentNo: Number(data.apartmentNo),
    optionId: String(data.optionId),
    createdAt: toDate(data.createdAt) ?? new Date(),
  };
}

/** Anketleri en yeniden eskiye canlı dinler. Açık anketler üstte. */
export function subscribeToPolls(onChange: (polls: Poll[]) => void, onError: (error: Error) => void) {
  return onSnapshot(
    pollsCollection,
    (snap) =>
      onChange(
        snap.docs
          .map(toPoll)
          .filter((p): p is Poll => p !== null)
          .sort(
            (a, b) =>
              Number(a.closed) - Number(b.closed) || b.createdAt.getTime() - a.createdAt.getTime(),
          ),
      ),
    onError,
  );
}

export function subscribeToPoll(
  pollId: string,
  onChange: (poll: Poll | null) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(doc(pollsCollection, pollId), (snap) => onChange(toPoll(snap)), onError);
}

/** Bu dairenin bu ankete verdiği oyu dinler. Oy yoksa null. */
export function subscribeToMyVote(
  pollId: string,
  apartmentNo: number,
  onChange: (vote: PollVote | null) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    doc(votesCollection(pollId), String(apartmentNo)),
    (snap) => onChange(toVote(snap)),
    onError,
  );
}

/** Tüm oyları dinler (sadece yönetici; kimin neye oy verdiğini görmek için). */
export function subscribeToPollVotes(
  pollId: string,
  onChange: (votes: PollVote[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    votesCollection(pollId),
    (snap) =>
      onChange(
        snap.docs
          .map(toVote)
          .filter((v): v is PollVote => v !== null)
          .sort((a, b) => a.apartmentNo - b.apartmentNo),
      ),
    onError,
  );
}

export interface NewPollInput {
  question: string;
  description: string;
  options: string[];
}

export async function createPoll(input: NewPollInput, author: UserProfile) {
  const question = input.question.trim();
  const description = input.description.trim();
  const optionTexts = input.options.map((o) => o.trim()).filter(Boolean);

  if (!question) throw new PollError('Soruyu yazın.');
  if (question.length > POLL_QUESTION_MAX) throw new PollError('Soru çok uzun.');
  if (description.length > POLL_DESCRIPTION_MAX) throw new PollError('Açıklama çok uzun.');
  if (optionTexts.length < POLL_MIN_OPTIONS) throw new PollError(`En az ${POLL_MIN_OPTIONS} seçenek girin.`);
  if (optionTexts.length > POLL_MAX_OPTIONS) throw new PollError(`En fazla ${POLL_MAX_OPTIONS} seçenek olabilir.`);
  if (optionTexts.some((o) => o.length > POLL_OPTION_MAX)) throw new PollError('Seçeneklerden biri çok uzun.');
  const lowered = optionTexts.map((o) => o.toLocaleLowerCase('tr-TR'));
  if (new Set(lowered).size !== lowered.length) throw new PollError('Aynı seçenek iki kez yazılmış.');

  const options = optionTexts.map((text, i) => ({ id: POLL_OPTION_IDS[i], text }));
  const ref = await addDoc(pollsCollection, {
    question,
    description,
    options,
    counts: Object.fromEntries(options.map((o) => [o.id, 0])),
    votedApartments: [],
    closed: false,
    createdBy: author.uid,
    authorName: author.displayName,
    createdAt: serverTimestamp(),
  });
  void sendPush(
    { kind: 'all' },
    { title: 'Yeni anket: oyunuzu kullanın', body: question, target: { type: 'poll', id: ref.id } },
    author.uid,
  );
}

/**
 * Daire adına oy verir. Oy kaydı ve anketteki sayaç tek seferde yazılır;
 * güvenlik kuralları ikisinin tutarlı olmasını ve dairenin daha önce oy vermemiş olmasını denetler.
 */
export async function castVote(pollId: string, optionId: string, voter: UserProfile) {
  if (voter.apartmentNo === null) throw new PollError('Oy kullanmak için hesabınıza daire atanmış olmalı.');

  const batch = writeBatch(db);
  batch.set(doc(votesCollection(pollId), String(voter.apartmentNo)), {
    apartmentNo: voter.apartmentNo,
    optionId,
    voterUid: voter.uid,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(pollsCollection, pollId), {
    [`counts.${optionId}`]: increment(1),
    votedApartments: arrayUnion(voter.apartmentNo),
  });

  try {
    await batch.commit();
  } catch {
    throw new PollError('Oy kaydedilemedi. Daireniz daha önce oy vermiş veya anket kapanmış olabilir.');
  }
}

export async function setPollClosed(pollId: string, closed: boolean) {
  await updateDoc(doc(pollsCollection, pollId), { closed });
}

/** Anketi ve tüm oylarını siler. */
export async function deletePoll(pollId: string) {
  const votes = await getDocs(votesCollection(pollId));
  const batch = writeBatch(db);
  votes.docs.forEach((vote) => batch.delete(vote.ref));
  batch.delete(doc(pollsCollection, pollId));
  await batch.commit();
}
