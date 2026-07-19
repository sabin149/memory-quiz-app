import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import ne from '@/locales/ne.json';

export type LanguagePreference = 'system' | 'en' | 'ne' | 'es';

export const SUPPORTED_LANGUAGES: { value: LanguagePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'en', label: 'English' },
  { value: 'ne', label: 'नेपाली' },
  { value: 'es', label: 'Español' },
];

function deviceLanguage(): string {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return ['en', 'ne', 'es'].includes(code) ? code : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ne: { translation: ne },
    es: { translation: es },
  },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
});

/** Applies the persisted preference ('system' resolves to the device locale). */
export function applyLanguage(preference: LanguagePreference): void {
  i18n.changeLanguage(preference === 'system' ? deviceLanguage() : preference);
}

export default i18n;
