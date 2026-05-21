import {
  MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter,
  useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback,
  useEffect,
  useMemo,
  useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormInput, GlassView, GradientButton } from '@/components';
import { API_URL } from '@/constants/config';
import { BorderRadius, FontSizes, Fonts, Shadows, Spacing } from '@/constants/theme';
import { useToast } from '@/contexts/ToastContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import { Category, ServiceCategory } from '@/types/api.types';
import { translateCategoryName } from '@/utils/categoryTranslations';
import Text from '@/components/common/LocalizedText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CategoryFilterScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { t, language } = useTranslation();
  const params = useLocalSearchParams<{ product_categories?: string; service_categories?: string }>();

  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [productsExpanded, setProductsExpanded] = useState(true);
  const [servicesExpanded, setServicesExpanded] = useState(true);

  useEffect(() => {
    const rawProducts = Array.isArray(params.product_categories) ? params.product_categories[0] : params.product_categories;
    const rawServices = Array.isArray(params.service_categories) ? params.service_categories[0] : params.service_categories;
    const parse = (raw?: string) => raw?.trim().length ? raw.split(',').map(Number).filter(v => Number.isFinite(v) && v > 0) : [];
    setSelectedProductIds(parse(rawProducts));
    setSelectedServiceIds(parse(rawServices));
  }, [params.product_categories, params.service_categories]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          fetch(`${API_URL}/categories`),
          fetch(`${API_URL}/services/categories`),
        ]);
        const [pData, sData] = await Promise.all([pRes.json(), sRes.json()]);
        if (pData.success) setProductCategories(pData.data || []);
        if (sData.success) setServiceCategories(sData.data || []);
      } catch {
        showToast('error', t('common.error'), t('categoryFilter.loadFailed'));
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, [showToast, t]);

  const toggleProduct = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  const toggleService = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedServiceIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  const filteredProducts = productCategories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    translateCategoryName(c.name, language).toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredServices = serviceCategories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    translateCategoryName(c.name, language).toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedCount = selectedProductIds.length + selectedServiceIds.length;

  const handleApply = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.navigate({
      pathname: '/(tabs)/search',
      params: {
        product_categories: selectedProductIds.join(','),
        service_categories: selectedServiceIds.join(','),
      },
    });
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedProductIds([]);
    setSelectedServiceIds([]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.pink} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.bgGradientStart, colors.bgGradientEnd]} style={StyleSheet.absoluteFill} />
      
      <View style={[styles.orb, { top: -100, right: -150, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 100, left: -200, backgroundColor: colors.purple + '10' }]} />

      {/* Modern Integrated Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <Pressable 
            onPress={() => router.back()} 
            style={({ pressed }) => [styles.backBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder, opacity: pressed ? 0.7 : 1 }]}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('categoryFilter.title')}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {t('categoryFilter.selected', { count: selectedProductIds.length + selectedServiceIds.length })}
            </Text>
          </View>
          <Pressable onPress={handleClear} style={styles.resetBtn}>
             <Text style={[styles.resetBtnText, { color: colors.pink }]}>{t('common.reset')}</Text>
          </Pressable>
        </View>

        <FormInput
          icon="magnify"
          placeholder="categoryFilter.searchPlaceholder"
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchBar}
          rightIcon={searchQuery ? "close-circle" : undefined}
          onRightIconPress={() => setSearchQuery('')}
        />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Products Section */}
        {filteredProducts.length > 0 && (
          <Animated.View layout={Layout.springify()} entering={FadeInDown.delay(100)} style={styles.section}>
            <Pressable 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setProductsExpanded(!productsExpanded);
              }}
              style={styles.sectionHeader}
            >
              <View style={styles.sectionHeaderLeft}>
                <MaterialCommunityIcons name="package-variant-closed" size={20} color={colors.pink} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('categoryFilter.products')}</Text>
              </View>
              <MaterialCommunityIcons 
                name={productsExpanded ? "chevron-up" : "chevron-down"} 
                size={24} 
                color={colors.textSecondary} 
              />
            </Pressable>
            {productsExpanded && (
              <View style={styles.grid}>
              {filteredProducts.map((cat, idx) => {
                const selected = selectedProductIds.includes(cat.category_id);
                return (
                  <Animated.View key={cat.category_id} entering={FadeInUp.delay(idx * 50)} style={styles.gridItem}>
                    <Pressable onPress={() => toggleProduct(cat.category_id)}>
                      <GlassView 
                        intensity={selected ? 40 : 20} 
                        tint={isDark ? 'dark' : 'light'} 
                        style={[
                          styles.catCard, 
                          { 
                            borderColor: selected ? colors.pink : colors.cardBorder,
                            backgroundColor: selected ? colors.pink + '15' : 'transparent'
                          }
                        ]}
                      >
                        <View style={[styles.catIconWrap, { backgroundColor: selected ? colors.pink : colors.backgroundSecondary }]}>
                           <MaterialCommunityIcons name={selected ? "check" : "plus"} size={16} color={selected ? "#FFF" : colors.textMuted} />
                        </View>
                        <Text style={[styles.catName, { color: colors.textPrimary }, selected && styles.catNameSelected]} numberOfLines={2}>
                          {translateCategoryName(cat.name, language)}
                        </Text>
                      </GlassView>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
            )}
          </Animated.View>
        )}

        {/* Services Section */}
        {filteredServices.length > 0 && (
          <Animated.View layout={Layout.springify()} entering={FadeInDown.delay(300)} style={styles.section}>
            <Pressable 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setServicesExpanded(!servicesExpanded);
              }}
              style={styles.sectionHeader}
            >
              <View style={styles.sectionHeaderLeft}>
                <MaterialCommunityIcons name="wrench-outline" size={20} color={colors.pink} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('categoryFilter.services')}</Text>
              </View>
              <MaterialCommunityIcons 
                name={servicesExpanded ? "chevron-up" : "chevron-down"} 
                size={24} 
                color={colors.textSecondary} 
              />
            </Pressable>
            {servicesExpanded && (
              <View style={styles.grid}>
              {filteredServices.map((cat, idx) => {
                const selected = selectedServiceIds.includes(cat.service_category_id);
                return (
                  <Animated.View key={cat.service_category_id} entering={FadeInUp.delay(idx * 50)} style={styles.gridItem}>
                    <Pressable onPress={() => toggleService(cat.service_category_id)}>
                      <GlassView 
                        intensity={selected ? 40 : 20} 
                        tint={isDark ? 'dark' : 'light'} 
                        style={[
                          styles.catCard, 
                          { 
                            borderColor: selected ? colors.pink : colors.cardBorder,
                            backgroundColor: selected ? colors.pink + '15' : 'transparent'
                          }
                        ]}
                      >
                        <View style={[styles.catIconWrap, { backgroundColor: selected ? colors.pink : colors.backgroundSecondary }]}>
                           <MaterialCommunityIcons name={selected ? "check" : "plus"} size={16} color={selected ? "#FFF" : colors.textMuted} />
                        </View>
                        <Text style={[styles.catName, { color: colors.textPrimary }, selected && styles.catNameSelected]} numberOfLines={2}>
                          {translateCategoryName(cat.name, language)}
                        </Text>
                      </GlassView>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
            )}
          </Animated.View>
        )}

        {filteredProducts.length === 0 && filteredServices.length === 0 && (
           <View style={styles.emptyState}>
              <MaterialCommunityIcons name="magnify-close" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('categoryFilter.noResults', { query: searchQuery })}</Text>
           </View>
        )}
      </ScrollView>

      {/* Floating Action Bar */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <GlassView intensity={40} tint={isDark ? 'dark' : 'light'} style={styles.footerGlass}>
          <GradientButton 
            title={t('categoryFilter.applySelection', { count: selectedCount })}
            onPress={handleApply}
            style={styles.applyBtn}
          />
        </GlassView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: { position: 'absolute', width: 400, height: 400, borderRadius: 200, opacity: 0.5 },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  backBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { flex: 1, marginLeft: Spacing.md },
  headerTitle: { fontFamily: Fonts.extraBold, fontSize: 18, letterSpacing: -0.5 },
  headerSubtitle: { fontFamily: Fonts.medium, fontSize: 13, opacity: 0.6 },
  resetBtn: { padding: 8 },
  resetBtnText: { fontFamily: Fonts.bold, fontSize: 14 },
  searchBar: { marginBottom: 0 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  section: { marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontFamily: Fonts.extraBold, fontSize: 20, letterSpacing: -0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  gridItem: { width: '50%', padding: 6 },
  catCard: { borderRadius: BorderRadius.xl, padding: Spacing.md, borderWidth: 1, minHeight: 90, justifyContent: 'space-between', overflow: 'hidden' },
  catIconWrap: { width: 28, height: 28, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  catName: { fontFamily: Fonts.bold, fontSize: 14, lineHeight: 18, marginTop: 10 },
  catNameSelected: { fontFamily: Fonts.extraBold },
  emptyState: { alignItems: 'center', marginTop: 60, opacity: 0.6 },
  emptyText: { fontFamily: Fonts.medium, fontSize: 16, marginTop: 16 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing.lg },
  footerGlass: { borderRadius: BorderRadius.xxl, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', ...Shadows.lg },
  applyBtn: { marginTop: 0 },
});

