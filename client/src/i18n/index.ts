import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import mn from './mn.json';

// Read saved language from zustand persist store
function getSavedLanguage(): string {
  try {
    const saved = localStorage.getItem('techmart-ui');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed?.state?.language || 'en';
    }
  } catch {}
  return 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    mn: { translation: mn },
  },
  lng: getSavedLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
