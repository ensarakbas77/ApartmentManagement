import { useEffect, useMemo, useState } from 'react';

import { subscribeToAllDues, subscribeToApartmentDues, summarizeDues } from '@/services/dues';
import { subscribeToIssues } from '@/services/issues';
import { subscribeToPolls } from '@/services/polls';
import { toPeriodId, type Due } from '@/types/dues';
import type { Issue } from '@/types/issue';
import type { Poll } from '@/types/poll';
import type { UserProfile } from '@/types/user';

const RECENTLY_RESOLVED_MS = 3 * 24 * 60 * 60 * 1000;

function currentPeriodId(): string {
  const now = new Date();
  return toPeriodId(now.getFullYear(), now.getMonth() + 1);
}

function usePolls() {
  const [polls, setPolls] = useState<Poll[] | null>(null);
  useEffect(() => subscribeToPolls(setPolls, () => setPolls([])), []);
  return polls;
}

function useIssues() {
  const [issues, setIssues] = useState<Issue[] | null>(null);
  useEffect(() => subscribeToIssues(setIssues, () => setIssues([])), []);
  return issues;
}

/** Bu dairenin henüz oy vermediği açık anketler. */
function pendingPollsFor(polls: Poll[] | null, apartmentNo: number | null): Poll[] {
  if (!polls || apartmentNo === null) return [];
  return polls.filter((p) => !p.closed && !p.votedApartments.includes(apartmentNo));
}

/** Sakin ana sayfası özeti: aidat borcu, bekleyen anketler, kendi talepleri. */
export function useResidentSummary(profile: UserProfile) {
  const apartmentNo = profile.apartmentNo;
  const [dues, setDues] = useState<Due[] | null>(apartmentNo === null ? [] : null);
  const polls = usePolls();
  const issues = useIssues();

  useEffect(() => {
    if (apartmentNo === null) return;
    return subscribeToApartmentDues(apartmentNo, setDues, () => setDues([]));
  }, [apartmentNo]);

  return useMemo(() => {
    const list = dues ?? [];
    const summary = summarizeDues(list);
    const mine = (issues ?? []).filter((i) => i.reporterUid === profile.uid);
    const now = Date.now();
    return {
      loading: dues === null,
      hasDues: list.length > 0,
      outstanding: summary.outstanding,
      unpaidCount: summary.count - summary.paidCount,
      currentDue: list.find((d) => d.periodId === currentPeriodId()) ?? null,
      pendingPolls: pendingPollsFor(polls, apartmentNo),
      activeIssues: mine.filter((i) => i.status !== 'resolved'),
      recentlyResolved: mine.filter(
        (i) => i.status === 'resolved' && i.resolvedAt && now - i.resolvedAt.getTime() < RECENTLY_RESOLVED_MS,
      ),
    };
  }, [dues, polls, issues, profile.uid, apartmentNo]);
}

/** Yönetici ana sayfası özeti: bu ayın tahsilatı, bekleyen talepler, anketler. */
export function useManagerSummary(profile: UserProfile) {
  const [dues, setDues] = useState<Due[] | null>(null);
  const polls = usePolls();
  const issues = useIssues();

  useEffect(() => subscribeToAllDues(setDues, () => setDues([])), []);

  return useMemo(() => {
    const periodId = currentPeriodId();
    const monthDues = (dues ?? []).filter((d) => d.periodId === periodId);
    const list = issues ?? [];
    return {
      loading: dues === null,
      periodId,
      hasCurrentPeriod: monthDues.length > 0,
      month: summarizeDues(monthDues),
      unpaidThisMonth: monthDues.filter((d) => !d.paid).length,
      newIssues: list.filter((i) => i.status === 'open'),
      inProgressIssues: list.filter((i) => i.status === 'in_progress'),
      pendingPolls: pendingPollsFor(polls, profile.apartmentNo),
    };
  }, [dues, polls, issues, profile.apartmentNo]);
}
