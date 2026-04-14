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
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { useCart } from '@/contexts/CartContext';
import { addressService, orderService, paymentService, PaymentMethod } from '@/services/api';
import { CenteredHeader } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';

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
            <CenteredHeader title="Checkout" titleColor={colors.textPrimary} />

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Shipping Address</Text>

                {loadingAddresses ? (
                    <ActivityIndicator size="small" color={colors.pink} />
                ) : addresses.length === 0 ? (
                    <Pressable
                        style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}
                        onPress={() => router.push('/profile/addresses')}
                    >
                        <MaterialCommunityIcons name="map-marker-plus-outline" size={20} color={colors.pink} />
                        <Text style={[styles.infoText, { color: colors.textSecondary }]}>No address found. Tap to add one.</Text>
                    </Pressable>
                ) : (
                    addresses.map((address) => {
                        const active = selectedAddressId === address.address_id;
                        return (
                            <Pressable
                                key={address.address_id}
                                style={[
                                    styles.addressCard,
                                    {
                                        backgroundColor: colors.backgroundSecondary,
                                        borderColor: active ? colors.pink : colors.cardBorder,
                                    },
                                ]}
                                onPress={() => setSelectedAddressId(address.address_id)}
                            >
                                <View style={styles.addressHeader}>
                                    <Text style={[styles.addressTitle, { color: colors.textPrimary }]}>
                                        {address.title || 'Address'}
                                    </Text>
                                    {active ? <MaterialCommunityIcons name="check-circle" size={18} color={colors.pink} /> : null}
                                </View>
                                <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                                    {address.street || ''}{address.street && address.city ? ', ' : ''}{address.city || ''}
                                </Text>
                            </Pressable>
                        );
                    })
                )}

                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.xl }]}>Payment Method</Text>

                {paymentMethods.map((method) => {
                    const active = paymentMethod === method.value;
                    return (
                        <Pressable
                            key={method.value}
                            style={[
                                styles.methodCard,
                                {
                                    backgroundColor: colors.backgroundSecondary,
                                    borderColor: active ? colors.pink : colors.cardBorder,
                                },
                            ]}
                            onPress={() => setPaymentMethod(method.value)}
                        >
                            <View style={styles.methodLeft}>
                                <MaterialCommunityIcons name={method.icon as any} size={20} color={active ? colors.pink : colors.textMuted} />
                                <Text style={[styles.methodLabel, { color: colors.textPrimary }]}>{method.label}</Text>
                            </View>
                            {active ? <MaterialCommunityIcons name="radiobox-marked" size={18} color={colors.pink} /> : <MaterialCommunityIcons name="radiobox-blank" size={18} color={colors.textMuted} />}
                        </Pressable>
                    );
                })}

                {(paymentMethod === 'instapay' || paymentMethod === 'vodafone_cash') ? (
                    <View style={[styles.paymentDetailsCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.paymentDetailsTitle, { color: colors.textPrimary }]}>Transfer Details</Text>
                        <Text style={[styles.paymentDetailsText, { color: colors.textSecondary }]}>Send to: {paymentMethod === 'instapay' ? INSTAPAY_USERNAME : VODAFONE_CASH_NUMBER}</Text>

                        <Pressable
                            style={[styles.uploadButton, { borderColor: colors.pink }]}
                            onPress={handlePickTransferScreenshot}
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
                            <Text style={[styles.uploadHint, { color: colors.textMuted }]}>Required to unlock Place Order.</Text>
                        )}
                    </View>
                ) : null}

                {paymentMethod === 'credit_card' ? (
                    <View style={[styles.paymentDetailsCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.paymentDetailsTitle, { color: colors.textPrimary }]}>Card Details</Text>
                        <TextInput
                            value={cardHolderName}
                            onChangeText={setCardHolderName}
                            placeholder="Card holder name"
                            placeholderTextColor={colors.textMuted}
                            style={[styles.input, { color: colors.textPrimary, borderColor: colors.cardBorder, backgroundColor: colors.background }]}
                        />
                        <TextInput
                            value={cardNumber}
                            onChangeText={setCardNumber}
                            placeholder="Card number"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="number-pad"
                            style={[styles.input, { color: colors.textPrimary, borderColor: colors.cardBorder, backgroundColor: colors.background }]}
                        />
                        <View style={styles.rowInputs}>
                            <TextInput
                                value={cardExpiry}
                                onChangeText={setCardExpiry}
                                placeholder="MM/YY"
                                placeholderTextColor={colors.textMuted}
                                style={[styles.input, styles.halfInput, { color: colors.textPrimary, borderColor: colors.cardBorder, backgroundColor: colors.background }]}
                            />
                            <TextInput
                                value={cardCvv}
                                onChangeText={setCardCvv}
                                placeholder="CVV"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="number-pad"
                                secureTextEntry
                                style={[styles.input, styles.halfInput, { color: colors.textPrimary, borderColor: colors.cardBorder, backgroundColor: colors.background }]}
                            />
                        </View>
                        <Text style={[styles.uploadHint, { color: colors.textMuted }]}>Complete all fields to unlock Place Order.</Text>
                    </View>
                ) : null}

                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.xl }]}>Arrival Date</Text>
                <View style={[styles.estimatedCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.estimatedTitle, { color: colors.textPrimary }]}>Estimated Window</Text>
                    <Text style={[styles.estimatedText, { color: colors.textSecondary }]}>From {formatReadableDate(formatDateValue(estimatedStartDate))} to {formatReadableDate(formatDateValue(estimatedEndDate))}</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
                    {deliveryChoices.map((dateValue) => {
                        const selected = preferredDeliveryDate === dateValue;
                        return (
                            <Pressable
                                key={dateValue}
                                style={[
                                    styles.dateChip,
                                    {
                                        backgroundColor: colors.backgroundSecondary,
                                        borderColor: selected ? colors.pink : colors.cardBorder,
                                    },
                                ]}
                                onPress={() => setPreferredDeliveryDate(dateValue)}
                            >
                                <Text style={[styles.dateChipLabel, { color: selected ? colors.pink : colors.textSecondary }]}>Preferred</Text>
                                <Text style={[styles.dateChipValue, { color: colors.textPrimary }]}>{formatReadableDate(dateValue)}</Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>

                <View style={[styles.summaryCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Order Summary</Text>
                    <Text style={[styles.summaryLine, { color: colors.textSecondary }]}>Items: {items.length}</Text>
                    <Text style={[styles.summaryLine, { color: colors.textSecondary }]}>Preferred arrival: {formatReadableDate(preferredDeliveryDate)}</Text>
                    <Text style={[styles.summaryLine, { color: colors.textSecondary }]}>Subtotal: {totalNumber.toFixed(2)} EGP</Text>
                    <Text style={[styles.summaryLine, { color: colors.textSecondary }]}>Shipping: {SHIPPING_FEE.toFixed(2)} EGP</Text>
                    <Text style={[styles.summaryTotal, { color: colors.textPrimary }]}>Total: {totalWithShipping.toFixed(2)} EGP</Text>
                </View>
            </ScrollView>

            <View style={[styles.bottomBar, { borderTopColor: colors.cardBorder, backgroundColor: colors.background }]}>
                <Pressable
                    onPress={handlePlaceOrder}
                    disabled={!canPlaceOrder}
                    style={[styles.placeButton, { backgroundColor: colors.pink, opacity: canPlaceOrder ? 1 : 0.45 }]}
                >
                    {placingOrder ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={styles.placeButtonText}>Place Order</Text>
                    )}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: Spacing.md, paddingBottom: 140 },
    sectionTitle: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
        marginBottom: Spacing.sm,
    },
    infoCard: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
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
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
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
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        marginBottom: Spacing.sm,
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
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginTop: Spacing.xs,
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
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
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
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.sm,
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
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginTop: Spacing.lg,
    },
    estimatedCard: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
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
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        minWidth: 120,
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
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
        marginBottom: Spacing.sm,
    },
    summaryLine: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
    summaryTotal: {
        marginTop: Spacing.sm,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.lg,
    },
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        borderTopWidth: 1,
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.lg,
    },
    placeButton: {
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    placeButtonText: {
        color: '#FFFFFF',
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
    },
});
