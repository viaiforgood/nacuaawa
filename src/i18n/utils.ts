import type { Locale } from './locales';
import { defaultLocale, locales } from './locales';
import { ui, type UIKey } from './ui';

export function getLangFromUrl(url: URL): Locale {
  const [, segment] = url.pathname.split('/');
  if (locales.includes(segment as any)) {
    return segment as Locale;
  }
  return defaultLocale;
}

export function useTranslations(lang: Locale) {
  return function t(key: UIKey): string {
    return ui[lang][key] ?? ui[defaultLocale][key];
  };
}

export function getLocalizedPath(path: string, locale: Locale): string {
  const cleanPath = path.replace(/^\/(en|zh-TW|zh-CN)/, '') || '/';
  const normalized = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  if (locale === defaultLocale) return normalized;
  return `/${locale}${normalized === '/' ? '' : normalized}`;
}

export function getAlternateLinks(path: string) {
  return {
    'zh-CN': getLocalizedPath(path, 'zh-CN'),
    en: getLocalizedPath(path, 'en'),
    'zh-TW': getLocalizedPath(path, 'zh-TW'),
  } as const;
}
