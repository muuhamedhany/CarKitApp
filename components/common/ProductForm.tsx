import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Category, ProductFormInitialValues, ProductFormPayload } from '@/types/api.types';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { apiFetch } from '@/services/api/client';
import { supabase } from '@/lib/supabase';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import FormInput from './FormInput';
import GradientButton from './GradientButton';
import BackButton from './BackButton';

type ImageSlot = {
    previewUri: string | null;
    base64: string | null;
    sourceUrl: string | null;
};

type ProductFormProps = {
    screenTitle: string;
    submitLabel: string;
    initialValues?: ProductFormInitialValues;
    onSubmit: (payload: ProductFormPayload) => Promise<void>;
};

const createImageSlots = (imageUrls?: (string | null)[]): ImageSlot[] =>
    Array.from({ length: 3 }, (_, index) => {
        const imageUrl = imageUrls?.[index] ?? null;
        return {
            previewUri: imageUrl,
            base64: null,
            sourceUrl: imageUrl,
        };
    });

export default function ProductForm({ screenTitle, submitLabel, initialValues, onSubmit }: ProductFormProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { showToast } = useToast();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('0');
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [imageSlots, setImageSlots] = useState<ImageSlot[]>(createImageSlots());
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1);

    useEffect(() => {
        setName(initialValues?.name ?? '');
        setDescription(initialValues?.description ?? '');
        setPrice(initialValues?.price !== undefined && initialValues?.price !== null ? String(initialValues.price) : '');
        setStock(initialValues?.stock !== undefined && initialValues?.stock !== null ? String(initialValues.stock) : '0');
        setSelectedCategoryId(initialValues?.categoryId ?? null);
        setImageSlots(createImageSlots(initialValues?.imageUrls));
    }, [initialValues]);

    useEffect(() => {
        let isMounted = true;

        const loadCategories = async () => {
            try {
                const response = await apiFetch('/categories');
                if (isMounted && response.data) {
                    setCategories(response.data);
                }
            } catch (error) {
                console.error('Failed to load categories', error);
                showToast('error', 'Error', 'Failed to load categories.');
            } finally {
                if (isMounted) {
                    setCategoriesLoading(false);
                }
            }
        };

        loadCategories();

        return () => {
            isMounted = false;
        };
    }, [showToast]);

    useEffect(() => {
        if (!selectedCategoryId && categories.length > 0) {
            setSelectedCategoryId(categories[0].category_id);
        }
    }, [categories, selectedCategoryId]);

    const uploadImage = async (base64File: string, slotIndex: number) => {
        const fileName = `product-${Date.now()}-${slotIndex}-${Math.floor(Math.random() * 1000)}.jpg`;
        const { error } = await supabase.storage
            .from('product-images')
            .upload(fileName, decode(base64File), { contentType: 'image/jpeg' });

        if (error) {
            throw error;
        }

        const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
        return data.publicUrl;
    };

    const pickImage = async (slotIndex: number) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets?.length) {
            const asset = result.assets[0];
            setImageSlots((current) => {
                const next = [...current];
                next[slotIndex] = {
                    previewUri: asset.uri,
                    base64: asset.base64 ?? null,
                    sourceUrl: current[slotIndex]?.sourceUrl ?? null,
                };
                return next;
            });
        }
    };

    const goNextStep = () => {
        if (step === 1) {
            if (!name.trim()) {
                showToast('warning', 'Missing Fields', 'Product name is required.');
                return;
            }

            if (!selectedCategoryId) {
                showToast('warning', 'Category Required', 'Please select a category.');
                return;
            }

            setStep(2);
            return;
        }

        if (step === 2) {
            if (!price.trim()) {
                showToast('warning', 'Missing Fields', 'Price is required.');
                return;
            }

            setStep(3);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim() || !price.trim() || !selectedCategoryId) {
            showToast('warning', 'Missing Fields', 'Please complete the required fields before saving.');
            return;
        }

        setSubmitting(true);

        try {
            const uploadedUrls = await Promise.all(
                imageSlots.map(async (slot, slotIndex) => {
                    if (slot.base64) {
                        return uploadImage(slot.base64, slotIndex);
                    }

                    return slot.sourceUrl;
                })
            );

            await onSubmit({
                name: name.trim(),
                description: description.trim(),
                price: parseFloat(price),
                stock: parseInt(stock, 10) || 0,
                category_id_fk: selectedCategoryId,
                image_url: uploadedUrls[0] || null,
                image_url_2: uploadedUrls[1] || null,
                image_url_3: uploadedUrls[2] || null,
            });
        } catch (error: any) {
            showToast('error', 'Error', error?.message || 'Failed to save product.');
        } finally {
            setSubmitting(false);
        }
    };

    const progressWidth = `${(step / 3) * 100}%` as `${number}%`;

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <BackButton />
            <View style={[styles.header, { paddingTop: Spacing.lg }]}>
                <View style={styles.headerSpacer} />
                <Text style={[styles.title, { color: colors.textPrimary }]}>{screenTitle}</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.stepCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.stepLabel, { color: colors.textMuted }]}>Step {step} of 3</Text>
                    <View style={[styles.progressTrack, { backgroundColor: colors.cardBorder }]}>
                        <View style={[styles.progressFill, { backgroundColor: colors.pink, width: progressWidth }]} />
                    </View>
                </View>

                {step === 1 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Basic Info</Text>

                        <FormInput
                            icon="format-title"
                            placeholder="Product Name"
                            value={name}
                            onChangeText={setName}
                        />

                        <View style={[styles.textAreaShell, { borderColor: colors.inputBorder }]}>

                            <View style={styles.textAreaHeader}>
                                <MaterialCommunityIcons name="text" size={20} color={colors.textMuted} />
                            </View>

                            <TextInput
                                style={[styles.textAreaInput, { color: colors.textPrimary }]}
                                placeholder="Detailed product description..."
                                placeholderTextColor={colors.textMuted}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                textAlignVertical="top"
                            />

                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.md }]}>Category</Text>
                        {categoriesLoading ? (
                            <ActivityIndicator size="small" color={colors.pink} style={styles.categoryLoader} />
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
                                {categories.map((cat) => {
                                    const isSelected = selectedCategoryId === cat.category_id;

                                    return (
                                        <Pressable
                                            key={cat.category_id}
                                            onPress={() => setSelectedCategoryId(cat.category_id)}
                                            style={[
                                                styles.categoryChip,
                                                {
                                                    backgroundColor: isSelected ? colors.pink : colors.card,
                                                    borderColor: isSelected ? colors.pink : colors.border,
                                                },
                                            ]}
                                        >
                                            <Text style={[styles.categoryText, { color: isSelected ? '#fff' : colors.textPrimary }]}>
                                                {cat.name}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </>
                )}

                {step === 2 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pricing & Inventory</Text>
                        <View style={styles.row}>
                            <View style={styles.halfWidth}>
                                <FormInput
                                    icon="currency-usd"
                                    placeholder="Price"
                                    keyboardType="numeric"
                                    value={price}
                                    onChangeText={setPrice}
                                />
                            </View>
                            <View style={styles.halfWidth}>
                                <FormInput
                                    icon="package-variant"
                                    placeholder="Stock"
                                    keyboardType="number-pad"
                                    value={stock}
                                    onChangeText={setStock}
                                />
                            </View>
                        </View>
                    </>
                )}

                {step === 3 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upload Photos</Text>
                        <Text style={[styles.helperText, { color: colors.textMuted }]}>Add up to three images for the product listing.</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesRow}>
                            {imageSlots.map((slot, index) => {
                                const hasImage = !!slot.previewUri;

                                return (
                                    <View key={index} style={{ position: 'relative' }}>
                                        <Pressable
                                            onPress={() => pickImage(index)}
                                            style={[
                                                styles.imageSlot,
                                                { backgroundColor: colors.card, borderColor: colors.border },
                                            ]}
                                        >
                                            <View style={[styles.imagePreview, { backgroundColor: colors.backgroundSecondary }]}>
                                                {hasImage ? (
                                                    <Image source={{ uri: slot.previewUri! }} style={styles.image} />
                                                ) : (
                                                    <MaterialCommunityIcons name="camera-plus" size={28} color={colors.textMuted} />
                                                )}
                                            </View>
                                            <Text style={[styles.imageLabel, { color: colors.textSecondary }]}>
                                                {index === 0 ? (hasImage ? 'Primary ✦' : 'Main Photo') : (hasImage ? `Photo ${index + 1}` : `Add ${index + 1}`)}
                                            </Text>
                                        </Pressable>

                                        {hasImage && (
                                            <Pressable
                                                onPress={() => {
                                                    setImageSlots((current) => {
                                                        const next = [...current];
                                                        next[index] = { previewUri: null, base64: null, sourceUrl: null };
                                                        return next;
                                                    });
                                                }}
                                                style={styles.imageRemoveButton}
                                            >
                                                <MaterialCommunityIcons name="close-circle" size={22} color="#EF4444" />
                                            </Pressable>
                                        )}
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </>
                )}

                <View style={styles.actionsRow}>
                    {step > 1 ? (
                        <Pressable
                            onPress={() => setStep((current) => Math.max(1, current - 1))}
                            style={[styles.secondaryButton, { borderColor: colors.cardBorder, backgroundColor: colors.backgroundSecondary }]}
                        >
                            <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Back</Text>
                        </Pressable>
                    ) : (
                        <View style={styles.secondaryButtonSpacer} />
                    )}

                    <View style={styles.primaryButtonWrapper}>
                        {step < 3 ? (
                            <GradientButton title="Next" onPress={goNextStep} />
                        ) : (
                            <GradientButton title={submitLabel} onPress={handleSubmit} loading={submitting} />
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    headerSpacer: {
        width: 40,
        height: 40,
    },
    title: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.xl,
    },
    scrollContent: {
        paddingHorizontal: Spacing.md,
        paddingBottom: 150,
    },
    sectionTitle: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
        marginBottom: Spacing.sm,
    },
    stepCard: {
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.lg,
    },
    stepLabel: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.sm,
        marginBottom: Spacing.sm,
    },
    progressTrack: {
        height: 6,
        borderRadius: 999,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 999,
    },
    helperText: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.sm,
        marginBottom: Spacing.md,
        marginTop: -Spacing.xs,
    },
    imagesRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    imageSlot: {
        width: 112,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        overflow: 'hidden',
        padding: Spacing.xs,
    },
    imagePreview: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageLabel: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.xs,
        textAlign: 'center',
        marginTop: Spacing.xs,
    },
    imageRemoveButton: {
        position: 'absolute',
        top: -4,
        right: -4,
        zIndex: 10,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 1,
    },
    row: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    halfWidth: {
        flex: 1,
    },
    categoryLoader: {
        marginVertical: Spacing.sm,
    },
    categoriesRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    categoryChip: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    categoryText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.sm,
    },
    textAreaShell: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        minHeight: 140,
    },
    textAreaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    textAreaTitle: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.sm,
    },
    textAreaInput: {
        minHeight: 96,
        fontFamily: Fonts.regular,
        fontSize: FontSizes.md,
        paddingBottom: Spacing.md,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginTop: Spacing.lg
    },
    secondaryButton: {
        minWidth: 88,
        paddingVertical: 14,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.md,
    },
    secondaryButtonSpacer: {
        minWidth: 88,
    },
    primaryButtonWrapper: {
        flex: 1,
    },
});