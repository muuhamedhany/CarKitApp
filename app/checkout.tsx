import { CenteredHeader, FormInput, GlassView } from '@/components';
import { BorderRadius, FontSizes, Fonts, Shadows, Spacing } from '@/constants/theme';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { addressService, orderService, paymentService } from '@/services/api';
import { PaymentMethod } from '@/services/api/payment.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const { showToast } = useToast();
    const { items, total, fetchCart } = useCart();

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

    const loadAddresses = useCallback(async () => {
        try {
            const res = await addressService.getAddresses();
            if (res.success && Array.isArray(res.data)) {
                // Ensure every address has an address_id even if it came as 'id'
                const normalized = res.data.map((addr: any) => ({
                    ...addr,
                    address_id: addr.address_id || addr.id
                }));
                setAddresses(normalized);
                if (normalized.length > 0 && !selectedAddressId) {
                    setSelectedAddressId(normalized[0].address_id);
                }
            }
        } catch {
            showToast('error', 'Address Error', 'Could not load addresses.');
        } finally {
            setLoadingAddresses(false);
        }
    }, [selectedAddressId, showToast]);

    useFocusEffect(
        useCallback(() => {
            loadAddresses();
        }, [loadAddresses])
    );

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
            <LinearGradient
                colors={[colors.bgGradientStart, colors.bgGradientEnd]}
                style={StyleSheet.absoluteFill}
            />

            {isDark && (
                <>
                    <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
                    <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />
                </>
            )}


            <CenteredHeader title="Checkout" titleColor={colors.textPrimary} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>


                {/* Section: Shipping */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderLeft}>
                            <View style={[styles.sectionIcon, { backgroundColor: colors.pink + '15' }]}>
                                <MaterialCommunityIcons name="truck-delivery-outline" size={20} color={colors.pink} />
                            </View>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Shipping Address</Text>
                        </View>
                        <Pressable
                            style={({ pressed }) => [
                                styles.addAddressBtn,
                                { backgroundColor: colors.pink + '15', opacity: pressed ? 0.7 : 1 }
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push({ pathname: '/profile/addresses', params: { add: 'true' } });
                            }}
                        >
                            <MaterialCommunityIcons name="plus" size={18} color={colors.pink} />
                        </Pressable>
                    </View>



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
                                <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.blurWrap}>
                                    <MaterialCommunityIcons name="map-marker-plus-outline" size={20} color={colors.pink} />
                                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>No address found. Tap to add one.</Text>
                                </GlassView>
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
                                        <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.blurWrap}>
                                            <View style={styles.addressHeader}>
                                                <Text style={[styles.addressTitle, { color: colors.textPrimary }]}>
                                                    {address.title || 'Address'}
                                                </Text>
                                                {active ? <MaterialCommunityIcons name="check-circle" size={18} color={colors.pink} /> : null}
                                            </View>
                                            <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                                                {address.street || ''}{address.street && address.city ? ', ' : ''}{address.city || ''}
                                            </Text>
                                        </GlassView>
                                    </Pressable>
                                </Animated.View>
                            );
                        })
                    )}
                </View>


                {/* Section: Payment */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderLeft}>
                            <View style={[styles.sectionIcon, { backgroundColor: colors.purple + '15' }]}>
                                <MaterialCommunityIcons name="credit-card-outline" size={20} color={colors.purple} />
                            </View>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Payment Method</Text>
                        </View>
                    </View>



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
                                    <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.methodBlur}>
                                        <View style={styles.methodLeft}>
                                            <MaterialCommunityIcons name={method.icon as any} size={20} color={active ? colors.pink : colors.textSecondary} />
                                            <Text style={[styles.methodLabel, { color: colors.textPrimary }]}>{method.label}</Text>
                                        </View>
                                        {active ? <MaterialCommunityIcons name="radiobox-marked" size={18} color={colors.pink} /> : <MaterialCommunityIcons name="radiobox-blank" size={18} color={colors.textSecondary} />}
                                    </GlassView>
                                </Pressable>
                            </Animated.View>
                        );
                    })}
                </View>

                {(paymentMethod === 'instapay' || paymentMethod === 'vodafone_cash') ? (
                    <Animated.View entering={FadeInUp}>
                        <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.paymentDetailsCard, { borderColor: colors.cardBorder }]}>
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
                        </GlassView>
                    </Animated.View>
                ) : null}

                {paymentMethod === 'credit_card' ? (
                    <Animated.View entering={FadeInUp}>
                        <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.paymentDetailsCard, { borderColor: colors.cardBorder }]}>
                            <Text style={[styles.paymentDetailsTitle, { color: colors.textPrimary }]}>Card Details</Text>
                            <FormInput
                                value={cardHolderName}
                                onChangeText={setCardHolderName}
                                placeholder="Card holder name"
                                icon="account-outline"
                            />
                            <FormInput
                                value={cardNumber}
                                onChangeText={setCardNumber}
                                placeholder="Card number"
                                keyboardType="number-pad"
                                icon="credit-card-outline"
                            />
                            <View style={styles.rowInputs}>
                                <View style={{ flex: 1 }}>
                                    <FormInput
                                        value={cardExpiry}
                                        onChangeText={setCardExpiry}
                                        placeholder="MM/YY"
                                        icon="calendar-range"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <FormInput
                                        value={cardCvv}
                                        onChangeText={setCardCvv}
                                        placeholder="CVV"
                                        keyboardType="number-pad"
                                        secureTextEntry
                                        icon="lock-outline"
                                    />
                                </View>
                            </View>
                            <Text style={[styles.uploadHint, { color: colors.textSecondary, opacity: 0.6 }]}>Complete all fields to unlock Place Order.</Text>
                        </GlassView>
                    </Animated.View>
                ) : null}




                {/* Section: Delivery Details */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderLeft}>
                            <View style={[styles.sectionIcon, { backgroundColor: '#4CAF5015' }]}>
                                <MaterialCommunityIcons name="calendar-clock-outline" size={20} color="#4CAF50" />
                            </View>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Arrival Window</Text>
                        </View>
                    </View>





                    <Animated.View entering={FadeInDown.delay(750)}>
                        <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.estimatedCard, { borderColor: colors.cardBorder }]}>
                            <View style={styles.estimatedHeader}>
                                <MaterialCommunityIcons name="calendar-range" size={20} color={colors.pink} />
                                <Text style={[styles.estimatedTitle, { color: colors.textPrimary }]}>Estimated Delivery</Text>
                            </View>
                            <Text style={[styles.estimatedText, { color: colors.textSecondary }]}>
                                Between {formatReadableDate(formatDateValue(estimatedStartDate))} and {formatReadableDate(formatDateValue(estimatedEndDate))}
                            </Text>
                        </GlassView>
                    </Animated.View>

                    <Text style={[styles.dateSelectionLabel, { color: colors.textSecondary }]}>Select Preferred Day</Text>

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
                                        <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.dateBlur}>
                                            <Text style={[styles.dateChipLabel, { color: selected ? colors.pink : colors.textSecondary }]}>{selected ? 'Selected' : 'Preferred'}</Text>
                                            <Text style={[styles.dateChipValue, { color: colors.textPrimary }]}>{formatReadableDate(dateValue)}</Text>
                                        </GlassView>
                                    </Pressable>
                                </Animated.View>
                            );
                        })}
                    </ScrollView>
                </View>


                <Animated.View entering={FadeInUp.delay(1000)}>
                    <GlassView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={[styles.summaryCard, { borderColor: colors.cardBorder }]}>
                        <View style={styles.receiptHeader}>
                            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Order Summary</Text>
                            <MaterialCommunityIcons name="receipt-outline" size={24} color={colors.textSecondary} />
                        </View>

                        <View style={styles.summaryTable}>
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Items ({items.length})</Text>
                                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{totalNumber.toFixed(2)} EGP</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Shipping</Text>
                                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{SHIPPING_FEE.toFixed(2)} EGP</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.summaryRow}>
                                <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Grand Total</Text>
                                <Text 
                                    style={[styles.totalValue, { color: colors.pink }]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                >
                                    {totalWithShipping.toFixed(2)} EGP
                                </Text>
                            </View>
                        </View>

                        <View style={styles.deliveryBadge}>
                            <MaterialCommunityIcons name="clock-fast" size={16} color={colors.pink} />
                            <Text style={[styles.deliveryBadgeText, { color: colors.pink }]}>
                                Arrival by {formatReadableDate(preferredDeliveryDate)}
                            </Text>
                        </View>
                    </GlassView>
                </Animated.View>

            </ScrollView>

            <Animated.View 
                entering={FadeInUp.delay(1200)} 
                style={[
                    styles.bottomBar, 
                    { bottom: insets.bottom + 20 }
                ]}
            >
                <GlassView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={styles.buttonBlur}>
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            handlePlaceOrder();
                        }}
                        disabled={!canPlaceOrder}
                        style={({ pressed }) => [
                            styles.placeButtonWrapper,
                            { opacity: canPlaceOrder ? (pressed ? 0.9 : 1) : 0.45, transform: [{ scale: pressed ? 0.98 : 1 }] }
                        ]}
                    >
                        <LinearGradient
                            colors={[colors.pink, colors.purple]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.placeButton}
                        >
                            {placingOrder ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <Text style={styles.placeButtonText}>Place Order</Text>
                            )}
                        </LinearGradient>
                    </Pressable>
                </GlassView>
            </Animated.View>

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
        opacity: 0.4,
    },
    content: { paddingHorizontal: Spacing.md, paddingBottom: 180 },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    addAddressBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },

    sectionIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontFamily: Fonts.extraBold,
        fontSize: 18,
        letterSpacing: -0.5,
    },
    infoCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    blurWrap: {
        padding: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    infoText: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.sm,
        opacity: 0.8,
    },
    addressCard: {
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        overflow: 'hidden',
    },
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    addressTitle: {
        fontFamily: Fonts.bold,
        fontSize: 15,
        letterSpacing: -0.3,
    },
    addressText: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        opacity: 0.7,
        lineHeight: 18,
    },
    methodCard: {
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        overflow: 'hidden',
    },
    methodBlur: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    methodLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    methodLabel: {
        fontFamily: Fonts.bold,
        fontSize: 15,
    },
    paymentDetailsCard: {
        borderWidth: 1,
        borderRadius: 24,
        padding: Spacing.xl,
        marginTop: Spacing.sm,
        marginBottom: Spacing.lg,
        overflow: 'hidden',
        ...Shadows.md,
    },

    paymentDetailsTitle: {
        fontFamily: Fonts.bold,
        fontSize: 16,
        marginBottom: Spacing.sm,
    },
    paymentDetailsText: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        marginBottom: Spacing.lg,
        opacity: 0.7,
    },
    uploadButton: {
        borderWidth: 1.5,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: Spacing.sm,
        backgroundColor: 'rgba(205, 66, 168, 0.05)',
    },
    uploadButtonText: {
        fontFamily: Fonts.bold,
        fontSize: 14,
    },
    uploadPreviewWrap: {
        marginTop: Spacing.md,
        alignItems: 'center',
    },
    uploadPreview: {
        width: '100%',
        height: 180,
        borderRadius: 16,
        marginBottom: 8,
    },
    uploadSuccess: {
        fontFamily: Fonts.bold,
        fontSize: 12,
    },
    uploadHint: {
        marginTop: Spacing.sm,
        fontFamily: Fonts.medium,
        fontSize: 12,
        textAlign: 'center',
    },
    rowInputs: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    summaryCard: {
        borderWidth: 1,
        borderRadius: 28,
        padding: Spacing.xl,
        marginTop: Spacing.xl,
        overflow: 'hidden',
        ...Shadows.xl,
    },
    receiptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    summaryTable: {
        gap: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontFamily: Fonts.medium,
        fontSize: 15,
        opacity: 0.8,
    },
    summaryValue: {
        fontFamily: Fonts.bold,
        fontSize: 15,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 8,
    },
    totalLabel: {
        fontFamily: Fonts.extraBold,
        fontSize: 18,
    },
    totalValue: {
        fontFamily: Fonts.extraBold,
        fontSize: 22,
        letterSpacing: -0.5,
    },
    deliveryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(205, 66, 168, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        marginTop: Spacing.xl,
        alignSelf: 'flex-start',
    },
    deliveryBadgeText: {
        fontFamily: Fonts.bold,
        fontSize: 12,
    },
    estimatedCard: {
        borderWidth: 1,
        borderRadius: 20,
        padding: Spacing.lg,
        overflow: 'hidden',
        marginBottom: Spacing.md,
    },
    estimatedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    estimatedTitle: {
        fontFamily: Fonts.bold,
        fontSize: 14,
    },
    estimatedText: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        opacity: 0.7,
    },
    dateSelectionLabel: {
        fontFamily: Fonts.bold,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.sm,
        marginTop: Spacing.sm,
        opacity: 0.6,
    },
    dateRow: {
        gap: 12,
        paddingBottom: Spacing.xs,
    },

    dateChip: {
        borderRadius: 18,
        borderWidth: 1,
        minWidth: 120,
        overflow: 'hidden',
    },
    checkoutBtn: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateBlur: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    dateChipLabel: {
        fontFamily: Fonts.bold,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    dateChipValue: {
        fontFamily: Fonts.bold,
        fontSize: 14,
    },
    summaryTitle: {
        fontFamily: Fonts.extraBold,
        fontSize: 22,
        letterSpacing: -0.8,
    },
    bottomBar: {
        position: 'absolute',
        left: Spacing.lg,
        right: Spacing.lg,
        ...Shadows.xl,
    },

    buttonBlur: {
        borderRadius: 35,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.15)',
        overflow: 'hidden',
        padding: 12,
    },

    placeButtonWrapper: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        width: '100%',
    },
    placeButton: {
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },

    placeButtonText: {
        color: '#FFFFFF',
        fontFamily: Fonts.extraBold,
        fontSize: 18,
        letterSpacing: -0.5,
    },
});

