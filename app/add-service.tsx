import {
  MaterialCommunityIcons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect,
  useState } from 'react';
import { ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackButton from '@/components/common/BackButton';
import FormInput from '@/components/common/FormInput';
import GradientButton from '@/components/common/GradientButton';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { providerService } from '@/services/api/provider.service';
import { translateCategoryName } from '@/utils/categoryTranslations';
import Text from '@/components/common/LocalizedText';
import TextInput from '@/components/common/LocalizedTextInput';

type ServiceCategoryOption = { service_category_id: number; name: string };

type ImageSlot = {
    previewUri: string | null;
    base64: string | null;
};

const PRESET_TIME_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

const LOCATION_OPTIONS: { key: 'both' | 'mobile' | 'in-shop'; label: string }[] = [
    { key: 'both', label: 'Both' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'in-shop', label: 'In-Shop' },
];

const createImageSlots = (): ImageSlot[] =>
    Array.from({ length: 3 }, () => ({ previewUri: null, base64: null }));

const uploadServiceImage = async (base64: string, slotIndex: number): Promise<string> => {
    const fileName = `service-${Date.now()}-${slotIndex}-${Math.floor(Math.random() * 1000)}.jpg`;
    const { error } = await supabase.storage
        .from('service-images')
        .upload(fileName, decode(base64), { contentType: 'image/jpeg' });
    if (error) throw error;
    const { data } = supabase.storage.from('service-images').getPublicUrl(fileName);
    return data.publicUrl;
};

export default function AddServiceScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { showToast } = useToast();
    const { language } = useTranslation();

    const { width } = useWindowDimensions();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [categories, setCategories] = useState<ServiceCategoryOption[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [imageSlots, setImageSlots] = useState<ImageSlot[]>(createImageSlots());
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1);
    const [availableTimes, setAvailableTimes] = useState<string[]>([]);
    const [locationType, setLocationType] = useState<'both' | 'mobile' | 'in-shop'>('both');

    const toggleTimeSlot = (time: string) => {
        setAvailableTimes((prev) =>
            prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time].sort()
        );
    };

    useEffect(() => {
        let mounted = true;
        const loadCategories = async () => {
            try {
                setCategoriesLoading(true);
                const res = await providerService.getServiceCategories();
                if (!mounted) return;
                if (res.success && Array.isArray(res.data)) {
                    setCategories(res.data);
                } else {
                    showToast('error', 'Categories Error', res.message || 'Could not load service categories.');
                }
            } catch {
                if (mounted) showToast('error', 'Categories Error', 'Could not load service categories.');
            } finally {
                if (mounted) setCategoriesLoading(false);
            }
        };

        loadCategories();
        return () => { mounted = false; };
    }, [showToast]);

    useEffect(() => {
        if (!selectedCategoryId && categories.length > 0) {
            setSelectedCategoryId(categories[0].service_category_id);
        }
    }, [categories, selectedCategoryId]);

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
                };
                return next;
            });
        }
    };

    const validateInfoStep = () => {
        if (name.trim().length < 3) {
            showToast('warning', 'Service Name Required', 'Enter a service name with at least 3 characters.');
            return false;
        }

        if (description.trim().length < 10) {
            showToast('warning', 'Description Required', 'Describe the service in at least 10 characters.');
            return false;
        }

        if (!selectedCategoryId) {
            showToast('warning', 'Category Required', 'Please select a category.');
            return false;
        }

        const parsedPrice = Number(price);
        const parsedDuration = Number(duration);

        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            showToast('warning', 'Invalid Price', 'Enter a service price greater than 0.');
            return false;
        }

        if (!Number.isInteger(parsedDuration) || parsedDuration < 5 || parsedDuration > 1440) {
            showToast('warning', 'Invalid Duration', 'Enter a duration between 5 and 1440 minutes.');
            return false;
        }

        return true;
    };

    const validateDetailsStep = () => {
        if (availableTimes.length === 0) {
            showToast('warning', 'Time Slot Required', 'Please select at least one available time slot.');
            return false;
        }

        return true;
    };

    const goNextStep = () => {
        if (step === 1) {
            if (!validateInfoStep()) return;
            setStep(2);
            return;
        }

        if (step === 2) {
            if (!validateDetailsStep()) return;
            setStep(3);
        }
    };

    const handleSubmit = async () => {
        if (!validateInfoStep() || !validateDetailsStep()) return;

        setSubmitting(true);
        try {
            const uploadedUrls = await Promise.all(
                imageSlots.map((slot, index) => (slot.base64 ? uploadServiceImage(slot.base64, index) : null))
            );

            const res = await providerService.createService({
                name: name.trim(),
                description: description.trim(),
                price: Number(price),
                duration: Number(duration),
                service_cat_id_fk: selectedCategoryId as number,
                image_url: uploadedUrls[0] || null,
                image_url_2: uploadedUrls[1] || null,
                image_url_3: uploadedUrls[2] || null,
                is_active: true,
                location_type: locationType,
                available_times: availableTimes,
            });

            if (res.success) {
                showToast('success', 'Service Submitted', 'Pending admin approval.');
                router.back();
            } else {
                showToast('error', 'Failed', res.message || 'Could not submit service.');
            }
        } catch {
            showToast('error', 'Error', 'Failed to submit.');
        } finally {
            setSubmitting(false);
        }
    };

    const progressWidth = `${(step / 3) * 100}%` as `${number}%`;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.bgGradientStart, colors.bgGradientEnd]}
                style={StyleSheet.absoluteFill}
            />

            <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
            <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />

            <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
                <BackButton />
                <View style={styles.headerSpacer} />
                <Text style={[styles.title, { color: colors.textPrimary }]}>Add Service</Text>
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
                            label="Service Name"
                            icon="wrench"
                            placeholder="e.g. Oil change"
                            value={name}
                            onChangeText={setName}
                        />

                        <View style={[styles.textAreaShell, { borderColor: colors.inputBorder, backgroundColor: colors.FormBg }]}>
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

                        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.md }]}>Category</Text>
                        {categoriesLoading ? (
                            <ActivityIndicator size="small" color={colors.pink} style={styles.categoryLoader} />
                        ) : categories.length === 0 ? (
                            <Text style={[styles.helperText, { color: colors.textMuted }]}>No service categories available.</Text>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
                                {categories.map((cat) => {
                                    const isSelected = selectedCategoryId === cat.service_category_id;

                                    return (
                                        <Pressable
                                            key={cat.service_category_id}
                                            onPress={() => setSelectedCategoryId(cat.service_category_id)}
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

                        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.md }]}>Pricing & Timing</Text>
                        <View style={styles.row}>
                            <View style={styles.halfWidth}>
                                <FormInput
                                    label="Price"
                                    icon="currency-usd"
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    value={price}
                                    onChangeText={(value) => setPrice(value.replace(',', '.'))}
                                />
                            </View>
                            <View style={styles.halfWidth}>
                                <FormInput
                                    label="Duration"
                                    icon="clock-outline"
                                    placeholder="30"
                                    keyboardType="number-pad"
                                    value={duration}
                                    onChangeText={(value) => setDuration(value.replace(/\D/g, ''))}
                                />
                            </View>
                        </View>
                        <Text style={[styles.helperText, { color: colors.textMuted }]}>Duration is entered in minutes.</Text>

                    </>
                )}

                {step === 2 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Time Slots:</Text>
                        <View style={styles.gridContainer}>
                            {PRESET_TIME_SLOTS.map((time) => {
                                const isSelected = availableTimes.includes(time);
                                const slotWidth = (width - Spacing.md * 2 - 24) / 3;
                                return (
                                    <Pressable
                                        key={time}
                                        onPress={() => toggleTimeSlot(time)}
                                        style={[
                                            styles.slotChip,
                                            {
                                                width: slotWidth,
                                                backgroundColor: isSelected ? colors.pink + '20' : colors.backgroundSecondary,
                                                borderColor: isSelected ? colors.pink : colors.cardBorder,
                                            },
                                        ]}
                                    >
                                        <Text style={[styles.slotText, { color: isSelected ? colors.textPrimary : colors.textMuted }]}>
                                            {time}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.md }]}>Location:</Text>
                        <View style={styles.locationRow}>
                            {LOCATION_OPTIONS.map((opt) => {
                                const isSelected = locationType === opt.key;
                                return (
                                    <Pressable
                                        key={opt.key}
                                        onPress={() => setLocationType(opt.key)}
                                        style={[
                                            styles.locationButton,
                                            {
                                                backgroundColor: isSelected ? colors.pink + '20' : colors.backgroundSecondary,
                                                borderColor: isSelected ? colors.pink : colors.cardBorder,
                                            },
                                        ]}
                                    >
                                        <Text style={[styles.locationButtonText, { color: isSelected ? colors.textPrimary : colors.textMuted }]}>
                                            {opt.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </>
                )}

                {step === 3 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upload Photos</Text>
                        <Text style={[styles.helperText, { color: colors.textMuted }]}>Add up to three images for the service listing.</Text>
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
                                                {index === 0 ? (hasImage ? 'Primary' : 'Main Photo') : (hasImage ? `Photo ${index + 1}` : `Add ${index + 1}`)}
                                            </Text>
                                        </Pressable>

                                        {hasImage && (
                                            <Pressable
                                                onPress={() => {
                                                    setImageSlots((current) => {
                                                        const next = [...current];
                                                        next[index] = { previewUri: null, base64: null };
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
                            <GradientButton title="Create Service" onPress={handleSubmit} loading={submitting} />
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
    row: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    halfWidth: {
        flex: 1,
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
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: Spacing.lg,
    },
    slotChip: {
        height: 48,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    slotText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.md,
    },
    locationRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: Spacing.lg,
    },
    locationButton: {
        flex: 1,
        height: 50,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationButtonText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.md,
    },
});
