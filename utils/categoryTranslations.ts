export const categoryNameMap: Record<string, { en: string; ar: string }> = {
  'Audio & Electronics': { en: 'Audio & Electronics', ar: 'صوتيات وإلكترونيات' },
  'Body Parts': { en: 'Body Parts', ar: 'قطع هيكل السيارة' },
  'Brake System': { en: 'Brake System', ar: 'نظام الفرامل' },
  'Car Care & Detailing': { en: 'Car Care & Detailing', ar: 'عناية وتلميع' },
  Electrical: { en: 'Electrical', ar: 'كهربائيات' },
  'Engine Parts': { en: 'Engine Parts', ar: 'قطع المحرك' },
  'Exhaust Systems': { en: 'Exhaust Systems', ar: 'أنظمة العادم' },
  Filters: { en: 'Filters', ar: 'فلاتر' },
  'Fluids & Oils': { en: 'Fluids & Oils', ar: 'سوائل وزيوت' },
  'Suspension & Steering': { en: 'Suspension & Steering', ar: 'تعليق وتوجيه' },
  Transmission: { en: 'Transmission', ar: 'ناقل الحركة' },
  'Cooling System': { en: 'Cooling System', ar: 'نظام التبريد' },
  'Oil Change': { en: 'Oil Change', ar: 'تغيير الزيت' },
  'Tire Services': { en: 'Tire Services', ar: 'خدمات الإطارات' },
  Diagnostics: { en: 'Diagnostics', ar: 'فحص وتشخيص' },
  'Wheel Alignment': { en: 'Wheel Alignment', ar: 'ضبط الإطارات' },
  'Battery Service': { en: 'Battery Service', ar: 'خدمة البطارية' },
  'AC Service': { en: 'AC Service', ar: 'خدمة التكييف' },
  Detailing: { en: 'Detailing', ar: 'تلميع' },
};

export const translateCategoryName = (name: string, language: string): string => {
  if (!name) return name;
  const entry = categoryNameMap[name];
  if (!entry) return name;
  return language === 'ar' ? entry.ar : entry.en;
};
