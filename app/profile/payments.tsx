import { CenteredHeader, FormInput, GlassView, GradientButton, OutlinedButton } from '@/components';
import { BorderRadius, FontSizes, Fonts, Shadows, Spacing } from '@/constants/theme';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { PaymentRecord, paymentService, SavedPaymentMethod } from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInLeft, Layout } from 'react-native-reanimated';

type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'card';

const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 19);
    return digits.replace(/(.{4})/g, '$1 ').trim();
};

const formatExpiryInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const parseExpiry = (value: string) => {
    const match = value.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return null;

    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    if (month < 1 || month > 12) return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (year < currentYear || (year === currentYear && month < currentMonth)) return null;

    return { month, year };
};

const passesLuhn = (digits: string) => {
    let sum = 0;
    let shouldDouble = false;

    for (let i = digits.length - 1; i >= 0; i -= 1) {
        let digit = Number(digits[i]);
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
};

const detectBrand = (digits: string): CardBrand => {
    if (/^4/.test(digits)) return 'visa';
    if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return 'mastercard';
    if (/^3[47]/.test(digits)) return 'amex';
    if (/^(6011|65|64[4-9])/.test(digits)) return 'discover';
    return 'card';
};

const brandLabel = (brand: string) => {
    switch (brand) {
        case 'visa':
            return 'Visa';
        case 'mastercard':
            return 'Mastercard';
        case 'amex':
            return 'Amex';
        case 'discover':
            return 'Discover';
        default:
            return 'Card';
    }
};

const brandColors = (brand: string): [string, string] => {
    switch (brand) {
        case 'visa':
            return ['#2563EB', '#1D4ED8'];
        case 'mastercard':
            return ['#EB5757', '#C20D0D'];
        case 'amex':
            return ['#0891B2', '#0E7490'];
        case 'discover':
            return ['#F59E0B', '#D97706'];
        default:
            return ['#475569', '#334155'];
    }
};

const paymentMethodLabel = (method: string) => {
    if (method === 'cash_on_delivery') return 'Cash on Delivery';
    if (method === 'credit_card') return 'Credit Card';
    return method.replace(/_/g, ' ');
};

const formatAmount = (amount: string | number) => `${Number(amount || 0).toLocaleString('en-EG')} EGP`;

const formatDate = (value?: string | null) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-EG', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

export default function PaymentsScreen() {
    const { colors, isDark } = useTheme();
    const { showToast } = useToast();

    const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [saving, setSaving] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const [holderName, setHolderName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [makeDefault, setMakeDefault] = useState(true);

    const cardDigits = useMemo(() => cardNumber.replace(/\D/g, ''), [cardNumber]);
    const parsedExpiry = useMemo(() => parseExpiry(expiry), [expiry]);
    const detectedBrand = useMemo(() => detectBrand(cardDigits), [cardDigits]);
    const cardIsValid = cardDigits.length >= 13 && cardDigits.length <= 19 && passesLuhn(cardDigits);
    const canSave = holderName.trim().length >= 2 && cardIsValid && Boolean(parsedExpiry) && !saving;

    const resetForm = useCallback(() => {
        setHolderName('');
        setCardNumber('');
        setExpiry('');
        setMakeDefault(paymentMethods.length === 0);
    }, [paymentMethods.length]);

    const loadPayments = useCallback(async () => {
        try {
            setLoading(true);
            const [methodsRes, paymentsRes] = await Promise.all([
                paymentService.getPaymentMethods(),
                paymentService.getMyPayments(),
            ]);

            if (methodsRes.success) {
                setPaymentMethods(methodsRes.data || []);
                setMakeDefault((methodsRes.data || []).length === 0);
            }

            if (paymentsRes.success) {
                setPayments(paymentsRes.data || []);
            }
        } catch (error: any) {
            showToast('error', 'Payments Error', error.message || 'Could not load payment data.');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useFocusEffect(
        useCallback(() => {
            loadPayments();
        }, [loadPayments])
    );

    const handleSaveCard = async () => {
        if (!parsedExpiry || !cardIsValid || holderName.trim().length < 2) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showToast('warning', 'Invalid Card', 'Please enter a valid card number, expiry, and holder name.');
            return;
        }

        try {
            setSaving(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const response = await paymentService.addPaymentMethod({
                brand: detectedBrand,
                last4: cardDigits.slice(-4),
                expiry_month: parsedExpiry.month,
                expiry_year: parsedExpiry.year,
                holder_name: holderName.trim(),
                is_default: makeDefault,
            });

            if (!response.success) {
                showToast('error', 'Save Failed', response.message || 'Could not save card.');
                return;
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast('success', 'Card Saved', 'Payment method saved successfully.');
            setIsAdding(false);
            resetForm();
            await loadPayments();
        } catch (error: any) {
            showToast('error', 'Save Failed', error.message || 'Could not save card.');
        } finally {
            setSaving(false);
        }
    };

    const handleSetDefault = async (method: SavedPaymentMethod) => {
        if (method.is_default || updatingId) return;

        try {
            setUpdatingId(method.payment_method_id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const response = await paymentService.setDefaultPaymentMethod(method.payment_method_id);
            if (response.success) {
                setPaymentMethods((current) =>
                    current.map((item) => ({
                        ...item,
                        is_default: item.payment_method_id === method.payment_method_id,
                    }))
                );
                showToast('success', 'Default Updated', 'Default payment method changed.');
            }
        } catch (error: any) {
            showToast('error', 'Update Failed', error.message || 'Could not update default card.');
        } finally {
            setUpdatingId(null);
        }
    };

    const deleteCard = async (method: SavedPaymentMethod) => {
        try {
            setUpdatingId(method.payment_method_id);
            const response = await paymentService.deletePaymentMethod(method.payment_method_id);
            if (response.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showToast('success', 'Card Removed', 'Payment method deleted.');
                await loadPayments();
            }
        } catch (error: any) {
            showToast('error', 'Delete Failed', error.message || 'Could not delete card.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDeleteCard = (method: SavedPaymentMethod) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert(
            'Remove Card',
            `Remove ${brandLabel(method.brand)} ending in ${method.last4}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => deleteCard(method),
                },
            ]
        );
    };

    const renderCard = (method: SavedPaymentMethod, index: number) => (
        <Animated.View
            key={method.payment_method_id}
            entering={FadeInLeft.delay(index * 80).springify()}
            layout={Layout.springify()}
            style={styles.cardWrapper}
        >
            <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={[styles.card, { borderColor: colors.cardBorder }]}>
                <LinearGradient colors={brandColors(method.brand)} style={styles.cardTypeBadge}>
                    <MaterialCommunityIcons name="credit-card" size={20} color="white" />
                </LinearGradient>

                <View style={styles.cardMain}>
                    <View style={styles.cardTitleRow}>
                        <Text style={[styles.cardBrand, { color: colors.textPrimary }]}>{brandLabel(method.brand)}</Text>
                        {method.is_default && (
                            <View style={[styles.defaultBadge, { backgroundColor: colors.pink + '18' }]}>
                                <Text style={[styles.defaultBadgeText, { color: colors.pink }]}>Default</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.cardNumber, { color: colors.textPrimary }]}>**** **** **** {method.last4}</Text>

                    <View style={styles.cardFooter}>
                        <View style={styles.cardFooterItem}>
                            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>HOLDER</Text>
                            <Text style={[styles.cardValue, { color: colors.textPrimary }]} numberOfLines={1}>{method.holder_name}</Text>
                        </View>
                        <View style={[styles.cardFooterItem, { alignItems: 'flex-end' }]}>
                            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>EXPIRY</Text>
                            <Text style={[styles.cardValue, { color: colors.textPrimary }]}>
                                {String(method.expiry_month).padStart(2, '0')}/{String(method.expiry_year).slice(-2)}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardActions}>
                    {!method.is_default && (
                        <Pressable
                            disabled={updatingId === method.payment_method_id}
                            style={[styles.actionBtn, { backgroundColor: colors.pink + '15' }]}
                            onPress={() => handleSetDefault(method)}
                        >
                            {updatingId === method.payment_method_id ? (
                                <ActivityIndicator size="small" color={colors.pink} />
                            ) : (
                                <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.pink} />
                            )}
                        </Pressable>
                    )}
                    <Pressable
                        disabled={updatingId === method.payment_method_id}
                        style={[styles.actionBtn, { backgroundColor: colors.error + '15' }]}
                        onPress={() => handleDeleteCard(method)}
                    >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                    </Pressable>
                </View>
            </GlassView>
        </Animated.View>
    );

    const renderPayment = (payment: PaymentRecord, index: number) => (
        <Animated.View key={payment.payment_id} entering={FadeInDown.delay(index * 60).springify()}>
            <GlassView intensity={isDark ? 20 : 35} tint={isDark ? 'dark' : 'light'} style={[styles.historyItem, { borderColor: colors.cardBorder }]}>
                <View style={[styles.historyIcon, { backgroundColor: colors.surfaceMuted }]}>
                    <MaterialCommunityIcons
                        name={payment.method === 'cash_on_delivery' ? 'cash' : 'credit-card-outline'}
                        size={20}
                        color={colors.pink}
                    />
                </View>
                <View style={styles.historyMain}>
                    <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>{paymentMethodLabel(payment.method)}</Text>
                    <Text style={[styles.historySub, { color: colors.textMuted }]}>
                        {payment.order_id_fk ? `Order #${payment.order_id_fk}` : payment.booking_id_fk ? `Booking #${payment.booking_id_fk}` : 'Payment'} - {formatDate(payment.created_at)}
                    </Text>
                </View>
                <View style={styles.historyAmountWrap}>
                    <Text style={[styles.historyAmount, { color: colors.textPrimary }]}>{formatAmount(payment.amount)}</Text>
                    <Text style={[styles.historyStatus, { color: payment.status === 'completed' ? colors.success : colors.textMuted }]}>
                        {payment.status || 'pending'}
                    </Text>
                </View>
            </GlassView>
        </Animated.View>
    );

    const renderAddForm = () => (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <CenteredHeader title="Add Card" titleColor={colors.textPrimary} />
            <Animated.View entering={FadeInDown.springify()}>
                <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={[styles.formPreview, { borderColor: colors.cardBorder }]}>
                    <LinearGradient colors={brandColors(detectedBrand)} style={styles.previewBadge}>
                        <MaterialCommunityIcons name="credit-card" size={24} color="white" />
                    </LinearGradient>
                    <View style={styles.previewMain}>
                        <Text style={[styles.previewNumber, { color: colors.textPrimary }]}>
                            {cardDigits ? `**** **** **** ${cardDigits.slice(-4).padStart(4, '*')}` : '**** **** **** ****'}
                        </Text>
                        <Text style={[styles.previewSub, { color: colors.textSecondary }]}>
                            {brandLabel(detectedBrand)} - {expiry || 'MM/YY'}
                        </Text>
                    </View>
                </GlassView>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.formSection}>
                <FormInput
                    label="Card Holder"
                    icon="account-outline"
                    placeholder="Name on card"
                    value={holderName}
                    onChangeText={setHolderName}
                    autoCapitalize="words"
                    autoComplete="name"
                />
                <FormInput
                    label="Card Number"
                    icon="credit-card-outline"
                    placeholder="Card number"
                    value={cardNumber}
                    onChangeText={(value) => setCardNumber(formatCardNumber(value))}
                    keyboardType="number-pad"
                    maxLength={23}
                />
                <FormInput
                    label="Expiry"
                    icon="calendar-month-outline"
                    placeholder="MM/YY"
                    value={expiry}
                    onChangeText={(value) => setExpiry(formatExpiryInput(value))}
                    keyboardType="number-pad"
                    maxLength={5}
                />

                <Pressable
                    style={[styles.defaultToggle, { borderColor: makeDefault ? colors.pink : colors.cardBorder, backgroundColor: makeDefault ? colors.pink + '10' : 'transparent' }]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setMakeDefault((current) => !current);
                    }}
                >
                    <MaterialCommunityIcons
                        name={makeDefault ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                        size={22}
                        color={makeDefault ? colors.pink : colors.textMuted}
                    />
                    <Text style={[styles.defaultToggleText, { color: colors.textPrimary }]}>Set as default card</Text>
                </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).springify()}>
                <GradientButton
                    title="Save Card"
                    onPress={handleSaveCard}
                    loading={saving}
                    disabled={!canSave}
                    style={{ marginTop: Spacing.lg }}
                    icon="content-save-outline"
                />
                <OutlinedButton
                    title="Cancel"
                    onPress={() => {
                        setIsAdding(false);
                        resetForm();
                    }}
                    style={{ marginTop: Spacing.md }}
                    textColor={colors.textMuted}
                />
            </Animated.View>
        </ScrollView>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient colors={[colors.bgGradientStart, colors.bgGradientEnd]} style={StyleSheet.absoluteFill} />

            <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
            <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.pink} />
                </View>
            ) : isAdding ? (
                renderAddForm()
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <CenteredHeader title="Payments" titleColor={colors.textPrimary} />

                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SAVED CARDS</Text>
                    {paymentMethods.length === 0 ? (
                        <Animated.View entering={FadeInDown} style={styles.emptyContainer}>
                            <GlassView intensity={20} tint={isDark ? 'dark' : 'light'} style={[styles.emptyIconCircle, { borderColor: colors.cardBorder }]}>
                                <MaterialCommunityIcons name="credit-card-off-outline" size={56} color={colors.textMuted} />
                            </GlassView>
                            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No cards saved</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                Add a card to manage your payment methods.
                            </Text>
                        </Animated.View>
                    ) : (
                        <View style={styles.cardList}>
                            {paymentMethods.map(renderCard)}
                        </View>
                    )}

                    <Pressable
                        style={({ pressed }) => [
                            styles.addBtn,
                            { transform: [{ scale: pressed ? 0.98 : 1 }] },
                        ]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            resetForm();
                            setIsAdding(true);
                        }}
                    >
                        <LinearGradient
                            colors={[colors.pink, colors.purple]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.addBtnGradient}
                        >
                            <MaterialCommunityIcons name="plus" size={22} color="white" />
                            <Text style={styles.addBtnText}>Add New Card</Text>
                        </LinearGradient>
                    </Pressable>

                    <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.xl }]}>RECENT PAYMENTS</Text>
                    {payments.length === 0 ? (
                        <GlassView intensity={20} tint={isDark ? 'dark' : 'light'} style={[styles.historyEmpty, { borderColor: colors.cardBorder }]}>
                            <MaterialCommunityIcons name="receipt-text-outline" size={24} color={colors.textMuted} />
                            <Text style={[styles.historyEmptyText, { color: colors.textSecondary }]}>No payments yet</Text>
                        </GlassView>
                    ) : (
                        <View style={styles.historyList}>
                            {payments.slice(0, 10).map(renderPayment)}
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    orb: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
        opacity: 0.4,
    },
    content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 100 },
    sectionTitle: {
        fontFamily: Fonts.extraBold,
        fontSize: 12,
        letterSpacing: 1.5,
        marginBottom: Spacing.lg,
        opacity: 0.6,
    },
    cardList: { gap: Spacing.md, marginBottom: Spacing.xl },
    cardWrapper: {
        ...Shadows.md,
    },
    card: {
        borderRadius: 24,
        borderWidth: 1,
        padding: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    cardTypeBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardMain: { flex: 1 },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: 6,
    },
    cardBrand: {
        fontFamily: Fonts.extraBold,
        fontSize: FontSizes.md,
    },
    defaultBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: BorderRadius.full,
    },
    defaultBadgeText: {
        fontFamily: Fonts.bold,
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardNumber: {
        fontFamily: Fonts.bold,
        fontSize: 16,
        letterSpacing: 1,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: Spacing.md,
    },
    cardFooterItem: {
        flex: 1,
    },
    cardLabel: {
        fontFamily: Fonts.bold,
        fontSize: 9,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    cardValue: {
        fontFamily: Fonts.bold,
        fontSize: 13,
    },
    cardActions: {
        gap: Spacing.sm,
    },
    actionBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBtn: {
        height: 60,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        ...Shadows.md,
    },
    addBtnGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    addBtnText: {
        color: 'white',
        fontFamily: Fonts.extraBold,
        fontSize: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        borderWidth: 1,
    },
    emptyTitle: {
        fontFamily: Fonts.bold,
        fontSize: 20,
        marginBottom: Spacing.sm,
    },
    emptySubtitle: {
        fontFamily: Fonts.medium,
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.6,
        paddingHorizontal: 40,
    },
    formPreview: {
        borderWidth: 1,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
        overflow: 'hidden',
    },
    previewBadge: {
        width: 54,
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewMain: {
        flex: 1,
    },
    previewNumber: {
        fontFamily: Fonts.extraBold,
        fontSize: FontSizes.md,
        letterSpacing: 1,
    },
    previewSub: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.sm,
        marginTop: 4,
        opacity: 0.7,
    },
    formSection: {
        gap: Spacing.sm,
    },
    defaultToggle: {
        minHeight: 54,
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    defaultToggleText: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.sm,
    },
    historyList: {
        gap: Spacing.sm,
    },
    historyItem: {
        borderWidth: 1,
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        overflow: 'hidden',
    },
    historyIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyMain: {
        flex: 1,
    },
    historyTitle: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.sm,
    },
    historySub: {
        fontFamily: Fonts.medium,
        fontSize: 11,
        marginTop: 3,
        opacity: 0.7,
    },
    historyAmountWrap: {
        alignItems: 'flex-end',
    },
    historyAmount: {
        fontFamily: Fonts.extraBold,
        fontSize: FontSizes.sm,
    },
    historyStatus: {
        fontFamily: Fonts.bold,
        fontSize: 10,
        textTransform: 'uppercase',
        marginTop: 3,
    },
    historyEmpty: {
        borderWidth: 1,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        overflow: 'hidden',
    },
    historyEmptyText: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.sm,
    },
});
