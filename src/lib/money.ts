/** 1500 → "1.500 ₺", 1500.5 → "1.500,50 ₺" */
export function formatMoney(amount: number): string {
  const hasKurus = Math.round(amount * 100) % 100 !== 0;
  const text = amount.toLocaleString('tr-TR', {
    minimumFractionDigits: hasKurus ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${text} ₺`;
}

/**
 * Kullanıcının yazdığı tutarı sayıya çevirir. Türkçe biçimleri kabul eder:
 * "1500", "1.500", "1500,50", "1.500,50". Geçersizse null döner.
 */
export function parseMoney(input: string): number | null {
  const cleaned = input.trim().replace(/\s|₺/g, '');
  if (!cleaned) return null;

  // Virgül varsa ondalık ayracıdır; noktalar binlik ayracıdır.
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/\.(?=\d{3}(\D|$))/g, '');

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}
