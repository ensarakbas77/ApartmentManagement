import { useEffect, useState } from 'react';

import { countActiveIssues, subscribeToIssues } from '@/services/issues';

/** Çözülmemiş (açık + işlemde) talep sayısını canlı döndürür. */
export function useActiveIssueCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => subscribeToIssues((issues) => setCount(countActiveIssues(issues)), () => undefined), []);
  return count;
}
