import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './en/common.json';
import enContent from './en/content.json';
import enLegal from './en/legal.json';
import esCommon from './es/common.json';
import esContent from './es/content.json';
import esLegal from './es/legal.json';
import { defaultLocale, isSupportedLocale } from './locales';

function getInitialLocale() {
  if (typeof navigator === 'undefined') {
    return defaultLocale;
  }

  const preferredLocale = navigator.languages?.[0] ?? navigator.language;
  const language = preferredLocale?.split('-')[0];

  return isSupportedLocale(language) ? language : defaultLocale;
}

void i18n.use(initReactI18next).init({
  defaultNS: 'common',
  fallbackLng: defaultLocale,
  initImmediate: false,
  interpolation: {
    escapeValue: false
  },
  lng: getInitialLocale(),
  ns: ['common', 'content', 'legal'],
  resources: {
    en: {
      common: enCommon,
      content: enContent,
      legal: enLegal
    },
    es: {
      common: esCommon,
      content: esContent,
      legal: esLegal
    }
  }
});

i18n.on('languageChanged', (locale) => {
  document.documentElement.lang = isSupportedLocale(locale) ? locale : defaultLocale;
});

document.documentElement.lang = getInitialLocale();

export default i18n;
