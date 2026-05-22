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

  // Service categories
  'Brake Service': { en: 'Brake Service', ar: 'خدمة الفرامل' },
  'Car Wash & Detailing': { en: 'Car Wash & Detailing', ar: 'غسيل وتلميع السيارة' },
  'Car Wash': { en: 'Car Wash', ar: 'غسيل السيارة' },
  'Engine Diagnostics': { en: 'Engine Diagnostics', ar: 'تشخيص المحرك' },
  'General Inspection': { en: 'General Inspection', ar: 'فحص شامل' },
  'Tire Service': { en: 'Tire Service', ar: 'خدمة الإطارات' },
  Towing: { en: 'Towing', ar: 'سحب السيارات' },
  'Transmission Service': { en: 'Transmission Service', ar: 'خدمة ناقل الحركة' },

  // Product categories
  Interior: { en: 'Interior', ar: 'الداخلية' },
  Lighting: { en: 'Lighting', ar: 'إضاءة' },
  'Performance Parts': { en: 'Performance Parts', ar: 'قطع الأداء' },
  Suspension: { en: 'Suspension', ar: 'نظام التعليق' },
  'Tires & Wheels': { en: 'Tires & Wheels', ar: 'إطارات وجنوط' },
  'Tools & Equipment': { en: 'Tools & Equipment', ar: 'أدوات ومعدات' },

  // Emergency service types
  'Battery Charge': { en: 'Battery Charge', ar: 'شحن البطارية' },
  'Battery Jump': { en: 'Battery Jump', ar: 'تشغيل البطارية' },
  'Tire Change': { en: 'Tire Change', ar: 'تغيير الإطار' },
  'Flat Tire': { en: 'Flat Tire', ar: 'إصلاح إطار' },
  'Winch Truck': { en: 'Winch Truck', ar: 'ونش' },
  'Tow Truck': { en: 'Tow Truck', ar: 'سحب السيارة' },
  'Gas Fuel': { en: 'Gas Fuel', ar: 'توصيل وقود' },
  'Fuel Delivery': { en: 'Fuel Delivery', ar: 'توصيل وقود' },
  'Lockout Service': { en: 'Lockout Service', ar: 'فتح السيارة' },
  'Jump Start': { en: 'Jump Start', ar: 'تشغيل البطارية' },
};

export const translateCategoryName = (name: string, language: string): string => {
  if (!name) return name;
  const entry = categoryNameMap[name];
  if (!entry) return name;
  return language === 'ar' ? entry.ar : entry.en;
};
