function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

/** "Bugün 14:30", "Dün 09:15", "12 Ekim", "12 Ekim 2025" gibi okunabilir tarih. */
export function formatRelativeDate(date: Date, now = new Date()): string {
  const time = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) return `Bugün ${time}`;
  if (isSameDay(date, yesterday)) return `Dün ${time}`;

  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
  });
}

/** "15 Ekim 2026, 14:30" */
export function formatFullDate(date: Date): string {
  return date.toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
