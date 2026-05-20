import ar from './ar';
import en from './en';

export type LocaleCode = 'en' | 'ar';
export type TranslationParams = Record<string, string | number>;
export type TranslationDictionary = Record<string, string>;

export const DEFAULT_LANGUAGE: LocaleCode = 'en';
export const LANGUAGE_STORAGE_KEY = 'user_language';

export const translations: Record<LocaleCode, TranslationDictionary> = {
  en,
  ar,
};

export const supportedLanguages: { code: LocaleCode; labelKey: string; nativeLabelKey: string }[] = [
  { code: 'en', labelKey: 'language.english', nativeLabelKey: 'language.englishNative' },
  { code: 'ar', labelKey: 'language.arabic', nativeLabelKey: 'language.arabicNative' },
];
