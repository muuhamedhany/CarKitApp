import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, I18nManager } from 'react-native';

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  LocaleCode,
  TranslationParams,
  translations,
} from '@/locales';

export type Language = LocaleCode;

interface LanguageContextProps {
  language: Language;
  changeLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: TranslationParams) => string;
  isRTL: boolean;
  isLanguageLoaded: boolean;
}

I18nManager.allowRTL(true);
I18nManager.swapLeftAndRightInRTL(true);

const interpolate = (template: string, params?: TranslationParams) => {
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value === undefined || value === null ? match : String(value);
  });
};

const translateKey = (language: Language, key: string, params?: TranslationParams) => {
  const translated = translations[language]?.[key] ?? translations[DEFAULT_LANGUAGE][key] ?? key;
  return interpolate(translated, params);
};

const isSupportedLanguage = (value: string | null): value is Language => value === 'en' || value === 'ar';

const LanguageContext = createContext<LanguageContextProps>({
  language: DEFAULT_LANGUAGE,
  changeLanguage: async () => {},
  t: (key: string, params?: TranslationParams) => translateKey(DEFAULT_LANGUAGE, key, params),
  isRTL: false,
  isLanguageLoaded: false,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        const nextLanguage = isSupportedLanguage(storedLang) ? storedLang : DEFAULT_LANGUAGE;
        const nextRTL = nextLanguage === 'ar';

        setLanguageState(nextLanguage);

        if (I18nManager.isRTL !== nextRTL) {
          I18nManager.forceRTL(nextRTL);
        }
      } catch (err) {
        console.log('Error loading language', err);
        setLanguageState(DEFAULT_LANGUAGE);
      } finally {
        setIsLanguageLoaded(true);
      }
    };

    loadLanguage();
  }, []);

  const changeLanguage = useCallback(async (newLang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      setLanguageState(newLang);

      const nextRTL = newLang === 'ar';
      if (I18nManager.isRTL !== nextRTL) {
        I18nManager.forceRTL(nextRTL);
        Alert.alert(
          translateKey(newLang, 'language.restartTitle'),
          translateKey(newLang, 'language.restartMessage'),
          [{ text: translateKey(newLang, 'common.ok') }]
        );
      }
    } catch (err) {
      console.log('Error setting language', err);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams): string => translateKey(language, key, params),
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      changeLanguage,
      t,
      isRTL: language === 'ar',
      isLanguageLoaded,
    }),
    [changeLanguage, isLanguageLoaded, language, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
export const useLanguage = useTranslation;
