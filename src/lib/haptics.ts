import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

/** Butona dokunma gibi hafif geri bildirim. */
export function tapFeedback() {
  if (enabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

/** Sekme, seçenek değiştirme gibi seçim geri bildirimi. */
export function selectionFeedback() {
  if (enabled) void Haptics.selectionAsync().catch(() => undefined);
}

/** İşlem başarılı (oy verildi, kaydedildi) geri bildirimi. */
export function successFeedback() {
  if (enabled) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }
}
