import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { BorderRadius, FontSizes, Fonts, Spacing, Shadows } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { useCart } from '@/contexts/CartContext';
import { PaymentMethod } from '@/services/api/payment.service';
import * as ImagePicker from 'expo-image-picker';
import { addressService, orderService, paymentService } from '@/services/api';
import { CenteredHeader } from '@/components';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Address = {
    address_id: number;
    title?: string;
    street?: string;
    city?: string;
};

const paymentMethods: { label: string; value: PaymentMethod; icon: string }[] = [
    { label: 'Cash on Delivery', value: 'cash_on_delivery', icon: 'cash' },
    { label: 'InstaPay', value: 'instapay', icon: 'bank-transfer' },
    { label: 'Vodafone Cash', value: 'vodafone_cash', icon: 'wallet-outline' },
    { label: 'Credit Card', value: 'credit_card', icon: 'credit-card-outline' },
];

const MIN_DELIVERY_DAYS = 5;
const DATE_CHOICES_COUNT = 4;
const SHIPPING_FEE = 50;
const INSTAPAY_USERNAME = 'carkit.pay';
const VODAFONE_CASH_NUMBER = '01004899835';

const addDays = (baseDate: Date, days: number) => {
    const date = new Date(baseDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date;
};

const formatDateValue = (date: Date) => date.toISOString().split('T')[0];

const formatReadableDate = (isoDate: string) => {
    try {
        const date = new Date(`${isoDate}T00:00:00`);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
        return isoDate;
    }
};

export default function CheckoutScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { showToast } = useToast();
    const { items, total, fetchCart } = useCart();
    const isDark = colors.background === '#000000' || colors.background === '#121212';

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [transferScreenshotUri, setTransferScreenshotUri] = useState<string | null>(null);
    const [cardHolderName, setCardHolderName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');

    const today = useMemo(() => new Date(), []);
    const estimatedStartDate = useMemo(() => addDays(today, MIN_DELIVERY_DAYS), [today]);
    const estimatedEndDate = useMemo(() => addDays(today, MIN_DELIVERY_DAYS + 3), [today]);
    const deliveryChoices = useMemo(
        () => Array.from({ length: DATE_CHOICES_COUNT }, (_, index) => formatDateValue(addDays(today, MIN_DELIVERY_DAYS + index))),
        [today]
    );
    const [preferredDeliveryDate, setPreferredDeliveryDate] = useState(formatDateValue(estimatedStartDate));

    const totalNumber = useMemo(() => Number(total) || 0, [total]);
    const totalWithShipping = useMemo(() => totalNumber + SHIPPING_FEE, [totalNumber]);
    const cardNumberDigits = useMemo(() => cardNumber.replace(/\s/g, ''), [cardNumber]);

    const isValidExpiry = (value: string) => {
        const match = value.match(/^(\d{2})\/(\d{2})$/);
        if (!match) return false;
        const month = Number(match[1]);
        return month >= 1 && month <= 12;
    };

    const canSubmitPaymentDetails = useMemo(() => {
        if (paymentMethod === 'cash_on_delivery') return true;

        if (paymentMethod === 'instapay' || paymentMethod === 'vodafone_cash') {
            return Boolean(transferScreenshotUri);
        }

        if (paymentMethod === 'credit_card') {
            const hasValidCardNumber = cardNumberDigits.length >= 13 && cardNumberDigits.length <= 19;
            const hasValidCvv = /^\d{3,4}$/.test(cardCvv.trim());
            return cardHolderName.trim().length > 2 && hasValidCardNumber && isValidExpiry(cardExpiry.trim()) && hasValidCvv;
        }

        return false;
    }, [paymentMethod, transferScreenshotUri, cardHolderName, cardNumberDigits, cardExpiry, cardCvv]);

    const canPlaceOrder = useMemo(() => {
        return items.length > 0 && Boolean(selectedAddressId) && canSubmitPaymentDetails && !placingOrder;
    }, [items.length, selectedAddressId, canSubmitPaymentDetails, placingOrder]);

    const handlePickTransferScreenshot = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: false,
            quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
            setTransferScreenshotUri(result.assets[0].uri);
        }
    };

    useEffect(() => {
        const loadAddresses = async () => {
            try {
                const res = await addressService.getAddresses();
                if (res.success && Array.isArray(res.data)) {
                    setAddresses(res.data);
                    if (res.data.length > 0) {
                        setSelectedAddressId(res.data[0].address_id);
                    }
                }
            } catch {
                showToast('error', 'Address Error', 'Could not load addresses.');
            } finally {
                setLoadingAddresses(false);
            }
        };

        loadAddresses();
    }, [showToast]);

    const handlePlaceOrder = async () => {
        if (items.length === 0) {
            showToast('warning', 'Empty Cart', 'Add items before checkout.');
            return;
        }

        if (!selectedAddressId) {
            showToast('warning', 'Address Required', 'Please add/select a shipping address.');
            return;
        }

        if (!canSubmitPaymentDetails) {
            if (paymentMethod === 'instapay') {
                showToast('warning', 'Proof Required', 'Please upload your InstaPay transfer screenshot.');
                return;
            }

            if (paymentMethod === 'vodafone_cash') {
                showToast('warning', 'Proof Required', 'Please upload your Vodafone Cash transfer screenshot.');
                return;
            }

            if (paymentMethod === 'credit_card') {
                showToast('warning', 'Card Details Required', 'Please complete valid credit card details.');
                return;
            }
        }

        try {
            setPlacingOrder(true);

            const orderRes = await orderService.createOrder({
                shipping_address_id: selectedAddressId,
                preferred_delivery_date: preferredDeliveryDate,
            });

            if (!orderRes.success || !orderRes.data) {
                showToast('error', 'Order Failed', orderRes.message || 'Could not place order.');
                return;
            }

            const paymentRes = await paymentService.createPayment({
                order_id: orderRes.data.order_id,
                method: paymentMethod,
                amount: totalWithShipping,
            });

            if (!paymentRes.success) {
                showToast('error', 'Payment Failed', paymentRes.message || 'Order created, payment failed.');
                router.replace({
                    pathname: '/order-failure' as any,
                    params: {
                        orderId: String(orderRes.data.order_id),
                        amount: String(totalWithShipping),
                        method: paymentMethod,
                    },
                });
                return;
            }

            await fetchCart();
            router.replace({
                pathname: '/order-success' as any,
                params: { orderId: String(orderRes.data.order_id) },
            });
        } catch {
            showToast('error', 'Checkout Error', 'Something went wrong during checkout.');
        } finally {
            setPlacingOrder(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ExpoLinearGradient
                colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative Orbs */}
            <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
            <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />

            <CenteredHeader title="Checkout" titleColor={colors.textPrimary} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.Text entering={FadeInDown.delay(100)} style={[styles.sectionTitle, { color: colors.textPrimary }]}>Shipping Address</Animated.Text>

                {loadingAddresses ? (
                    <ActivityIndicator size="small" color={colors.pink} />
                ) : addresses.length === 0 ? (
                    <Animated.View entering={FadeInDown.delay(200)}>
                        <Pressable
                            style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: colors.cardBorder }]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/profile/addresses');
                            }}
                        >
                            <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.blurWrap}>
                                <MaterialCommunityIcons name="map-marker-plus-outline" size={20} color={colors.pink} />
                                <Text style={[styles.infoText, { color: colors.textSecondary }]}>No address found. Tap to add one.</Text>
                            </BlurView>
                        </Pressable>
                    </Animated.View>
                ) : (
                    addresses.map((address, idx) => {
                        const active = selectedAddressId === address.address_id;
                        return (
                            <Animated.View key={address.address_id} entering={FadeInDown.delay(200 + idx * 50)}>
                                <Pressable
                                    style={[
                                        styles.addressCard,
                                        {
                                            backgroundColor: active ? colors.pink + '15' : 'transparent',
                                            borderColor: active ? colors.pink : colors.cardBorder,
                                        },
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setSelectedAddressId(address.address_id);
                                    }}
                                >
                                    <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.blurWrap}>
                                        <View style={styles.addressHeader}>
                                            <Text style={[styles.addressTitle, { color: colors.textPrimary }]}>
                                                {address.title || 'Address'}
                                            </Text>
                                            {active ? <MaterialCommunityIcons name="check-circle" size={18} color={colors.pink} /> : null}
                                        </View>
                                        <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                                            {address.street || ''}{address.street && address.city ? ', ' : ''}{address.city || ''}
                                        </Text>
                                    </BlurView>
                                </Pressable>
                            </Animated.View>
                        );
                    })
                )}

                <Animated.Text entering={FadeInDown.delay(400)} style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.xl }]}>Payment Method</Animated.Text>

                {paymentMethods.map((method, idx) => {
                    const active = paymentMethod === method.value;
                    return (
                        <Animated.View key={method.value} entering={FadeInDown.delay(450 + idx * 50)}>
                            <Pressable
                                style={[
                                    styles.methodCard,
                                    {
                                        backgroundColor: active ? colors.pink + '15' : 'transparent',
                                        borderColor: active ? colors.pink : colors.cardBorder,
                                    },
                                ]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setPaymentMethod(method.value);
                                }}
                            >
                                <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.methodBlur}>
                                    <View style={styles.methodLeft}>
                                        <MaterialCommunityIcons name={method.icon as any} size={20} color={active ? colors.pink : colors.textSecondary} />
                                        <Text style={[styles.methodLabel, { color: colors.textPrimary }]}>{method.label}</Text>
                                    </View>
                                    {active ? <MaterialCommunityIcons name="radiobox-marked" size={18} color={colors.pink} /> : <MaterialCommunityIcons name="radiobox-blank" size={18} color={colors.textSecondary} />}
                                </BlurView>
                            </Pressable>
                        </Animated.View>
                    );
                })}

                {(paymentMethod === 'instapay' || paymentMethod === 'vodafone_cash') ? (
                    <Animated.View entering={FadeInUp}>
                        <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.paymentDetailsCard, { borderColor: colors.cardBorder }]}>
                            <Text style={[styles.paymentDetailsTitle, { color: colors.textPrimary }]}>Transfer Details</Text>
                            <Text style={[styles.paymentDetailsText, { color: colors.textSecondary }]}>Send to: {paymentMethod === 'instapay' ? INSTAPAY_USERNAME : VODAFONE_CASH_NUMBER}</Text>

                            <Pressable
                                style={[styles.uploadButton, { borderColor: colors.pink }]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    handlePickTransferScreenshot();
                                }}
                            >
                                <MaterialCommunityIcons name="image-plus" size={18} color={colors.pink} />
                                <Text style={[styles.uploadButtonText, { color: colors.pink }]}>Upload payment screenshot</Text>
                            </Pressable>

                            {transferScreenshotUri ? (
                                <View style={styles.uploadPreviewWrap}>
                                    <Image source={{ uri: transferScreenshotUri }} style={styles.uploadPreview} />
                                    <Text style={[styles.uploadSuccess, { color: colors.textSecondary }]}>Screenshot uploaded</Text>
                                </View>
                            ) : (
                                <Text style={[styles.uploadHint, { color: colors.textSecondary, opacity: 0.6 }]}>Required to unlock Place Order.</Text>
                            )}
                        </BlurView>
                    </Animated.View>
                ) : null}

                {paymentMethod === 'credit_card' ? (
                    <Animated.View entering={FadeInUp}>
                        <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.paymentDetailsCard, { borderColor: colors.cardBorder }]}>
                            <Text style={[styles.paymentDetailsTitle, { color: colors.textPrimary }]}>Card Details</Text>
                            <TextInput
                                value={cardHolderName}
                                onChangeText={setCardHolderName}
                                placeholder="Card holder name"
                                placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                                style={[styles.input, { color: colors.textPrimary, borderColor: colors.cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                            />
                            <TextInput
                                value={cardNumber}
                                onChangeText={setCardNumber}
                                placeholder="Card number"
                                placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                                keyboardType="number-pad"
                                style={[styles.input, { color: colors.textPrimary, borderColor: colors.cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                            />
                            <View style={styles.rowInputs}>
                                <TextInput
                                    value={cardExpiry}
                                    onChangeText={setCardExpiry}
                                    placeholder="MM/YY"
                                    placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                                    style={[styles.input, styles.halfInput, { color: colors.textPrimary, borderColor: colors.cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                                />
                                <TextInput
                                    value={cardCvv}
                                    onChangeText={setCardCvv}
                                    placeholder="CVV"
                                    placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                                    keyboardType="number-pad"
                                    secureTextEntry
                                    style={[styles.input, styles.halfInput, { color: colors.textPrimary, borderColor: colors.cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                                />
                            </View>
                            <Text style={[styles.uploadHint, { color: colors.textSecondary, opacity: 0.6 }]}>Complete all fields to unlock Place Order.</Text>
                        </BlurView>
                    </Animated.View>
                ) : null}

                <Animated.Text entering={FadeInDown.delay(700)} style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.xl }]}>Arrival Date</Animated.Text>
                <Animated.View entering={FadeInDown.delay(750)}>
                    <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.estimatedCard, { borderColor: colors.cardBorder }]}>
                        <Text style={[styles.estimatedTitle, { color: colors.textPrimary }]}>Estimated Window</Text>
                        <Text style={[styles.estimatedText, { color: colors.textSecondary }]}>From {formatReadableDate(formatDateValue(estimatedStartDate))} to {formatReadableDate(formatDateValue(estimatedEndDate))}</Text>
                    </BlurView>
                </Animated.View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
                    {deliveryChoices.map((dateValue, idx) => {
                        const selected = preferredDeliveryDate === dateValue;
                        return (
                            <Animated.View key={dateValue} entering={FadeInDown.delay(800 + idx * 50)}>
                                <Pressable
                                    style={[
                                        styles.dateChip,
                                        {
                                            backgroundColor: selected ? colors.pink + '15' : 'transparent',
                                            borderColor: selected ? colors.pink : colors.cardBorder,
                                        },
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setPreferredDeliveryDate(dateValue);
                                    }}
                                >
                                    <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.dateBlur}>
                                        <Text style={[styles.dateChipLabel, { color: selected ? colors.pink : colors.textSecondary }]}>Preferred</Text>
                                        <Text style={[styles.dateChipValue, { color: colors.textPrimary }]}>{formatReadableDate(dateValue)}</Text>
                                    </BlurView>
                                </Pressable>
                            </Animated.View>
                        );
                    })}
                </ScrollView>

                <Animated.View entering={FadeInUp.delay(1000)}>
                    <BlurView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={[styles.summaryCard, { borderColor: colors.cardBorder }]}>
                        <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Order Summary</Text>
                        <Text style={[styles.summaryLine, { color: colors.textSecondary }]}>Items: {items.length}</Text>
                        <Text style={[styles.summaryLine, { color: colors.textSecondary }]}>Preferred arrival: {formatReadableDate(preferredDeliveryDate)}</Text>
                        <Text style={[styles.summaryLine, { color: colors.textSecondary }]}>Subtotal: {totalNumber.toFixed(2)} EGP</Text>
                        <Text style={[styles.summaryLine, { color: colors.textSecondary }]}>Shipping: {SHIPPING_FEE.toFixed(2)} EGP</Text>
                        <Text style={[styles.summaryTotal, { color: colors.textPrimary }]}>Total: {totalWithShipping.toFixed(2)} EGP</Text>
                    </BlurView>
                </Animated.View>
            </ScrollView>

            <Animated.View entering={FadeInUp.delay(1200)} style={[styles.bottomBar, { borderTopColor: colors.cardBorder, backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' }]}>
                <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.buttonBlur}>
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            handlePlaceOrder();
                        }}
                        disabled={!canPlaceOrder}
                        style={[styles.placeButton, { backgroundColor: colors.pink, opacity: canPlaceOrder ? 1 : 0.45 }]}
                    >
                        {placingOrder ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.placeButtonText}>Place Order</Text>
                        )}
                    </Pressable>
                </BlurView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    orb: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.5,
    },
    content: { paddingHorizontal: Spacing.md, paddingBottom: 180 },
    sectionTitle: {
        fontFamily: Fonts.extraBold,
        fontSize: 22,
        marginBottom: Spacing.sm,
        letterSpacing: -0.5,
    },
    infoCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    blurWrap: {
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    infoText: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.sm,
    },
    addressCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    addressTitle: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
    addressText: { fontFamily: Fonts.regular, fontSize: FontSizes.xs },
    methodCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    methodBlur: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    methodLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    methodLabel: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.sm,
    },
    paymentDetailsCard: {
        borderWidth: 1,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginTop: Spacing.xs,
        overflow: 'hidden',
        ...Shadows.md,
    },
    paymentDetailsTitle: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.sm,
        marginBottom: Spacing.xs,
    },
    paymentDetailsText: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.xs,
        marginBottom: Spacing.sm,
    },
    uploadButton: {
        borderWidth: 1.5,
        borderRadius: BorderRadius.full,
        paddingVertical: 14,
        paddingHorizontal: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    uploadButtonText: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.xs,
    },
    uploadPreviewWrap: {
        marginTop: Spacing.sm,
        alignItems: 'flex-start',
    },
    uploadPreview: {
        width: 120,
        height: 120,
        borderRadius: BorderRadius.sm,
        marginBottom: 6,
    },
    uploadSuccess: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.xs,
    },
    uploadHint: {
        marginTop: Spacing.xs,
        fontFamily: Fonts.regular,
        fontSize: FontSizes.xs,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        paddingVertical: 14,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.md,
    },
    rowInputs: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    halfInput: {
        flex: 1,
    },
    summaryCard: {
        borderWidth: 1,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        marginTop: Spacing.xl,
        overflow: 'hidden',
        ...Shadows.lg,
    },
    estimatedCard: {
        borderWidth: 1,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        overflow: 'hidden',
    },
    estimatedTitle: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.sm,
        marginBottom: 4,
    },
    estimatedText: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.xs,
    },
    dateRow: {
        gap: Spacing.sm,
        marginTop: Spacing.sm,
        paddingBottom: Spacing.xs,
    },
    dateChip: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        minWidth: 130,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    dateBlur: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    dateChipLabel: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.xs,
        marginBottom: 2,
    },
    dateChipValue: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.sm,
    },
    summaryTitle: {
        fontFamily: Fonts.extraBold,
        fontSize: 20,
        marginBottom: Spacing.md,
        letterSpacing: -0.5,
    },
    summaryLine: { fontFamily: Fonts.medium, fontSize: FontSizes.md, marginBottom: 4 },
    summaryTotal: {
        marginTop: Spacing.lg,
        fontFamily: Fonts.extraBold,
        fontSize: 24,
        letterSpacing: -1,
    },
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        borderTopWidth: 1,
        overflow: 'hidden',
    },
    buttonBlur: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: 40,
    },
    placeButton: {
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        ...Shadows.md,
    },
    placeButtonText: {
        color: '#FFFFFF',
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
    },
});
