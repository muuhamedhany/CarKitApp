import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    ActivityIndicator, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { BorderRadius, FontSizes, Fonts, Spacing, Shadows } from '@/constants/theme';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { providerService } from '@/services/api/provider.service';
import { supabase } from '@/lib/supabase';
import GradientButton from '@/components/common/GradientButton';
import BackButton from '@/components/common/BackButton';
import { GlassView, FormInput } from '@/components';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ['Info', 'Details', 'Media'];

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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddServiceScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { showToast } = useToast();
    const isDark = colors.background === '#000000' || colors.background === '#121212';

    const [currentStep, setCurrentStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', price: '', duration: '', category: '', is_emergency: false });
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<string | null>(null);
    const [CATEGORIES, setCategories] = useState<string[]>([]);

    useEffect(() => {
        providerService.getServiceCategories().then(res => {
            if (res.success && res.data) setCategories(res.data.map((c: any) => c.name));
        });
    }, []);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7, base64: true,
        });
        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setImageFile(result.assets[0].base64 || null);
        }
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) setCurrentStep(s => s + 1);
        else handleSubmit();
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const imageUrl = imageFile ? await uploadServiceImage(imageFile, 0) : null;
            const res = await providerService.createService({
                name: form.name,
                description: form.description,
                price: parseFloat(form.price),
                duration: parseInt(form.duration),
                image_url: imageUrl, service_cat_id_fk: 1, is_active: true, is_emergency: form.is_emergency, image_url_2: null, image_url_3: null, provider_id_fk: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            } as any);
            if (res.success) {
                showToast('success', 'Service Submitted', 'Pending admin approval.');
                router.back();
            }
        } catch (e) {
            showToast('error', 'Error', 'Failed to submit.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ExpoLinearGradient
                colors={[colors.bgGradientStart, colors.bgGradientEnd]}
                style={StyleSheet.absoluteFill}
            />
            <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
            <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />
            
            <View style={{ paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.md }}>
                <BackButton />
            </View>

            <View style={styles.stepIndicator}>
                {STEPS.map((step, idx) => (
                    <React.Fragment key={step}>
                        <View style={styles.stepItem}>
                            <View style={[styles.stepCircle, { backgroundColor: currentStep >= idx ? colors.pink : 'transparent', borderColor: currentStep >= idx ? colors.pink : colors.cardBorder, borderWidth: 2 }]}>
                                {currentStep > idx ? <MaterialCommunityIcons name="check" size={14} color="#FFF" /> : <Text style={[styles.stepNumber, { color: currentStep >= idx ? '#FFF' : colors.textSecondary }]}>{idx + 1}</Text>}
                            </View>
                            <Text style={[styles.stepLabel, { color: currentStep === idx ? colors.textPrimary : colors.textSecondary }]}>{step}</Text>
                        </View>
                        {idx < STEPS.length - 1 && <View style={[styles.stepLine, { backgroundColor: currentStep > idx ? colors.pink : colors.cardBorder }]} />}
                    </React.Fragment>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown} key={`step-${currentStep}`}>
                    <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.stepCard, { borderColor: colors.cardBorder }]}>
                        {currentStep === 0 && (
                            <View>
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Service Information</Text>
                                <FormInput label="Service Name" icon="wrench" placeholder="Enter service name" value={form.name} onChangeText={(v) => setForm(f => ({ ...f, name: v }))} />
                                <FormInput 
                                    label="Description" 
                                    icon="text" 
                                    placeholder="Describe your service" 
                                    value={form.description} 
                                    onChangeText={(v) => setForm(f => ({ ...f, description: v }))} 
                                    multiline
                                    numberOfLines={3}
                                />
                                <Pressable
                                    onPress={() => setForm(f => ({ ...f, is_emergency: !f.is_emergency }))}
                                    style={[styles.toggleRow, { borderColor: colors.cardBorder, backgroundColor: form.is_emergency ? colors.errorSoft : 'transparent' }]}
                                >
                                    <MaterialCommunityIcons
                                        name={form.is_emergency ? 'toggle-switch' : 'toggle-switch-off-outline'}
                                        size={34}
                                        color={form.is_emergency ? colors.error : colors.textMuted}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>Emergency service</Text>
                                        <Text style={[styles.toggleHint, { color: colors.textSecondary }]}>Only appears in the emergency request flow.</Text>
                                    </View>
                                </Pressable>
                            </View>
                        )}
                        {currentStep === 1 && (
                            <View>
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pricing & Timing</Text>
                                <FormInput label="Price (EGP)" icon="cash" keyboardType="numeric" placeholder="0.00" value={form.price} onChangeText={(v) => setForm(f => ({ ...f, price: v }))} />
                                <FormInput label="Duration (min)" icon="clock-outline" keyboardType="numeric" placeholder="30" value={form.duration} onChangeText={(v) => setForm(f => ({ ...f, duration: v }))} />
                            </View>
                        )}
                        {currentStep === 2 && (
                            <View>
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Media</Text>
                                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handlePickImage(); }} style={[styles.imageUpload, { borderColor: colors.cardBorder }]}>
                                    {imageUri ? <Image source={{ uri: imageUri }} style={styles.previewImage} /> : <MaterialCommunityIcons name="camera-plus" size={40} color={colors.pink} />}
                                </Pressable>
                            </View>
                        )}
                    </GlassView>
                </Animated.View>
            </ScrollView>

            <Animated.View entering={FadeInUp.delay(300)} style={[styles.footer, { borderTopColor: colors.cardBorder }]}>
                {currentStep > 0 && <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrentStep(s => s - 1); }} style={styles.navButton}><Text style={{ color: colors.textPrimary }}>Back</Text></Pressable>}
                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleNext(); }} style={[styles.nextButton, { backgroundColor: colors.pink }]}>
                    <Text style={{ color: '#FFF', fontFamily: Fonts.bold }}>{currentStep === STEPS.length - 1 ? 'Create Service' : 'Next'}</Text>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.5 },
    stepIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
    stepItem: { alignItems: 'center', gap: Spacing.xs },
    stepCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    stepNumber: { fontFamily: Fonts.bold, fontSize: 14 },
    stepLabel: { fontFamily: Fonts.medium, fontSize: 11 },
    stepLine: { flex: 1, height: 2, marginHorizontal: Spacing.xs, marginTop: -16 },
    content: { paddingHorizontal: Spacing.lg, paddingBottom: 160 },
    stepCard: { borderRadius: BorderRadius.xxl, borderWidth: 1, padding: Spacing.xl, overflow: 'hidden', ...Shadows.lg },
    sectionTitle: { fontFamily: Fonts.extraBold, fontSize: 24, marginBottom: Spacing.lg, letterSpacing: -0.5 },
    input: { borderWidth: 1, borderRadius: BorderRadius.lg, paddingVertical: 14, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, fontSize: FontSizes.md },
    textArea: { minHeight: 120 },
    imageUpload: { height: 200, borderRadius: BorderRadius.lg, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
    previewImage: { width: '100%', height: '100%', borderRadius: BorderRadius.lg },
    toggleRow: { borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    toggleTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },
    toggleHint: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginTop: 2 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.md, flexDirection: 'row', gap: Spacing.md },
    navButton: { padding: Spacing.md, borderRadius: BorderRadius.full },
    nextButton: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.full, alignItems: 'center' }
});

