import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Alert } from 'react-native';

export type Language = 'en' | 'ar';

interface LanguageContextProps {
  language: Language;
  changeLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav & Tabs
    'home': 'Home',
    'search': 'Search',
    'cart': 'Cart',
    'profile': 'Profile',
    'settings': 'Settings',

    // Home screen
    'welcome_back': 'Welcome Back',
    'quick_categories': 'Quick Categories',
    'emergency_help': 'Emergency Help',
    'emergency_sub': 'Tap for instant professional towing & repair',
    'roadside_rescue': '24/7 ROADSIDE RESCUE',
    'featured_services': 'Featured Services',
    'featured_products': 'Featured Products',
    'see_all': 'See All',
    'search_placeholder': 'Search premium oils, services...',

    // Profile & Settings screen
    'my_profile': 'My Profile',
    'my_vehicles': 'My Vehicles',
    'my_orders': 'My Orders',
    'my_bookings': 'My Bookings',
    'edit_profile': 'Edit Profile',
    'language': 'Language',
    'select_language': 'Select Language',
    'english': 'English (EN)',
    'arabic': 'Arabic (AR)',
    'appearance': 'Appearance',
    'dark_mode': 'Dark Mode',
    'theme_variant': 'Theme Color Mode',
    'traditional': 'Neon Pink & Purple',
    'green': 'Boutique Green',
    'navy': 'Ocean Navy Blue',
    'save': 'Save Changes',
    'logout': 'Sign Out',
    'help_support': 'Help & Support',
    'privacy_policy': 'Privacy Policy',
    'terms_conditions': 'Terms & Conditions',
    'wishlist': 'Wishlist',
    'addresses': 'Addresses',
    'payments': 'Payments',
    'quick_access': 'Quick Access',
    'account_settings': 'Account & Settings',
    'security': 'Security',
    'security_desc': 'Change password and privacy settings',
    'help_center': 'Help Center',
    'help_center_desc': 'FAQs and customer support',
    'terms_of_service': 'Terms of Service',
    'terms_of_service_desc': 'Read our usage guidelines',
    'privacy_policy_desc': 'How we protect your data',
    'signout_confirm': 'Are you sure you want to sign out of your account?',
    'cancel': 'Cancel',
    'light': 'Light',
    'dark': 'Dark',
    'system': 'System',

    // Product & Services Checkout
    'add_to_cart': 'Add to Cart',
    'added_to_cart': 'Added to Cart!',
    'checkout': 'Checkout',
    'service_type': 'Service Method',
    'at_home': 'Home Delivery',
    'at_workshop': 'Apply at Workshop (+70 EGP)',
    'towing_fee': 'Towing Service Fee',
    'delivery_fee': 'Home Delivery Fee',
    'service_charge': 'Workshop Service Fee',
    'total': 'Total Amount',
    'place_order': 'Confirm and Place Order',
    'queue_number': 'Your Queue Position',
    'estimated_wait': 'Estimated Wait Time',
    'mins': 'minutes',
    'people_before': 'cars before you',
    'show_up_time': 'Recommended Arrival Time',
    'shuffling_feed': 'Shuffling Feed...',
  },
  ar: {
    // Nav & Tabs
    'home': 'الرئيسية',
    'search': 'البحث',
    'cart': 'السلة',
    'profile': 'الحساب',
    'settings': 'الإعدادات',

    // Home screen
    'welcome_back': 'مرحباً بك',
    'quick_categories': 'الأقسام السريعة',
    'emergency_help': 'مساعدة طارئة',
    'emergency_sub': 'اضغط للحصول على ونش إنقاذ وإصلاح فوري',
    'roadside_rescue': 'إنقاذ الطريق ٢٤/٧',
    'featured_services': 'خدمات مميزة',
    'featured_products': 'منتجات مميزة',
    'see_all': 'عرض الكل',
    'search_placeholder': 'ابحث عن زيوت، فلاتر، خدمات...',

    // Profile & Settings screen
    'my_profile': 'الملف الشخصي',
    'my_vehicles': 'سياراتي',
    'my_orders': 'طلباتي',
    'my_bookings': 'حجوزاتي',
    'edit_profile': 'تعديل الحساب',
    'language': 'اللغة',
    'select_language': 'اختر اللغة',
    'english': 'الإنجليزية (EN)',
    'arabic': 'العربية (AR)',
    'appearance': 'المظهر',
    'dark_mode': 'الوضع الداكن',
    'theme_variant': 'لون المظهر المتناسق',
    'traditional': 'نيون وردي وبنفسجي',
    'green': 'أخضر بوتيك هادئ',
    'navy': 'أزرق كحلي ملكي',
    'save': 'حفظ التغييرات',
    'logout': 'تسجيل الخروج',
    'help_support': 'المساعدة والدعم',
    'privacy_policy': 'سياسة الخصوصية',
    'terms_conditions': 'الشروط والأحكام',
    'wishlist': 'قائمة الأمنيات',
    'addresses': 'العناوين والنشاط',
    'payments': 'وسائل الدفع',
    'quick_access': 'الوصول السريع',
    'account_settings': 'الحساب والإعدادات',
    'security': 'الأمان والحماية',
    'security_desc': 'تغيير كلمة المرور وإعدادات الخصوصية',
    'help_center': 'مركز المساعدة والدعم',
    'help_center_desc': 'الأسئلة الشائعة وتواصل معنا',
    'terms_of_service': 'شروط وأحكام الخدمة',
    'terms_of_service_desc': 'اقرأ إرشادات استخدام التطبيق',
    'privacy_policy_desc': 'كيفية حماية وتأمين بياناتك',
    'signout_confirm': 'هل أنت متأكد من رغبتك في تسجيل الخروج من حسابك؟',
    'cancel': 'إلغاء',
    'light': 'مضيء',
    'dark': 'داكن',
    'system': 'تلقائي (النظام)',

    // Product & Services Checkout
    'add_to_cart': 'أضف إلى السلة',
    'added_to_cart': 'تمت الإضافة للسلة!',
    'checkout': 'الدفع والطلب',
    'service_type': 'طريقة الاستلام والخدمة',
    'at_home': 'توصيل للمنزل',
    'at_workshop': 'التركيب في الورشة (+٧٠ ج.م)',
    'towing_fee': 'تكلفة خدمة الونش والإنقاذ',
    'delivery_fee': 'تكلفة الشحن والتوصيل',
    'service_charge': 'رسوم الخدمة والتركيب بالورشة',
    'total': 'المجموع الإجمالي',
    'place_order': 'تأكيد وإتمام الطلب',
    'queue_number': 'رقمك في دور الانتظار',
    'estimated_wait': 'الوقت المتوقع للانتظار',
    'mins': 'دقيقة',
    'people_before': 'سيارات متبقية أمامك',
    'show_up_time': 'وقت الحضور الموصى به',
    'shuffling_feed': 'جاري ترتيب القائمة...',
  }
};

const LanguageContext = createContext<LanguageContextProps>({
  language: 'en',
  changeLanguage: async () => {},
  t: (key: string) => key,
  isRTL: false,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('user_language');
        if (storedLang === 'en' || storedLang === 'ar') {
          setLanguageState(storedLang as Language);
          
          const isAr = storedLang === 'ar';
          if (I18nManager.isRTL !== isAr) {
            I18nManager.forceRTL(isAr);
          }
        }
      } catch (err) {
        console.log('Error loading language', err);
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = async (newLang: Language) => {
    try {
      await AsyncStorage.setItem('user_language', newLang);
      setLanguageState(newLang);
      
      const isAr = newLang === 'ar';
      if (I18nManager.isRTL !== isAr) {
        I18nManager.forceRTL(isAr);
        Alert.alert(
          newLang === 'ar' ? 'تغيير اللغة' : 'Language Changed',
          newLang === 'ar' 
            ? 'يرجى إغلاق التطبيق وإعادة فتحه لتطبيق اتجاهات وتصميم اللغة العربية بشكل كامل!' 
            : 'Please restart the app to apply the English layout and direction fully!',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.log('Error setting language', err);
    }
  };

  const t = (key: string): string => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    if (translations['en'] && translations['en'][key]) {
      return translations['en'][key];
    }
    return key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
