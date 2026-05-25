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
import { literalFallbacks } from '@/locales/literalFallbacks';

export type Language = LocaleCode;

interface LanguageContextProps {
  language: Language;
  changeLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: TranslationParams) => string;
  isRTL: boolean;
  isLanguageLoaded: boolean;
}

const allowRTL = (enabled: boolean) => {
  if (typeof I18nManager.allowRTL === 'function') {
    I18nManager.allowRTL(enabled);
  }
};

const forceRTL = (enabled: boolean) => {
  if (typeof I18nManager.forceRTL === 'function') {
    I18nManager.forceRTL(enabled);
  }
};

const swapLeftAndRightInRTL = (enabled: boolean) => {
  const swap = (I18nManager as typeof I18nManager & {
    swapLeftAndRightInRTL?: (enabled: boolean) => void;
  }).swapLeftAndRightInRTL;

  if (typeof swap === 'function') {
    swap(enabled);
  }
};

allowRTL(true);
swapLeftAndRightInRTL(true);

const nativeAlert = Alert.alert;

const interpolate = (template: string, params?: TranslationParams) => {
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value === undefined || value === null ? match : String(value);
  });
};

const translateKey = (language: Language, key: string, params?: TranslationParams) => {
  if (language === 'ar') {
    const stockMatch = key.match(/^Stock updated to (\d+) units\.$/);
    if (stockMatch) return interpolate(`تم تحديث المخزون إلى ${stockMatch[1]} وحدة.`, params);

    const productStatusMatch = key.match(/^Product (enabled|disabled) successfully\.$/);
    if (productStatusMatch) {
      return interpolate(`تم ${productStatusMatch[1] === 'enabled' ? 'تفعيل' : 'تعطيل'} المنتج بنجاح.`, params);
    }

    const quantityCartMatch = key.match(/^(\d+) x (.+) added to cart\.$/);
    if (quantityCartMatch) return interpolate(`تمت إضافة ${quantityCartMatch[1]} × ${quantityCartMatch[2]} إلى السلة.`, params);

    const stockLimitMatch = key.match(/^Only (\d+) units available in total\.$/);
    if (stockLimitMatch) return interpolate(`المتاح ${stockLimitMatch[1]} وحدة فقط إجمالاً.`, params);

    const bookingStatusMatch = key.match(/^Booking marked as (.+)\.$/);
    if (bookingStatusMatch) return interpolate(`تم تعليم الحجز كـ ${bookingStatusMatch[1]}.`, params);
  }

  const translated =
    translations[language]?.[key] ??
    literalFallbacks[language]?.[key] ??
    translations[DEFAULT_LANGUAGE][key] ??
    literalFallbacks[DEFAULT_LANGUAGE]?.[key] ??
    key;
  if (translated === key && params?.defaultValue !== undefined && params.defaultValue !== null) {
    return interpolate(String(params.defaultValue), params);
  }
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
    Alert.alert = (title, message, buttons, options) => {
      nativeAlert(
        translateKey(language, title),
        message ? translateKey(language, message) : message,
        buttons?.map((button) => ({
          ...button,
          text: button.text ? translateKey(language, button.text) : button.text,
        })),
        options
      );
    };

    return () => {
      Alert.alert = nativeAlert;
    };
  }, [language]);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        // Use stored preference, or fall back to the default language (English).
        // System language detection has been removed intentionally.
        const nextLanguage = isSupportedLanguage(storedLang) ? storedLang : DEFAULT_LANGUAGE;
        const nextRTL = nextLanguage === 'ar';

        setLanguageState(nextLanguage);

        if (I18nManager.isRTL !== nextRTL) {
          forceRTL(nextRTL);
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
        forceRTL(nextRTL);
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
