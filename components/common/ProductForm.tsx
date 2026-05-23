import { MaterialCommunityIcons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/services/api/client';
import { Category, ProductFormInitialValues, ProductFormPayload } from '@/types/api.types';
import { translateCategoryName } from '@/utils/categoryTranslations';
import BackButton from './BackButton';
import FormInput from './FormInput';
import GradientButton from './GradientButton';
import Text from '@/components/common/LocalizedText';
import TextInput from '@/components/common/LocalizedTextInput';

type ImageSlot = {
    previewUri: string | null;
    base64: string | null;
    sourceUrl: string | null;
};

type MakeOption = {
    make_id: number;
    name: string;
};

type ModelOption = {
    model_id: number;
    make_id_fk: number;
    name: string;
};

type FitmentSuggestion = {
    compatible_makes: string[];
    compatible_models: string[];
    confidence: number;
    source: string;
};

type ProductFormProps = {
    screenTitle: string;
    submitLabel: string;
    initialValues?: ProductFormInitialValues;
    onSubmit: (payload: ProductFormPayload) => Promise<void>;
};

const TOTAL_STEPS = 4;

const createImageSlots = (imageUrls?: (string | null)[]): ImageSlot[] =>
    Array.from({ length: 3 }, (_, index) => {
        const imageUrl = imageUrls?.[index] ?? null;
        return {
            previewUri: imageUrl,
            base64: null,
            sourceUrl: imageUrl,
        };
    });

const uniqueStrings = (values?: string[] | null) =>
    [...new Set((values || []).map((value) => String(value || '').trim()).filter(Boolean))];

export default function ProductForm({ screenTitle, submitLabel, initialValues, onSubmit }: ProductFormProps) {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { showToast } = useToast();
    const { t, language } = useTranslation();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('0');
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [makes, setMakes] = useState<MakeOption[]>([]);
    const [makesLoading, setMakesLoading] = useState(true);
    const [modelsByMake, setModelsByMake] = useState<Record<number, ModelOption[]>>({});
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [isUniversal, setIsUniversal] = useState(true);
    const [selectedMakeNames, setSelectedMakeNames] = useState<string[]>([]);
    const [selectedModelNames, setSelectedModelNames] = useState<string[]>([]);
    const [suggestingFitment, setSuggestingFitment] = useState(false);
    const [imageSlots, setImageSlots] = useState<ImageSlot[]>(createImageSlots());
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1);

    const selectedCategoryName = useMemo(
        () => categories.find((category) => category.category_id === selectedCategoryId)?.name || '',
        [categories, selectedCategoryId]
    );

    const selectedMakes = useMemo(
        () => makes.filter((make) => selectedMakeNames.includes(make.name)),
        [makes, selectedMakeNames]
    );

    useEffect(() => {
        const initialMakes = uniqueStrings(initialValues?.compatibleMakes);
        const initialModels = uniqueStrings(initialValues?.compatibleModels);

        setName(initialValues?.name ?? '');
        setDescription(initialValues?.description ?? '');
        setPrice(initialValues?.price !== undefined && initialValues?.price !== null ? String(initialValues.price) : '');
        setStock(initialValues?.stock !== undefined && initialValues?.stock !== null ? String(initialValues.stock) : '0');
        setSelectedCategoryId(initialValues?.categoryId ?? null);
        setSelectedMakeNames(initialMakes);
        setSelectedModelNames(initialModels);
        setIsUniversal(initialValues?.isUniversal ?? (initialMakes.length === 0 && initialModels.length === 0));
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
                showToast('error', t('common.error'), t('forms.product.loadCategoriesFailed'));
            } finally {
                if (isMounted) {
                    setCategoriesLoading(false);
                }
            }
        };

        const loadMakes = async () => {
            try {
                const response = await apiFetch('/vehicles/makes');
                if (isMounted && response.data) {
                    setMakes(response.data);
                }
            } catch (error) {
                console.error('Failed to load makes', error);
                showToast('error', t('common.error'), 'Failed to load vehicle makes.');
            } finally {
                if (isMounted) {
                    setMakesLoading(false);
                }
            }
        };

        loadCategories();
        loadMakes();

        return () => {
            isMounted = false;
        };
    }, [showToast, t]);

    useEffect(() => {
        if (!selectedCategoryId && categories.length > 0) {
            setSelectedCategoryId(categories[0].category_id);
        }
    }, [categories, selectedCategoryId]);

    const fetchModelsForMake = useCallback(async (makeId: number) => {
        if (modelsByMake[makeId]) {
            return modelsByMake[makeId];
        }

        const response = await apiFetch(`/vehicles/makes/${makeId}/models`);
        const models = response.data || [];
        setModelsByMake((current) => ({
            ...current,
            [makeId]: current[makeId] || models,
        }));
        return models as ModelOption[];
    }, [modelsByMake]);

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

    const selectUniversal = () => {
        setIsUniversal(true);
        setSelectedMakeNames([]);
        setSelectedModelNames([]);
    };

    const toggleMake = async (make: MakeOption) => {
        if (isUniversal) {
            setIsUniversal(false);
        }

        const isSelected = selectedMakeNames.includes(make.name);
        if (isSelected) {
            const modelsForMake = modelsByMake[make.make_id] || [];
            const modelNamesToRemove = modelsForMake.map((model) => model.name);
            setSelectedMakeNames((current) => current.filter((nameValue) => nameValue !== make.name));
            setSelectedModelNames((current) => current.filter((modelName) => !modelNamesToRemove.includes(modelName)));
            return;
        }

        setSelectedMakeNames((current) => uniqueStrings([...current, make.name]));
        try {
            await fetchModelsForMake(make.make_id);
        } catch (error) {
            console.error('Failed to load models', error);
            showToast('error', t('common.error'), 'Failed to load vehicle models.');
        }
    };

    const toggleModel = (model: ModelOption) => {
        if (isUniversal) {
            setIsUniversal(false);
        }

        setSelectedModelNames((current) => (
            current.includes(model.name)
                ? current.filter((modelName) => modelName !== model.name)
                : uniqueStrings([...current, model.name])
        ));
    };

    const suggestFitment = async () => {
        if (!name.trim()) {
            showToast('warning', t('common.missingFields'), t('forms.product.nameRequired'));
            return;
        }

        setSuggestingFitment(true);
        try {
            const response = await apiFetch<{ success: boolean; data: FitmentSuggestion }>('/products/fitment-suggestions', {
                method: 'POST',
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim(),
                    category_id_fk: selectedCategoryId,
                    category_name: selectedCategoryName,
                }),
            });

            const suggestedMakes = uniqueStrings(response.data?.compatible_makes);
            const suggestedModels = uniqueStrings(response.data?.compatible_models);

            if (suggestedMakes.length === 0 && suggestedModels.length === 0) {
                selectUniversal();
                showToast('success', 'Fitment suggested', 'This product looks Universal. Review it before saving.');
                return;
            }

            setIsUniversal(false);
            setSelectedMakeNames(suggestedMakes);
            setSelectedModelNames(suggestedModels);
            await Promise.all(
                makes
                    .filter((make) => suggestedMakes.includes(make.name))
                    .map((make) => fetchModelsForMake(make.make_id).catch(() => []))
            );
            showToast('success', 'Fitment suggested', 'Review the selected makes and models before saving.');
        } catch (error: any) {
            showToast('error', t('common.error'), error?.message || 'Failed to suggest fitment.');
        } finally {
            setSuggestingFitment(false);
        }
    };

    const hasValidCompatibility = () =>
        isUniversal || selectedMakeNames.length > 0 || selectedModelNames.length > 0;

    const goNextStep = () => {
        if (step === 1) {
            if (!name.trim()) {
                showToast('warning', t('common.missingFields'), t('forms.product.nameRequired'));
                return;
            }

            if (!selectedCategoryId) {
                showToast('warning', t('forms.product.categoryRequiredTitle'), t('forms.product.categoryRequired'));
                return;
            }

            setStep(2);
            return;
        }

        if (step === 2) {
            if (!price.trim()) {
                showToast('warning', t('common.missingFields'), t('forms.product.priceRequired'));
                return;
            }

            setStep(3);
            return;
        }

        if (step === 3) {
            if (!hasValidCompatibility()) {
                showToast('warning', 'Compatibility required', 'Choose Universal or select at least one make or model.');
                return;
            }

            setStep(4);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim() || !price.trim() || !selectedCategoryId || !hasValidCompatibility()) {
            showToast('warning', t('common.missingFields'), t('forms.product.completeRequired'));
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
                compatible_makes: isUniversal ? [] : selectedMakeNames,
                compatible_models: isUniversal ? [] : selectedModelNames,
            });
        } catch (error: any) {
            showToast('error', t('common.error'), error?.message || t('forms.product.saveFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    const renderCompatibilityStep = () => (
        <>
            <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Compatibility</Text>
                <Pressable
                    onPress={suggestFitment}
                    disabled={suggestingFitment || makesLoading}
                    style={[styles.suggestButton, { borderColor: colors.pink, opacity: suggestingFitment || makesLoading ? 0.7 : 1 }]}
                >
                    {suggestingFitment ? (
                        <ActivityIndicator size="small" color={colors.pink} />
                    ) : (
                        <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={colors.pink} />
                    )}
                    <Text style={[styles.suggestButtonText, { color: colors.pink }]}>Suggest fitment</Text>
                </Pressable>
            </View>

            <Pressable
                onPress={selectUniversal}
                style={[
                    styles.universalCard,
                    {
                        backgroundColor: isUniversal ? colors.pink + '18' : colors.backgroundSecondary,
                        borderColor: isUniversal ? colors.pink : colors.cardBorder,
                    },
                ]}
            >
                <View style={[styles.optionIcon, { backgroundColor: isUniversal ? colors.pink : colors.cardBorder }]}>
                    <MaterialCommunityIcons name={isUniversal ? 'check' : 'car'} size={20} color={isUniversal ? '#fff' : colors.textMuted} />
                </View>
                <View style={styles.optionTextWrap}>
                    <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Universal</Text>
                    <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>Fits any vehicle when no make or model restriction applies.</Text>
                </View>
            </Pressable>

            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.md }]}>Makes</Text>
            {makesLoading ? (
                <ActivityIndicator size="small" color={colors.pink} style={styles.categoryLoader} />
            ) : (
                <View style={styles.wrapRow}>
                    {makes.map((make) => {
                        const isSelected = !isUniversal && selectedMakeNames.includes(make.name);

                        return (
                            <Pressable
                                key={make.make_id}
                                onPress={() => toggleMake(make)}
                                style={[
                                    styles.fitmentChip,
                                    {
                                        backgroundColor: isSelected ? colors.pink : colors.backgroundSecondary,
                                        borderColor: isSelected ? colors.pink : colors.cardBorder,
                                    },
                                ]}
                            >
                                <Text style={[styles.fitmentChipText, { color: isSelected ? '#fff' : colors.textPrimary }]}>
                                    {make.name}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            )}

            {!isUniversal && selectedMakes.length > 0 && (
                <View style={styles.modelSections}>
                    {selectedMakes.map((make) => {
                        const models = modelsByMake[make.make_id] || [];
                        return (
                            <View key={make.make_id} style={styles.modelSection}>
                                <Text style={[styles.modelSectionTitle, { color: colors.textSecondary }]}>{make.name} models</Text>
                                {models.length === 0 ? (
                                    <Pressable
                                        onPress={() => fetchModelsForMake(make.make_id)}
                                        style={[styles.loadModelsButton, { borderColor: colors.cardBorder, backgroundColor: colors.backgroundSecondary }]}
                                    >
                                        <Text style={[styles.loadModelsText, { color: colors.textPrimary }]}>Load models</Text>
                                    </Pressable>
                                ) : (
                                    <View style={styles.wrapRow}>
                                        {models.map((model) => {
                                            const isSelected = selectedModelNames.includes(model.name);
                                            return (
                                                <Pressable
                                                    key={model.model_id}
                                                    onPress={() => toggleModel(model)}
                                                    style={[
                                                        styles.modelChip,
                                                        {
                                                            backgroundColor: isSelected ? colors.purple : colors.backgroundSecondary,
                                                            borderColor: isSelected ? colors.purple : colors.cardBorder,
                                                        },
                                                    ]}
                                                >
                                                    <Text style={[styles.modelChipText, { color: isSelected ? '#fff' : colors.textPrimary }]}>
                                                        {model.name}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            )}
        </>
    );

    const progressWidth = `${(step / TOTAL_STEPS) * 100}%` as `${number}%`;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.bgGradientStart, colors.bgGradientEnd]}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative Orbs */}
            <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
            <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />

            <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
                <BackButton />
                <View style={styles.headerSpacer} />
                <Text style={[styles.title, { color: colors.textPrimary }]}>{screenTitle}</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.stepCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.stepLabel, { color: colors.textMuted }]}>{t('forms.product.step', { step })}</Text>
                    <View style={[styles.progressTrack, { backgroundColor: colors.cardBorder }]}>
                        <View style={[styles.progressFill, { backgroundColor: colors.pink, width: progressWidth }]} />
                    </View>
                </View>

                {step === 1 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('forms.product.basicInfo')}</Text>

                        <FormInput
                            label={t('forms.product.nameLabel')}
                            icon="format-title"
                            placeholder={t('forms.product.namePlaceholder')}
                            value={name}
                            onChangeText={setName}
                        />

                        <View style={[styles.textAreaShell, { borderColor: colors.inputBorder, backgroundColor: colors.FormBg }]}>

                            <View style={styles.textAreaHeader}>
                                <MaterialCommunityIcons name="text" size={20} color={colors.textMuted} />
                            </View>

                            <TextInput
                                style={[styles.textAreaInput, { color: colors.textPrimary }]}
                                placeholder={t('forms.product.descriptionPlaceholder')}
                                placeholderTextColor={colors.textMuted}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                textAlignVertical="top"
                            />

                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.md }]}>{t('forms.product.category')}</Text>
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
                                                    backgroundColor: isSelected ? colors.pink : colors.backgroundSecondary,
                                                    borderColor: isSelected ? colors.pink : colors.cardBorder,
                                                },
                                            ]}
                                        >
                                            <Text style={[styles.categoryText, { color: isSelected ? '#fff' : colors.textPrimary }]}>
                                                {translateCategoryName(cat.name, language)}
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
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('forms.product.pricingInventory')}</Text>
                        <View style={styles.row}>
                            <View style={styles.halfWidth}>
                                <FormInput
                                    label={t('forms.product.priceLabel')}
                                    icon="currency-usd"
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    value={price}
                                    onChangeText={setPrice}
                                />
                            </View>
                            <View style={styles.halfWidth}>
                                <FormInput
                                    label={t('forms.product.stockLabel')}
                                    icon="package-variant"
                                    placeholder="0"
                                    keyboardType="number-pad"
                                    value={stock}
                                    onChangeText={setStock}
                                />
                            </View>
                        </View>
                    </>
                )}

                {step === 3 && renderCompatibilityStep()}

                {step === 4 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('forms.product.uploadPhotos')}</Text>
                        <Text style={[styles.helperText, { color: colors.textMuted }]}>{t('forms.product.uploadHelp')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesRow}>
                            {imageSlots.map((slot, index) => {
                                const hasImage = !!slot.previewUri;

                                return (
                                    <View key={index} style={{ position: 'relative' }}>
                                        <Pressable
                                            onPress={() => pickImage(index)}
                                            style={[
                                                styles.imageSlot,
                                                { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder },
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
                                                {index === 0
                                                    ? (hasImage ? t('forms.product.primaryPhoto') : t('forms.product.mainPhoto'))
                                                    : (hasImage ? t('forms.product.photo', { index: index + 1 }) : t('forms.product.addPhoto', { index: index + 1 }))}
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
                            <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>{t('common.back')}</Text>
                        </Pressable>
                    ) : (
                        <View style={styles.secondaryButtonSpacer} />
                    )}

                    <View style={styles.primaryButtonWrapper}>
                        {step < TOTAL_STEPS ? (
                            <GradientButton title={t('common.next')} onPress={goNextStep} />
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
    orb: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.5,
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
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.md,
        marginBottom: Spacing.sm,
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
    textAreaInput: {
        minHeight: 96,
        fontFamily: Fonts.regular,
        fontSize: FontSizes.md,
        paddingBottom: Spacing.md,
    },
    suggestButton: {
        minHeight: 40,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    suggestButtonText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.xs,
    },
    universalCard: {
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionTextWrap: {
        flex: 1,
    },
    optionTitle: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
    },
    optionSubtitle: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.xs,
        lineHeight: 18,
        marginTop: 2,
    },
    wrapRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    fitmentChip: {
        minHeight: 40,
        paddingHorizontal: Spacing.md,
        paddingVertical: 9,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        justifyContent: 'center',
    },
    fitmentChipText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.sm,
    },
    modelSections: {
        gap: Spacing.md,
        marginTop: Spacing.md,
    },
    modelSection: {
        gap: Spacing.sm,
    },
    modelSectionTitle: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.sm,
    },
    modelChip: {
        minHeight: 36,
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        justifyContent: 'center',
    },
    modelChipText: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.xs,
    },
    loadModelsButton: {
        alignSelf: 'flex-start',
        minHeight: 36,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        justifyContent: 'center',
    },
    loadModelsText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.xs,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginTop: Spacing.lg,
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
