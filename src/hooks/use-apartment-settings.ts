import { useEffect, useState } from 'react';

import { EMPTY_SETTINGS, subscribeToSettings, type ApartmentSettings } from '@/services/settings';

/** Apartmanın ödeme bilgilerini (IBAN vb.) canlı döndürür. Yüklenirken null. */
export function useApartmentSettings(): ApartmentSettings | null {
  const [settings, setSettings] = useState<ApartmentSettings | null>(null);
  useEffect(() => subscribeToSettings(setSettings, () => setSettings(EMPTY_SETTINGS)), []);
  return settings;
}
