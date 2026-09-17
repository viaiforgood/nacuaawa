export const locales = ['zh-CN', 'en', 'zh-TW'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh-CN';

export const localeLabels: Record<Locale, string> = {
  'zh-CN': '简体中文',
  en: 'English',
  'zh-TW': '繁體中文',
};

export const localeHtmlLang: Record<Locale, string> = {
  'zh-CN': 'zh-Hans',
  en: 'en',
  'zh-TW': 'zh-Hant',
};
