import type { Language } from '@/contexts/LanguageContext';

const localeForLanguage = (language: Language = 'en') => (language === 'ar' ? 'ar-EG' : 'en-US');

export const formatCurrency = (amount: number, currency: string = 'USD', language: Language = 'en') => {
  return new Intl.NumberFormat(localeForLanguage(language), {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (dateString: string, language: Language = 'en') => {
  return new Intl.DateTimeFormat(localeForLanguage(language), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
};

export const truncateText = (text: string, length: number) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};
