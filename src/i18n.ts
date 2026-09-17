import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import commonEn from './locales/en/common.json';
import commonEs from './locales/es/common.json';
import subaccountEn from './locales/en/subaccount.json';
import subaccountEs from './locales/es/subaccount.json';

export const SUB_ACCOUNT_LANGUAGE_STORAGE_KEY = 'subAccountLanguage';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: commonEn, subaccount: subaccountEn },
      es: { common: commonEs, subaccount: subaccountEs },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'subaccount'],
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: SUB_ACCOUNT_LANGUAGE_STORAGE_KEY,
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
