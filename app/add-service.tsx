import { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable, TextInput,
    KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { providerService } from '@/services/api/provider.service';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

const TOTAL_STEPS = 3;

function ProgressBar({ step, colors }: { step: number; colors: any }) {
    const pct = ((step) / TOTAL_STEPS) * 100;
    return (
        <View style={[progStyles.track, { backgroundColor: colors.border }]}>
            <LinearGradient
                colors={['#CD42A8', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[progStyles.fill, { width: `${pct}%` }]}
            />
        </View>
    );
}

const progStyles = StyleSheet.create({
    track: { height: 6, borderRadius: 3, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 3 },
});

function StepOne({
    form, setForm, categories, colors,
}: {
    form: any; setForm: any;
    categories: Array<{ service_category_id: number; name: string }>;
    colors: any;
}) {
    const [showCat, setShowCat] = useState(false);
    return (
        <>
            <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Basic Info:</Text>

            <Text style={[styles.label, { color: colors.textPrimary }]}>Service name:</Text>
            <TextInput
                value={form.name}
                onChangeText={v => setForm((p: any) => ({ ...p, name: v }))}
                placeholder="Your Service Name"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.card, borderColor: colors.border }]}
            />

            <Text style={[styles.label, { color: colors.textPrimary }]}>Category:</Text>
            <Pressable
                onPress={() => setShowCat(!showCat)}
                style={[styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
                <Text style={{ color: form.category_label ? colors.textPrimary : colors.textMuted, fontFamily: Fonts.regular, fontSize: FontSizes.md }}>
                    {form.category_label || 'Select Category'}
                </Text>
                <MaterialCommunityIcons name={showCat ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
            </Pressable>
            {showCat && (
                <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {categories.map(c => (
                        <Pressable
                            key={c.service_category_id}
                            onPress={() => {
                                setForm((p: any) => ({ ...p, service_cat_id_fk: c.service_category_id, category_label: c.name }));
                                setShowCat(false);
                            }}
                            style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                        >
                            <Text style={[styles.dropdownItemText, { color: colors.textPrimary }]}>{c.name}</Text>
                        </Pressable>
                    ))}
                </View>
            )}

            <Text style={[styles.label, { color: colors.textPrimary }]}>Description:</Text>
            <TextInput
                value={form.description}
                onChangeText={v => setForm((p: any) => ({ ...p, description: v }))}
                placeholder="Detailed Service description..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                style={[styles.textarea, { color: colors.textPrimary, backgroundColor: colors.card, borderColor: colors.border }]}
            />

            <Text style={[styles.label, { color: colors.textPrimary }]}>What's included:</Text>
            <TextInput
                value={form.whats_included}
                onChangeText={v => setForm((p: any) => ({ ...p, whats_included: v }))}
                placeholder="• feature 1&#10;• feature 2..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                style={[styles.textarea, { color: colors.textPrimary, backgroundColor: colors.card, borderColor: colors.border }]}
            />

            <View style={styles.rowFields}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Duration:</Text>
                    <TextInput
                        value={String(form.duration || '')}
                        onChangeText={v => setForm((p: any) => ({ ...p, duration: Number(v) || 0 }))}
                        placeholder="mins"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.card, borderColor: colors.border }]}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Price:</Text>
                    <TextInput
                        value={String(form.price || '')}
                        onChangeText={v => setForm((p: any) => ({ ...p, price: Number(v) || 0 }))}
                        placeholder="Price"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.card, borderColor: colors.border }]}
                    />
                </View>
            </View>
        </>
    );
}

function StepTwo({ form, setForm, colors }: { form: any; setForm: any; colors: any }) {
    const locationOptions = [
        { key: 'both', label: 'Both' },
        { key: 'mobile', label: 'Mobile (We come to you)' },
        { key: 'in-shop', label: 'In-Shop' },
    ];
    const [timeInput, setTimeInput] = useState('');
    return (
        <>
            <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Location & Availability:</Text>

            <Text style={[styles.label, { color: colors.textPrimary }]}>Location Type:</Text>
            {locationOptions.map(opt => (
                <Pressable
                    key={opt.key}
                    onPress={() => setForm((p: any) => ({ ...p, location_type: opt.key }))}
                    style={[
                        styles.radioRow,
                        { borderColor: form.location_type === opt.key ? colors.pink : colors.border }
                    ]}
                >
                    <View style={[
                        styles.radioCircle,
                        { borderColor: form.location_type === opt.key ? colors.pink : colors.border }
                    ]}>
                        {form.location_type === opt.key && (
                            <View style={[styles.radioDot, { backgroundColor: colors.pink }]} />
                        )}
                    </View>
                    <Text style={[styles.radioLabel, { color: colors.textPrimary }]}>{opt.label}</Text>
                </Pressable>
            ))}

            <Text style={[styles.label, { color: colors.textPrimary }]}>Available Times:</Text>
            <View style={[styles.timeInputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                    value={timeInput}
                    onChangeText={setTimeInput}
                    placeholder="e.g. 09:00, 14:00"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.timeInput, { color: colors.textPrimary }]}
                />
                <Pressable
                    onPress={() => {
                        if (timeInput.trim()) {
                            setForm((p: any) => ({ ...p, available_times: [...(p.available_times || []), timeInput.trim()] }));
                            setTimeInput('');
                        }
                    }}
                >
                    <MaterialCommunityIcons name="plus-circle" size={24} color={colors.pink} />
                </Pressable>
            </View>
            <View style={styles.timePills}>
                {(form.available_times || []).map((t: string, i: number) => (
                    <Pressable
                        key={i}
                        onPress={() => setForm((p: any) => ({
                            ...p, available_times: p.available_times.filter((_: any, idx: number) => idx !== i)
                        }))}
                        style={[styles.timePill, { backgroundColor: colors.pinkGlow, borderColor: colors.pink }]}
                    >
                        <Text style={[styles.timePillText, { color: colors.pink }]}>{t}</Text>
                        <MaterialCommunityIcons name="close-circle" size={14} color={colors.pink} />
                    </Pressable>
                ))}
            </View>
        </>
    );
}

function StepThree({ form, setForm, colors }: { form: any; setForm: any; colors: any }) {
    return (
        <>
            <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Photos (optional):</Text>
            {['image_url', 'image_url_2', 'image_url_3'].map((field, i) => (
                <View key={field}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Photo {i + 1} URL:</Text>
                    <TextInput
                        value={form[field] || ''}
                        onChangeText={v => setForm((p: any) => ({ ...p, [field]: v }))}
                        placeholder={`https://... (Photo ${i + 1})`}
                        placeholderTextColor={colors.textMuted}
                        style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.card, borderColor: colors.border }]}
                        autoCapitalize="none"
                        keyboardType="url"
                    />
                </View>
            ))}

            <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Review:</Text>
            <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ReviewRow label="Name" value={form.name} colors={colors} />
                <ReviewRow label="Category" value={form.category_label} colors={colors} />
                <ReviewRow label="Duration" value={`${form.duration} min`} colors={colors} />
                <ReviewRow label="Price" value={`${form.price} EGP`} colors={colors} />
                <ReviewRow label="Location" value={form.location_type} colors={colors} />
            </View>
        </>
    );
}

function ReviewRow({ label, value, colors }: { label: string; value: string; colors: any }) {
    return (
        <View style={styles.reviewRow}>
            <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>{label}</Text>
            <Text style={[styles.reviewValue, { color: colors.textPrimary }]}>{value || '—'}</Text>
        </View>
    );
}

export default function AddServiceScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { showToast } = useToast();

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<Array<{ service_category_id: number; name: string }>>([]);
    const [form, setForm] = useState({
        name: '',
        description: '',
        whats_included: '',
        price: 0,
        duration: 0,
        service_cat_id_fk: 0,
        category_label: '',
        is_active: true,
        image_url: '',
        image_url_2: '',
        image_url_3: '',
        location_type: 'both' as 'both' | 'mobile' | 'in-shop',
        available_times: [] as string[],
    });

    // Load categories once
    useState(() => {
        providerService.getServiceCategories()
            .then(res => { if (res.success && res.data) setCategories(res.data); })
            .catch(() => {});
    });

    const validate = () => {
        if (step === 1) {
            if (!form.name.trim()) { showToast('warning', 'Missing', 'Please enter a service name.'); return false; }
            if (!form.price) { showToast('warning', 'Missing', 'Please enter a price.'); return false; }
            if (!form.duration) { showToast('warning', 'Missing', 'Please enter a duration.'); return false; }
        }
        return true;
    };

    const handleNext = () => {
        if (!validate()) return;
        setStep(s => s + 1);
    };

    const handleBack = () => setStep(s => s - 1);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const res = await providerService.createService({
                name: form.name,
                description: form.description,
                price: form.price,
                duration: form.duration,
                service_cat_id_fk: form.service_cat_id_fk,
                is_active: form.is_active,
                image_url: form.image_url || null,
                image_url_2: form.image_url_2 || null,
                image_url_3: form.image_url_3 || null,
                location_type: form.location_type,
                available_times: form.available_times,
            });
            if (res.success) {
                showToast('success', 'Service Added', `"${form.name}" is now live!`);
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

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <Pressable onPress={step > 1 ? handleBack : () => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Add Service</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Text style={[styles.stepLabel, { color: colors.textPrimary }]}>Step {step} of {TOTAL_STEPS}</Text>
                <ProgressBar step={step} colors={colors} />

                <View style={{ height: Spacing.lg }} />

                {step === 1 && <StepOne form={form} setForm={setForm} categories={categories} colors={colors} />}
                {step === 2 && <StepTwo form={form} setForm={setForm} colors={colors} />}
                {step === 3 && <StepThree form={form} setForm={setForm} colors={colors} />}
            </ScrollView>

            {/* Bottom action */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <LinearGradient
                    colors={['#CD42A8', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.nextBtn}
                >
                    <Pressable
                        style={styles.nextBtnInner}
                        onPress={step < TOTAL_STEPS ? handleNext : handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.nextBtnText}>{step < TOTAL_STEPS ? 'Next' : 'Submit Service'}</Text>
                        )}
                    </Pressable>
                </LinearGradient>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
    },
    headerTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.lg },
    scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: 120 },
    stepLabel: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, marginBottom: Spacing.sm },
    sectionLabel: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, marginBottom: Spacing.md },
    label: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginBottom: 6, marginTop: Spacing.sm },
    input: {
        borderRadius: BorderRadius.lg, borderWidth: 1,
        paddingHorizontal: Spacing.md, paddingVertical: 12,
        fontFamily: Fonts.regular, fontSize: FontSizes.md, marginBottom: 4,
    },
    textarea: {
        borderRadius: BorderRadius.lg, borderWidth: 1,
        paddingHorizontal: Spacing.md, paddingVertical: 12,
        fontFamily: Fonts.regular, fontSize: FontSizes.md,
        minHeight: 90, textAlignVertical: 'top', marginBottom: 4,
    },
    picker: {
        borderRadius: BorderRadius.lg, borderWidth: 1,
        paddingHorizontal: Spacing.md, paddingVertical: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    dropdown: {
        borderRadius: BorderRadius.lg, borderWidth: 1,
        overflow: 'hidden', marginTop: 4, marginBottom: 4,
    },
    dropdownItem: { paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 1 },
    dropdownItemText: { fontFamily: Fonts.medium, fontSize: FontSizes.md },
    rowFields: { flexDirection: 'row', gap: Spacing.md },
    radioRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        borderRadius: BorderRadius.lg, borderWidth: 1,
        paddingHorizontal: Spacing.md, paddingVertical: 12, marginBottom: Spacing.sm,
    },
    radioCircle: {
        width: 20, height: 20, borderRadius: 10, borderWidth: 2,
        alignItems: 'center', justifyContent: 'center',
    },
    radioDot: { width: 10, height: 10, borderRadius: 5 },
    radioLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.md },
    timeInputRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderRadius: BorderRadius.lg, borderWidth: 1,
        paddingHorizontal: Spacing.md, paddingVertical: 10, marginBottom: Spacing.sm,
    },
    timeInput: { flex: 1, fontFamily: Fonts.regular, fontSize: FontSizes.md },
    timePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
    timePill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderRadius: BorderRadius.full, borderWidth: 1,
        paddingHorizontal: Spacing.sm, paddingVertical: 5,
    },
    timePillText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },
    reviewCard: { borderRadius: BorderRadius.xl, borderWidth: 1, overflow: 'hidden', marginBottom: Spacing.md },
    reviewRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingVertical: 12,
    },
    reviewLabel: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
    reviewValue: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
    footer: { paddingHorizontal: Spacing.md, paddingTop: 8 },
    nextBtn: { borderRadius: BorderRadius.full },
    nextBtnInner: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
    nextBtnText: { fontFamily: Fonts.bold, fontSize: FontSizes.md, color: '#fff' },
});
