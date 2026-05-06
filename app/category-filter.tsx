import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  Layout, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { CenteredHeader } from '@/components';
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows, Colors } from '@/constants/theme';
import { Category, ServiceCategory } from '@/types/api.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CategoryFilterScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();
    const params = useLocalSearchParams<{ product_categories?: string; service_categories?: string }>();

    const [productCategories, setProductCategories] = useState<Category[]>([]);
    const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const rawProducts = Array.isArray(params.product_categories)
            ? params.product_categories[0]
            : params.product_categories;
        const rawServices = Array.isArray(params.service_categories)
            ? params.service_categories[0]
            : params.service_categories;
        const parsedProducts = rawProducts && rawProducts.trim().length > 0
            ? rawProducts.split(',')
                .map((value: string) => Number(value))
                .filter((value: number) => Number.isFinite(value) && value > 0)
            : [];
        const parsedServices = rawServices && rawServices.trim().length > 0
            ? rawServices.split(',')
                .map((value: string) => Number(value))
                .filter((value: number) => Number.isFinite(value) && value > 0)
            : [];
        setSelectedProductIds(parsedProducts);
        setSelectedServiceIds(parsedServices);
    }, [params.product_categories, params.service_categories]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const [productResponse, serviceResponse] = await Promise.all([
                    fetch(`${API_URL}/categories`),
                    fetch(`${API_URL}/services/categories`),
                ]);
                const [productData, serviceData] = await Promise.all([
                    productResponse.json(),
                    serviceResponse.json(),
                ]);
                if (productData.success) {
                    setProductCategories(productData.data || []);
                } else {
                    showToast('error', 'Error', 'Could not load product categories.');
                }
                if (serviceData.success) {
                    setServiceCategories(serviceData.data || []);
                } else {
                    showToast('error', 'Error', 'Could not load service categories.');
                }
            } catch {
                showToast('error', 'Error', 'Could not load categories.');
            } finally {
                setLoading(false);
            }
        };

        loadCategories();
    }, [showToast]);

    const toggleProductCategory = useCallback((categoryId: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedProductIds((prev) => {
            if (prev.includes(categoryId)) {
                return prev.filter((id) => id !== categoryId);
            }
            return [...prev, categoryId];
        });
    }, []);

    const toggleServiceCategory = useCallback((categoryId: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedServiceIds((prev) => {
            if (prev.includes(categoryId)) {
                return prev.filter((id) => id !== categoryId);
            }
            return [...prev, categoryId];
        });
    }, []);

    const selectedLabel = useMemo(() => {
        if (selectedProductIds.length === 0 && selectedServiceIds.length === 0) {
            return 'All categories';
        }
        const parts = [] as string[];
        if (selectedProductIds.length > 0) parts.push(`${selectedProductIds.length} Products`);
        if (selectedServiceIds.length > 0) parts.push(`${selectedServiceIds.length} Services`);
        return parts.join(' · ');
    }, [selectedProductIds.length, selectedServiceIds.length]);

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

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative Orbs */}
            <View style={[styles.orb, { top: -100, right: -150, backgroundColor: colors.pink + '15' }]} />
            <View style={[styles.orb, { bottom: 100, left: -200, backgroundColor: colors.purple + '10' }]} />

            <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
                <BlurView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                <CenteredHeader
                    title="Categories"
                    titleColor={colors.textPrimary}
                    rowStyle={{ borderBottomWidth: 0 }}
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.pink} />
                </View>
            ) : (
                <>
                    <Animated.View entering={FadeInDown.delay(100)} style={styles.summaryRow}>
                        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>{selectedLabel}</Text>
                        {(selectedProductIds.length > 0 || selectedServiceIds.length > 0) && (
                            <Pressable onPress={handleClear}>
                                <Text style={[styles.clearText, { color: colors.pink }]}>Reset All</Text>
                            </Pressable>
                        )}
                    </Animated.View>

                    <ScrollView 
                        contentContainerStyle={[styles.list, { paddingBottom: 140 + insets.bottom }]}
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View entering={FadeInUp.delay(200)}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Shop Products</Text>
                            {productCategories.length === 0 ? (
                                <Text style={[styles.sectionHint, { color: colors.textMuted }]}>No product categories available.</Text>
                            ) : (
                                productCategories.map((category, idx) => {
                                    const isSelected = selectedProductIds.includes(category.category_id);
                                    return (
                                        <Animated.View key={category.category_id} entering={FadeInUp.delay(200 + idx * 50)}>
                                            <Pressable
                                                onPress={() => toggleProductCategory(category.category_id)}
                                                style={[
                                                    styles.row,
                                                    { 
                                                        backgroundColor: isSelected 
                                                            ? (isDark ? 'rgba(205, 66, 168, 0.15)' : 'rgba(205, 66, 168, 0.05)') 
                                                            : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'),
                                                        borderColor: isSelected ? colors.pink : colors.cardBorder 
                                                    },
                                                ]}
                                            >
                                                <View style={styles.rowLeft}>
                                                    <View style={[styles.checkIcon, isSelected && { backgroundColor: colors.pink }]}>
                                                        <MaterialCommunityIcons
                                                            name={isSelected ? 'check' : 'plus'}
                                                            size={16}
                                                            color={isSelected ? '#FFF' : colors.textMuted}
                                                        />
                                                    </View>
                                                    <Text style={[
                                                        styles.rowText, 
                                                        { color: colors.textPrimary },
                                                        isSelected && { fontFamily: Fonts.extraBold }
                                                    ]}>
                                                        {category.name}
                                                    </Text>
                                                </View>
                                                {isSelected && (
                                                    <MaterialCommunityIcons name="heart" size={16} color={colors.pink} />
                                                )}
                                            </Pressable>
                                        </Animated.View>
                                    );
                                })
                            )}
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(400)} style={{ marginTop: Spacing.xl }}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Book Services</Text>
                            {serviceCategories.length === 0 ? (
                                <Text style={[styles.sectionHint, { color: colors.textMuted }]}>No service categories available.</Text>
                            ) : (
                                serviceCategories.map((category, idx) => {
                                    const isSelected = selectedServiceIds.includes(category.service_category_id);
                                    return (
                                        <Animated.View key={category.service_category_id} entering={FadeInUp.delay(400 + idx * 50)}>
                                            <Pressable
                                                onPress={() => toggleServiceCategory(category.service_category_id)}
                                                style={[
                                                    styles.row,
                                                    { 
                                                        backgroundColor: isSelected 
                                                            ? (isDark ? 'rgba(205, 66, 168, 0.15)' : 'rgba(205, 66, 168, 0.05)') 
                                                            : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'),
                                                        borderColor: isSelected ? colors.pink : colors.cardBorder 
                                                    },
                                                ]}
                                            >
                                                <View style={styles.rowLeft}>
                                                    <View style={[styles.checkIcon, isSelected && { backgroundColor: colors.pink }]}>
                                                        <MaterialCommunityIcons
                                                            name={isSelected ? 'check' : 'plus'}
                                                            size={16}
                                                            color={isSelected ? '#FFF' : colors.textMuted}
                                                        />
                                                    </View>
                                                    <Text style={[
                                                        styles.rowText, 
                                                        { color: colors.textPrimary },
                                                        isSelected && { fontFamily: Fonts.extraBold }
                                                    ]}>
                                                        {category.name}
                                                    </Text>
                                                </View>
                                                {isSelected && (
                                                    <MaterialCommunityIcons name="heart" size={16} color={colors.pink} />
                                                )}
                                            </Pressable>
                                        </Animated.View>
                                    );
                                })
                            )}
                        </Animated.View>
                    </ScrollView>

                    <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
                        <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                        <Pressable 
                            onPress={handleApply} 
                            style={({ pressed }) => [
                                styles.applyButton, 
                                { 
                                    backgroundColor: colors.pink,
                                    opacity: pressed ? 0.9 : 1,
                                    transform: [{ scale: pressed ? 0.98 : 1 }]
                                }
                            ]}
                        >
                            <Text style={styles.applyText}>Apply Selection</Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                        </Pressable>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    orb: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
        opacity: 0.5,
    },
    headerContainer: {
        zIndex: 10,
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    summaryText: { fontFamily: Fonts.bold, fontSize: FontSizes.sm, letterSpacing: -0.2 },
    clearText: { fontFamily: Fonts.extraBold, fontSize: FontSizes.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
    list: { paddingHorizontal: Spacing.lg },
    sectionTitle: { fontFamily: Fonts.extraBold, fontSize: 24, marginTop: Spacing.md, marginBottom: Spacing.md, letterSpacing: -0.8 },
    sectionHint: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginBottom: Spacing.sm, opacity: 0.5 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: 16,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        ...Shadows.sm,
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    checkIcon: {
        width: 24,
        height: 24,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowText: { fontFamily: Fonts.bold, fontSize: FontSizes.md, letterSpacing: -0.3 },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        overflow: 'hidden',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    applyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: BorderRadius.xl,
        ...Shadows.md,
        shadowColor: Colors.pink,
    },
    applyText: { color: '#fff', fontFamily: Fonts.extraBold, fontSize: FontSizes.md, letterSpacing: -0.2 },
});
