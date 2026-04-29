import { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    TextInput, ActivityIndicator,
    KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { providerService } from '@/services/api/provider.service';
import { supabase } from '@/lib/supabase';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import GradientButton from '@/components/common/GradientButton';
import BackButton from '@/components/common/BackButton';

// ─── Types ────────────────────────────────────────────────────────────────────

type ImageSlot = { previewUri: string | null; base64: string | null };
type LocationType = 'both' | 'mobile' | 'in-shop';

const LOCATION_OPTIONS: Array<{ key: LocationType; label: string; sub: string }> = [
    { key: 'both', label: 'Mobile & In-Shop', sub: 'We can come to you or at your location' },
    { key: 'mobile', label: 'Mobile Service', sub: 'We come to the customer' },
    { key: 'in-shop', label: 'In-Shop Only', sub: 'Customer visits your location' },
];

const TOTAL_STEPS = 3;

// ─── Image helpers ────────────────────────────────────────────────────────────

const uploadServiceImage = async (base64: string, slotIndex: number): Promise<string> => {
    const fileName = `service-${Date.now()}-${slotIndex}-${Math.floor(Math.random() * 1000)}.jpg`;
    const { error } = await supabase.storage
        .from('service-images')
        .upload(fileName, decode(base64), { contentType: 'image/jpeg' });
    if (error) throw error;
    const { data } = supabase.storage.from('service-images').getPublicUrl(fileName);
    return data.publicUrl;
};

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function StepBasicInfo({
    name, setName,
    description, setDescription,
    price, setPrice,
    duration, setDuration,
    categories,
    categoriesLoading,
    selectedCatId,
    setSelectedCatId,
    colors,
}: {
    name: string; setName: (v: string) => void;
    description: string; setDescription: (v: string) => void;
    price: string; setPrice: (v: string) => void;
    duration: string; setDuration: (v: string) => void;
    categories: Array<{ service_category_id: number; name: string }>;
    categoriesLoading: boolean;
    selectedCatId: number | null;
    setSelectedCatId: (id: number) => void;
    colors: any;
}) {
    return (
        <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Basic Info</Text>

            {/* Name */}
            <View style={[styles.inputShell, { borderColor: colors.inputBorder }]}>
                <MaterialCommunityIcons name="format-title" size={20} color={colors.textMuted} />
                <TextInput
                    style={[styles.inputText, { color: colors.textPrimary }]}
                    placeholder="Service Name"
                    placeholderTextColor={colors.textMuted}
                    value={name}
                    onChangeText={setName}
                />
            </View>

            {/* Description */}
            <View style={[styles.textAreaShell, { borderColor: colors.inputBorder }]}>
                <View style={styles.textAreaHeader}>
                    <MaterialCommunityIcons name="text" size={20} color={colors.textMuted} />
                </View>
                <TextInput
                    style={[styles.textAreaInput, { color: colors.textPrimary }]}
                    placeholder="Detailed service description..."
                    placeholderTextColor={colors.textMuted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    textAlignVertical="top"
                />
            </View>

            {/* Category */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.md }]}>Category</Text>
            {categoriesLoading ? (
                <ActivityIndicator size="small" color={colors.pink} style={{ marginVertical: Spacing.sm }} />
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
                    {categories.map(cat => {
                        const isSelected = selectedCatId === cat.service_category_id;
                        return (
                            <Pressable
                                key={cat.service_category_id}
                                onPress={() => setSelectedCatId(cat.service_category_id)}
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
    );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function StepPricingAvailability({
    price, setPrice,
    duration, setDuration,
    locationType, setLocationType,
    availableTimes, setAvailableTimes,
    colors,
}: {
    price: string; setPrice: (v: string) => void;
    duration: string; setDuration: (v: string) => void;
    locationType: LocationType; setLocationType: (v: LocationType) => void;
    availableTimes: string[]; setAvailableTimes: (v: string[]) => void;
    colors: any;
}) {
    const [timeInput, setTimeInput] = useState('');

    const addTime = () => {
        const t = timeInput.trim();
        if (t && !availableTimes.includes(t)) {
            setAvailableTimes([...availableTimes, t]);
        }
        setTimeInput('');
    };

    return (
        <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pricing & Duration</Text>

            <View style={styles.row}>
                <View style={styles.halfWidth}>
                    <View style={[styles.inputShell, { borderColor: colors.inputBorder }]}>
                        <MaterialCommunityIcons name="cash" size={20} color={colors.textMuted} />
                        <TextInput
                            style={[styles.inputText, { color: colors.textPrimary }]}
                            placeholder="Price (EGP)"
                            placeholderTextColor={colors.textMuted}
                            value={price}
                            onChangeText={setPrice}
                            keyboardType="numeric"
                        />
                    </View>
                </View>
                <View style={styles.halfWidth}>
                    <View style={[styles.inputShell, { borderColor: colors.inputBorder }]}>
                        <MaterialCommunityIcons name="timer-outline" size={20} color={colors.textMuted} />
                        <TextInput
                            style={[styles.inputText, { color: colors.textPrimary }]}
                            placeholder="Duration (min)"
                            placeholderTextColor={colors.textMuted}
                            value={duration}
                            onChangeText={setDuration}
                            keyboardType="numeric"
                        />
                    </View>
                </View>
            </View>

            {/* Location type */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.md }]}>Location Type</Text>
            {LOCATION_OPTIONS.map(opt => {
                const selected = locationType === opt.key;
                return (
                    <Pressable
                        key={opt.key}
                        onPress={() => setLocationType(opt.key)}
                        style={[
                            styles.radioCard,
                            {
                                backgroundColor: selected ? 'rgba(205,66,168,0.08)' : colors.card,
                                borderColor: selected ? colors.pink : colors.border,
                            },
                        ]}
                    >
                        <View style={[styles.radioCircle, { borderColor: selected ? colors.pink : colors.border }]}>
                            {selected && <View style={[styles.radioDot, { backgroundColor: colors.pink }]} />}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.radioLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                            <Text style={[styles.radioSub, { color: colors.textMuted }]}>{opt.sub}</Text>
                        </View>
                    </Pressable>
                );
            })}

            {/* Available times */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.md }]}>Available Times</Text>
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
                Add time slots customers can choose from (e.g. 09:00, 14:30).
            </Text>
            <View style={[styles.inputShell, { borderColor: colors.inputBorder }]}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={colors.textMuted} />
                <TextInput
                    style={[styles.inputText, { color: colors.textPrimary, flex: 1 }]}
                    placeholder="e.g. 09:00"
                    placeholderTextColor={colors.textMuted}
                    value={timeInput}
                    onChangeText={setTimeInput}
                    onSubmitEditing={addTime}
                    returnKeyType="done"
                />
                <Pressable onPress={addTime} hitSlop={8}>
                    <MaterialCommunityIcons name="plus-circle" size={24} color={colors.pink} />
                </Pressable>
            </View>
            {availableTimes.length > 0 && (
                <View style={styles.timePillsRow}>
                    {availableTimes.map((t, i) => (
                        <Pressable
                            key={i}
                            onPress={() => setAvailableTimes(availableTimes.filter((_, idx) => idx !== i))}
                            style={[styles.timePill, { backgroundColor: 'rgba(205,66,168,0.12)', borderColor: colors.pink }]}
                        >
                            <MaterialCommunityIcons name="clock-outline" size={12} color={colors.pink} />
                            <Text style={[styles.timePillText, { color: colors.pink }]}>{t}</Text>
                            <MaterialCommunityIcons name="close-circle" size={14} color={colors.pink} />
                        </Pressable>
                    ))}
                </View>
            )}
        </>
    );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

function StepPhotos({
    imageSlots,
    onPick,
    onRemove,
    colors,
}: {
    imageSlots: ImageSlot[];
    onPick: (index: number) => void;
    onRemove: (index: number) => void;
    colors: any;
}) {
    return (
        <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upload Photos</Text>
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
                Add up to 3 images for your service listing.
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesRow}>
                {imageSlots.map((slot, index) => {
                    const hasImage = !!slot.previewUri;
                    return (
                        <View key={index} style={{ position: 'relative' }}>
                            <Pressable
                                onPress={() => onPick(index)}
                                style={[styles.imageSlot, { backgroundColor: colors.card, borderColor: colors.border }]}
                            >
                                <View style={[styles.imagePreview, { backgroundColor: colors.backgroundSecondary }]}>
                                    {hasImage ? (
                                        <Image source={{ uri: slot.previewUri! }} style={styles.imagePreviewImg} />
                                    ) : (
                                        <MaterialCommunityIcons name="camera-plus" size={28} color={colors.textMuted} />
                                    )}
                                </View>
                                <Text style={[styles.imageLabel, { color: colors.textSecondary }]}>
                                    {index === 0
                                        ? hasImage ? 'Main ✦' : 'Main Photo'
                                        : hasImage ? `Photo ${index + 1}` : `Add ${index + 1}`}
                                </Text>
                            </Pressable>

                            {hasImage && (
                                <Pressable
                                    onPress={() => onRemove(index)}
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
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddServiceScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { showToast } = useToast();

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
    const [categories, setCategories] = useState<Array<{ service_category_id: number; name: string }>>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [locationType, setLocationType] = useState<LocationType>('both');
    const [availableTimes, setAvailableTimes] = useState<string[]>([]);
    const [imageSlots, setImageSlots] = useState<ImageSlot[]>([
        { previewUri: null, base64: null },
        { previewUri: null, base64: null },
        { previewUri: null, base64: null },
    ]);

    // Load categories
    useEffect(() => {
        let mounted = true;
        providerService.getServiceCategories()
            .then(res => {
                if (mounted && res.success && res.data) {
                    setCategories(res.data);
                    if (res.data.length > 0) setSelectedCatId(res.data[0].service_category_id);
                }
            })
            .catch(() => showToast('error', 'Error', 'Failed to load categories.'))
            .finally(() => { if (mounted) setCategoriesLoading(false); });
        return () => { mounted = false; };
    }, []);

    // Pick image from library
    const pickImage = async (slotIndex: number) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets?.length) {
            const asset = result.assets[0];
            setImageSlots(current => {
                const next = [...current];
                next[slotIndex] = { previewUri: asset.uri, base64: asset.base64 ?? null };
                return next;
            });
        }
    };

    const removeImage = (index: number) => {
        setImageSlots(current => {
            const next = [...current];
            next[index] = { previewUri: null, base64: null };
            return next;
        });
    };

    // Validation per step
    const goNext = () => {
        if (step === 1) {
            if (!name.trim()) { showToast('warning', 'Missing', 'Service name is required.'); return; }
            if (!selectedCatId) { showToast('warning', 'Missing', 'Please select a category.'); return; }
        }
        if (step === 2) {
            if (!price.trim()) { showToast('warning', 'Missing', 'Price is required.'); return; }
            if (!duration.trim()) { showToast('warning', 'Missing', 'Duration is required.'); return; }
        }
        setStep(s => s + 1);
    };

    const goBack = () => setStep(s => Math.max(1, s - 1));

    // Submit
    const handleSubmit = async () => {
        if (!name.trim() || !price.trim() || !duration.trim() || !selectedCatId) {
            showToast('warning', 'Missing Fields', 'Please complete all required fields.');
            return;
        }

        setSubmitting(true);
        try {
            // Upload images
            const uploadedUrls = await Promise.all(
                imageSlots.map(async (slot, i) => {
                    if (slot.base64) return uploadServiceImage(slot.base64, i);
                    return null;
                })
            );

            const res = await providerService.createService({
                name: name.trim(),
                description: description.trim(),
                price: parseFloat(price),
                duration: parseInt(duration, 10),
                is_active: true,
                service_cat_id_fk: selectedCatId,
                image_url: uploadedUrls[0] || null,
                image_url_2: uploadedUrls[1] || null,
                image_url_3: uploadedUrls[2] || null,
                location_type: locationType,
                available_times: availableTimes,
            });

            if (res.success) {
                showToast('success', 'Service Submitted', `"${name}" is pending admin approval.`);
                router.back();
            } else {
                showToast('error', 'Failed', (res as any).message || 'Could not add service.');
            }
        } catch (err: any) {
            showToast('error', 'Error', err?.message || 'Unexpected error.');
        } finally {
            setSubmitting(false);
        }
    };

    const progressWidth = `${(step / TOTAL_STEPS) * 100}%` as `${number}%`;

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <BackButton />

            <View style={[styles.header, { paddingTop: Spacing.lg }]}>
                <View style={styles.headerSpacer} />
                <Text style={[styles.title, { color: colors.textPrimary }]}>Add Service</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Progress */}
                <View style={[styles.stepCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.stepLabel, { color: colors.textMuted }]}>Step {step} of {TOTAL_STEPS}</Text>
                    <View style={[styles.progressTrack, { backgroundColor: colors.cardBorder }]}>
                        <View style={[styles.progressFill, { backgroundColor: colors.pink, width: progressWidth }]} />
                    </View>
                </View>

                {/* Step content */}
                {step === 1 && (
                    <StepBasicInfo
                        name={name} setName={setName}
                        description={description} setDescription={setDescription}
                        price={price} setPrice={setPrice}
                        duration={duration} setDuration={setDuration}
                        categories={categories}
                        categoriesLoading={categoriesLoading}
                        selectedCatId={selectedCatId}
                        setSelectedCatId={setSelectedCatId}
                        colors={colors}
                    />
                )}

                {step === 2 && (
                    <StepPricingAvailability
                        price={price} setPrice={setPrice}
                        duration={duration} setDuration={setDuration}
                        locationType={locationType} setLocationType={setLocationType}
                        availableTimes={availableTimes} setAvailableTimes={setAvailableTimes}
                        colors={colors}
                    />
                )}

                {step === 3 && (
                    <StepPhotos
                        imageSlots={imageSlots}
                        onPick={pickImage}
                        onRemove={removeImage}
                        colors={colors}
                    />
                )}

                {/* Bottom navigation */}
                <View style={styles.actionsRow}>
                    {step > 1 ? (
                        <Pressable
                            onPress={goBack}
                            style={[styles.secondaryButton, { borderColor: colors.cardBorder, backgroundColor: colors.backgroundSecondary }]}
                        >
                            <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Back</Text>
                        </Pressable>
                    ) : (
                        <View style={styles.secondaryButtonSpacer} />
                    )}

                    <View style={styles.primaryButtonWrapper}>
                        {step < TOTAL_STEPS ? (
                            <GradientButton title="Next" onPress={goNext} />
                        ) : (
                            <GradientButton title="Create Service" onPress={handleSubmit} loading={submitting} />
                        )}
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
    },
    headerSpacer: { width: 40, height: 40 },
    title: { fontFamily: Fonts.bold, fontSize: FontSizes.xl },
    scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: 150 },

    // Progress
    stepCard: { padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: Spacing.lg },
    stepLabel: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm, marginBottom: Spacing.sm },
    progressTrack: { height: 6, borderRadius: 999, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 999 },

    sectionTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: Spacing.sm },
    helperText: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginBottom: Spacing.md, marginTop: -Spacing.xs },

    // Input
    inputShell: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        borderWidth: 1, borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md, paddingVertical: 12,
        marginBottom: Spacing.sm,
    },
    inputText: { flex: 1, fontFamily: Fonts.regular, fontSize: FontSizes.md },
    textAreaShell: {
        borderWidth: 1, borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, minHeight: 140, marginBottom: Spacing.sm,
    },
    textAreaHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    textAreaInput: { minHeight: 96, fontFamily: Fonts.regular, fontSize: FontSizes.md, paddingBottom: Spacing.md },

    // Categories
    categoriesRow: { flexDirection: 'row', gap: Spacing.sm },
    categoryChip: {
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full, borderWidth: 1,
    },
    categoryText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },

    // Row / half
    row: { flexDirection: 'row', gap: Spacing.md },
    halfWidth: { flex: 1 },

    // Radio cards
    radioCard: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        borderRadius: BorderRadius.xl, borderWidth: 1,
        paddingHorizontal: Spacing.md, paddingVertical: 12, marginBottom: Spacing.sm,
    },
    radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    radioDot: { width: 10, height: 10, borderRadius: 5 },
    radioLabel: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md },
    radioSub: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginTop: 2 },

    // Time pills
    timePillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
    timePill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderWidth: 1, borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.sm, paddingVertical: 5,
    },
    timePillText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.xs },

    // Images
    imagesRow: { flexDirection: 'row', gap: Spacing.md },
    imageSlot: { width: 112, borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden', padding: Spacing.xs },
    imagePreview: {
        width: '100%', aspectRatio: 1, borderRadius: BorderRadius.md,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    imagePreviewImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    imageLabel: { fontFamily: Fonts.semiBold, fontSize: FontSizes.xs, textAlign: 'center', marginTop: Spacing.xs },
    imageRemoveButton: {
        position: 'absolute', top: -4, right: -4, zIndex: 10,
        backgroundColor: '#fff', borderRadius: 12, padding: 1,
    },

    // Bottom nav
    actionsRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.lg,
    },
    secondaryButton: {
        minWidth: 88, paddingVertical: 14, paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center',
    },
    secondaryButtonText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md },
    secondaryButtonSpacer: { minWidth: 88 },
    primaryButtonWrapper: { flex: 1 },
});
