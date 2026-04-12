import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { CenteredHeader } from '@/components';
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import { Category, ServiceCategory } from '@/types/api.types';

export default function CategoryFilterScreen() {
    const router = useRouter();
    const { colors } = useTheme();
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
        setSelectedProductIds((prev) => {
            if (prev.includes(categoryId)) {
                return prev.filter((id) => id !== categoryId);
            }
            return [...prev, categoryId];
        });
    }, []);

    const toggleServiceCategory = useCallback((categoryId: number) => {
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
        if (selectedProductIds.length > 0) parts.push(`Products: ${selectedProductIds.length}`);
        if (selectedServiceIds.length > 0) parts.push(`Services: ${selectedServiceIds.length}`);
        return parts.join(' · ');
    }, [selectedProductIds.length, selectedServiceIds.length]);

    const handleApply = () => {
        router.navigate({
            pathname: '/(tabs)/search',
            params: {
                product_categories: selectedProductIds.join(','),
                service_categories: selectedServiceIds.join(','),
            },
        });
    };

    const handleClear = () => {
        setSelectedProductIds([]);
        setSelectedServiceIds([]);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}
        >
            <CenteredHeader
                title="Categories"
                titleColor={colors.textPrimary}
                rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
            />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.pink} />
                </View>
            ) : (
                <>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>{selectedLabel}</Text>
                        {(selectedProductIds.length > 0 || selectedServiceIds.length > 0) && (
                            <Pressable onPress={handleClear}>
                                <Text style={[styles.clearText, { color: colors.pink }]}>Clear</Text>
                            </Pressable>
                        )}
                    </View>

                    <ScrollView contentContainerStyle={styles.list}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Product Categories</Text>
                        {productCategories.length === 0 ? (
                            <Text style={[styles.sectionHint, { color: colors.textMuted }]}>No product categories available.</Text>
                        ) : (
                            productCategories.map((category) => {
                                const isSelected = selectedProductIds.includes(category.category_id);
                                return (
                                    <Pressable
                                        key={category.category_id}
                                        onPress={() => toggleProductCategory(category.category_id)}
                                        style={[
                                            styles.row,
                                            { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder },
                                        ]}
                                    >
                                        <View style={styles.rowLeft}>
                                            <MaterialCommunityIcons
                                                name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                                size={22}
                                                color={isSelected ? colors.pink : colors.textMuted}
                                            />
                                            <Text style={[styles.rowText, { color: colors.textPrimary }]}>{category.name}</Text>
                                        </View>
                                        {isSelected && (
                                            <MaterialCommunityIcons name="check" size={18} color={colors.pink} />
                                        )}
                                    </Pressable>
                                );
                            })
                        )}

                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Service Categories</Text>
                        {serviceCategories.length === 0 ? (
                            <Text style={[styles.sectionHint, { color: colors.textMuted }]}>No service categories available.</Text>
                        ) : (
                            serviceCategories.map((category) => {
                                const isSelected = selectedServiceIds.includes(category.service_category_id);
                                return (
                                    <Pressable
                                        key={category.service_category_id}
                                        onPress={() => toggleServiceCategory(category.service_category_id)}
                                        style={[
                                            styles.row,
                                            { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder },
                                        ]}
                                    >
                                        <View style={styles.rowLeft}>
                                            <MaterialCommunityIcons
                                                name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                                size={22}
                                                color={isSelected ? colors.pink : colors.textMuted}
                                            />
                                            <Text style={[styles.rowText, { color: colors.textPrimary }]}>{category.name}</Text>
                                        </View>
                                        {isSelected && (
                                            <MaterialCommunityIcons name="check" size={18} color={colors.pink} />
                                        )}
                                    </Pressable>
                                );
                            })
                        )}
                    </ScrollView>

                    <View style={[styles.footer, { backgroundColor: colors.background }]}>
                        <Pressable onPress={handleApply} style={[styles.applyButton, { backgroundColor: colors.pink }]}>
                            <Text style={styles.applyText}>Apply Filters</Text>
                        </Pressable>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    summaryText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },
    clearText: { fontFamily: Fonts.bold, fontSize: FontSizes.xs, textTransform: 'uppercase' },
    list: { paddingHorizontal: Spacing.md, paddingBottom: 120 },
    sectionTitle: { fontFamily: Fonts.extraBold, fontSize: FontSizes.md, marginTop: Spacing.md, marginBottom: Spacing.sm },
    sectionHint: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginBottom: Spacing.sm },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    rowText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.lg,
        paddingTop: Spacing.sm,
    },
    applyButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: BorderRadius.lg,
    },
    applyText: { color: '#fff', fontFamily: Fonts.bold, fontSize: FontSizes.md },
});
