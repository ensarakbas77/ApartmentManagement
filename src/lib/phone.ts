import { Linking, Share } from 'react-native';

/** "0532 123 45 67" → "05321234567"; "+90 532..." → "+90532..." */
export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
}

/** "05321234567" → "0532 123 45 67" (Türkiye biçimi; diğerleri olduğu gibi). */
export function formatPhone(phone: string): string {
  const m = phone.match(/^0(\d{3})(\d{3})(\d{2})(\d{2})$/);
  return m ? `0${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}

export function isValidPhone(phone: string): boolean {
  return /^\+?\d{3,15}$/.test(phone);
}

export function callPhone(phone: string) {
  void Linking.openURL(`tel:${phone}`);
}

/** WhatsApp için uluslararası biçim: "05321234567" → "905321234567". */
function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (phone.startsWith('+')) return digits;
  if (digits.startsWith('0')) return `90${digits.slice(1)}`;
  if (digits.length === 10) return `90${digits}`;
  return digits;
}

/**
 * Hazır mesajla WhatsApp sohbetini açar. Numara yoksa telefonun paylaşım menüsü açılır
 * (kullanıcı WhatsApp'ı ve kişiyi kendisi seçer).
 */
export async function sendWhatsApp(phone: string | null, message: string) {
  if (phone) {
    const url = `https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(message)}`;
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // WhatsApp açılamazsa paylaşım menüsüne düş.
    }
  }
  await Share.share({ message });
}
