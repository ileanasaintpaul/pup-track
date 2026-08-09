import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from '../locales/fr.json';

export const LANGUAGE_STORAGE_KEY = 'puptrack.language';
export const FALLBACK_LANGUAGE = 'fr';

function readStoredLanguage(): string {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? FALLBACK_LANGUAGE;
  } catch {
    return FALLBACK_LANGUAGE;
  }
}

void i18next.use(initReactI18next).init({
  resources: { fr: { translation: fr } },
  lng: readStoredLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: { escapeValue: false },
});

export default i18next;
