/**
 * Firebase Auth giriş için e-posta biçimi ister. Kullanıcılar ise sadece kullanıcı adı yazar.
 * "ensar" → "ensar@apartman.local". Bu adres gerçek değildir, hiçbir zaman e-posta gönderilmez.
 */
export const USERNAME_DOMAIN = 'apartman.local';

const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
};

/** "  Şükrü " → "sukru". Giriş ve kullanıcı oluşturma aynı fonksiyonu kullanmalı. */
export function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (ch) => TURKISH_CHAR_MAP[ch] ?? ch);
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9._-]{3,30}$/.test(username);
}

export function usernameToEmail(raw: string): string {
  return `${normalizeUsername(raw)}@${USERNAME_DOMAIN}`;
}
