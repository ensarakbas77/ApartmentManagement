import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Bu telefonda okunan duyuruların kimlikleri. "Yeni" rozeti için kullanılır.
 * Telefonda (AsyncStorage) tutulur; Firestore'a sadece yöneticinin göreceği okunma kaydı yazılır.
 */
const MAX_IDS = 200;

let currentUid: string | null = null;
let readIds = new Set<string>();
/** Hiç kayıt yoksa (ilk kurulum) mevcut duyurular okunmuş sayılır; yoksa herkes eski duyurular için rozet görür. */
let firstRun = false;
let loaded = false;
const listeners = new Set<() => void>();
let version = 0;

function storageKey(uid: string) {
  return `readAnnouncements:${uid}`;
}

function emit() {
  version += 1;
  listeners.forEach((listener) => listener());
}

function persist() {
  if (!currentUid) return;
  const ids = [...readIds].slice(-MAX_IDS);
  void AsyncStorage.setItem(storageKey(currentUid), JSON.stringify(ids)).catch(() => undefined);
}

/** Oturum açan kullanıcının okunanlar listesini yükler. */
export async function loadReadAnnouncements(uid: string) {
  if (currentUid === uid && loaded) return;
  currentUid = uid;
  loaded = false;
  try {
    const raw = await AsyncStorage.getItem(storageKey(uid));
    firstRun = raw === null;
    readIds = new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    firstRun = false;
    readIds = new Set();
  }
  loaded = true;
  emit();
}

/** İlk kurulumda o an var olan duyuruları okunmuş say. */
export function seedIfFirstRun(ids: string[]) {
  if (!loaded || !firstRun) return;
  firstRun = false;
  ids.forEach((id) => readIds.add(id));
  persist();
  emit();
}

export function markAnnouncementReadLocally(id: string) {
  if (readIds.has(id)) return;
  readIds.add(id);
  persist();
  emit();
}

export function isAnnouncementRead(id: string): boolean {
  return readIds.has(id);
}

export function isReadStoreLoaded(): boolean {
  return loaded;
}

export function subscribeReadStore(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getReadStoreVersion() {
  return version;
}
