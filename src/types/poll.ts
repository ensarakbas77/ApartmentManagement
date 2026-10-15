export interface PollOption {
  /** Kısa sabit kimlik: "a", "b", "c"... */
  id: string;
  text: string;
}

/** polls/{pollId} */
export interface Poll {
  id: string;
  question: string;
  description: string;
  options: PollOption[];
  /** Seçenek kimliğine göre oy sayıları. */
  counts: Record<string, number>;
  /** Oy kullanmış daireler (kimin neye oy verdiği burada değil, gizli). */
  votedApartments: number[];
  closed: boolean;
  authorName: string;
  createdAt: Date;
}

/** polls/{pollId}/votes/{apartmentNo}: bir dairenin oyu. Sadece o daire ve yönetici okuyabilir. */
export interface PollVote {
  apartmentNo: number;
  optionId: string;
  createdAt: Date;
}

export const POLL_MIN_OPTIONS = 2;
export const POLL_MAX_OPTIONS = 5;
export const POLL_QUESTION_MAX = 150;
export const POLL_DESCRIPTION_MAX = 500;
export const POLL_OPTION_MAX = 80;

export const POLL_OPTION_IDS = ['a', 'b', 'c', 'd', 'e'] as const;

export function totalVotes(poll: Poll): number {
  return Object.values(poll.counts).reduce((sum, n) => sum + n, 0);
}
