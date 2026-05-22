import {
  CenteredHeader,
  FormInput,
  GlassView } from '@/components';
import { BorderRadius,
  FontSizes,
  Fonts,
  Shadows,
  Spacing } from '@/constants/theme';
import { useCart } from '@/contexts/CartContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { addressService,
  orderService,
  paymentService } from '@/services/api';
import { PaymentMethod,
  SavedPaymentMethod } from '@/services/api/payment.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect,
  useRouter } from 'expo-router';
import { useCallback,
  useMemo,
  useState } from 'react';
import {
    ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '@/components/common/LocalizedText';

type Address = {
    address_id: number;
    title?: string;
    street?: string;
    city?: string;
};

const paymentMethods: { label: string; value: PaymentMethod; icon: string }[] = [
    { label: 'Cash on Delivery', value: 'cash_on_delivery', icon: 'cash' },
    { label: 'Credit Card', value: 'credit_card', icon: 'credit-card-outline' },
];

const MIN_DELIVERY_DAYS = 5;
const DATE_CHOICES_COUNT = 4;
const SHIPPING_FEE = 50;
const WORKSHOP_SERVICE_FEE = 70;

const addDays = (baseDate: Date, days: number) => {
    const date = new Date(baseDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date;
};

const formatDateValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatReadableDate = (isoDate: string, language: 'en' | 'ar' = 'en') => {
    try {
        const date = new Date(`${isoDate}T00:00:00`);
        return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
        return isoDate;
    }
};

const cardBrandLabel = (brand: string) => {
    if (brand === 'mastercard') return 'Mastercard';
    if (brand === 'visa') return 'Visa';
    if (brand === 'amex') return 'Amex';
    if (brand === 'discover') return 'Discover';
    return 'Card';
};

export default function CheckoutScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const { showToast } = useToast();
    const { items, total, fetchCart } = useCart();
    const { t, language } = useTranslation();

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [loadingSavedCards, setLoadingSavedCards] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [savedCards, setSavedCards] = useState<SavedPaymentMethod[]>([]);
    const [selectedSavedCardId, setSelectedSavedCardId] = useState<number | null>(null);
    const [useNewCard, setUseNewCard] = useState(false);
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

    const [deliveryType, setDeliveryType] = useState<'home_delivery' | 'workshop_fitting'>('home_delivery');

    const deliveryOptions = [
        { id: 'home_delivery', label: t('checkout.homeDelivery'), icon: 'truck-delivery-outline', subtitle: t('checkout.homeDeliverySub') },
        { id: 'workshop_fitting', label: t('checkout.workshopFitting'), icon: 'wrench-outline', subtitle: t('checkout.workshopFittingSub') }
    ];

    const totalNumber = useMemo(() => Number(total) || 0, [total]);
    const workshopVendorGroups = useMemo(() => {
        const groups = new Map<number, {
            vendorId: number;
            vendorName: string;
            workshopAddress?: string | null;
            installationMinutes?: number | null;
            itemCount: number;
            subtotal: number;
        }>();

        for (const item of items) {
            const vendorId = Number(item.vendor_id_fk || 0);
            if (!vendorId) continue;
            if (!groups.has(vendorId)) {
                groups.set(vendorId, {
                    vendorId,
                    vendorName: item.vendor_name || 'Vendor Workshop',
                    workshopAddress: item.workshop_address,
                    installationMinutes: item.installation_duration_minutes,
                    itemCount: 0,
                    subtotal: 0,
                });
            }

            const group = groups.get(vendorId)!;
            group.itemCount += item.quantity;
            group.subtotal += item.quantity * (Number(item.price) || 0);
        }

        return Array.from(groups.values());
    }, [items]);
    const workshopVendorCount = workshopVendorGroups.length;
    const hasWorkshopVendorGap = useMemo(
        () => deliveryType === 'workshop_fitting' && items.some((item) => !item.vendor_id_fk),
        [deliveryType, items]
    );
    const shippingCharge = useMemo(() => {
        return deliveryType === 'home_delivery' ? SHIPPING_FEE : 0;
    }, [deliveryType]);

    const serviceCharge = useMemo(() => {
        return deliveryType === 'workshop_fitting' ? WORKSHOP_SERVICE_FEE * workshopVendorCount : 0;
    }, [deliveryType, workshopVendorCount]);

    const totalWithShipping = useMemo(() => {
        return totalNumber + shippingCharge + serviceCharge;
    }, [totalNumber, shippingCharge, serviceCharge]);
    const cardNumberDigits = useMemo(() => cardNumber.replace(/\s/g, ''), [cardNumber]);

    const isValidExpiry = (value: string) => {
        const match = value.match(/^(\d{2})\/(\d{2})$/);
        if (!match) return false;
        const month = Number(match[1]);
        return month >= 1 && month <= 12;
    };

    const canSubmitPaymentDetails = useMemo(() => {
        if (paymentMethod === 'cash_on_delivery') return true;

        if (paymentMethod === 'credit_card') {
            if (!useNewCard && selectedSavedCardId) return true;
            const hasValidCardNumber = cardNumberDigits.length >= 13 && cardNumberDigits.length <= 19;
            const hasValidCvv = /^\d{3,4}$/.test(cardCvv.trim());
            return cardHolderName.trim().length > 2 && hasValidCardNumber && isValidExpiry(cardExpiry.trim()) && hasValidCvv;
        }

        return false;
    }, [paymentMethod, useNewCard, selectedSavedCardId, cardHolderName, cardNumberDigits, cardExpiry, cardCvv]);

    const canPlaceOrder = useMemo(() => {
        const hasAddressIfRequired = deliveryType === 'home_delivery' ? Boolean(selectedAddressId) : true;
        const hasWorkshopDestinations = deliveryType === 'workshop_fitting' ? workshopVendorCount > 0 && !hasWorkshopVendorGap : true;
        return items.length > 0 && hasAddressIfRequired && hasWorkshopDestinations && canSubmitPaymentDetails && !placingOrder;
    }, [items.length, deliveryType, selectedAddressId, workshopVendorCount, hasWorkshopVendorGap, canSubmitPaymentDetails, placingOrder]);

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

    const loadSavedCards = useCallback(async () => {
        try {
            setLoadingSavedCards(true);
            const res = await paymentService.getPaymentMethods();
            if (res.success && Array.isArray(res.data)) {
                const methods = res.data;
                setSavedCards(methods);
                const defaultCard = methods.find((item) => item.is_default);
                setSelectedSavedCardId(defaultCard?.payment_method_id || methods[0]?.payment_method_id || null);
            }
        } catch {
            showToast('error', 'Payment Error', 'Could not load saved cards.');
        } finally {
            setLoadingSavedCards(false);
        }
    }, [showToast]);

    useFocusEffect(
        useCallback(() => {
            loadAddresses();
            loadSavedCards();
        }, [loadAddresses, loadSavedCards])
    );

    const handlePlaceOrder = async () => {
        if (items.length === 0) {
            showToast('warning', 'Empty Cart', 'Add items before checkout.');
            return;
        }

        if (deliveryType === 'home_delivery' && !selectedAddressId) {
            showToast('warning', 'Address Required', 'Please add/select a shipping address.');
            return;
        }

        if (deliveryType === 'workshop_fitting' && hasWorkshopVendorGap) {
            showToast('warning', 'Vendor Workshop Required', 'Every workshop fitting item must be assigned to a vendor workshop.');
            return;
        }

        if (!canSubmitPaymentDetails) {
            if (paymentMethod === 'credit_card') {
                showToast('warning', 'Card Details Required', 'Select a saved card or complete valid credit card details.');
                return;
            }
        }

        try {
            setPlacingOrder(true);

            const orderRes = await orderService.createOrder({
                shipping_address_id: deliveryType === 'home_delivery' ? (selectedAddressId ?? undefined) : undefined,
                preferred_delivery_date: preferredDeliveryDate,
                delivery_type: deliveryType,
            });

            if (!orderRes.success || !orderRes.data) {
                showToast('error', 'Order Failed', orderRes.message || 'Could not place order.');
                return;
            }

            const workshopOrders = Array.isArray(orderRes.data.orders) ? orderRes.data.orders : [];
            const paymentRes = await paymentService.createPayment({
                order_id: deliveryType === 'workshop_fitting' ? undefined : orderRes.data.order_id,
                order_group_id: deliveryType === 'workshop_fitting' ? (orderRes.data.order_group_id || undefined) : undefined,
                method: paymentMethod,
                amount: totalWithShipping,
            });

            if (!paymentRes.success) {
                showToast('error', 'Payment Failed', paymentRes.message || 'Order created, payment failed.');
                router.replace({
                    pathname: '/order-failure' as any,
                    params: {
                        orderId: String(orderRes.data.order_id),
                        orderGroupId: orderRes.data.order_group_id ? String(orderRes.data.order_group_id) : undefined,
                        amount: String(totalWithShipping),
                        method: paymentMethod,
                    },
                });
                return;
            }

            await fetchCart();
            if (deliveryType === 'workshop_fitting' && workshopOrders.length > 0) {
                router.replace({
                    pathname: '/order-success' as any,
                    params: {
                        orderGroupId: orderRes.data.order_group_id ? String(orderRes.data.order_group_id) : undefined,
                        orderIds: workshopOrders.map((item) => item.order_id).join(','),
                        deliveryType: 'workshop_fitting',
                        orders: JSON.stringify(workshopOrders.map((item) => ({
                            orderId: item.order_id,
                            vendorName: item.queue?.center_name || item.vendor_name || 'Vendor Workshop',
                            workshopAddress: item.queue?.center_address || item.workshop_address || '',
                            queueNumber: item.queue?.queue_number,
                            peopleBefore: item.queue?.people_before,
                            waitMinutes: item.queue?.estimated_wait_minutes,
                            showUpAt: item.queue?.show_up_at,
                        }))),
                    },
                });
                return;
            }

            router.replace({
                pathname: '/order-success' as any,
                params: {
                    orderId: String(orderRes.data.order_id),
                    deliveryType: orderRes.data.delivery_type || deliveryType,
                    queueNumber: orderRes.data.queue?.queue_number ? String(orderRes.data.queue.queue_number) : undefined,
                    peopleBefore: orderRes.data.queue?.people_before !== undefined ? String(orderRes.data.queue.people_before) : undefined,
                    waitMinutes: orderRes.data.queue?.estimated_wait_minutes !== undefined ? String(orderRes.data.queue.estimated_wait_minutes) : undefined,
                    showUpAt: orderRes.data.queue?.show_up_at || undefined,
                },
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


                {/* Section: Fulfillment Method */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderLeft}>
                            <View style={[styles.sectionIcon, { backgroundColor: colors.pink + '15' }]}>
                                <MaterialCommunityIcons name="layers-outline" size={20} color={colors.pink} />
                            </View>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('checkout.fulfillmentMethod')}</Text>
                        </View>
                    </View>

                    <View style={styles.deliverySelectorRow}>
                        {deliveryOptions.map((opt) => {
                            const active = deliveryType === opt.id;
                            return (
                                <Pressable
                                    key={opt.id}
                                    style={({ pressed }) => [
                                        styles.deliveryOptionCard,
                                        {
                                            borderColor: active ? colors.pink : colors.cardBorder,
                                            backgroundColor: active ? colors.pink + '10' : 'transparent',
                                            opacity: pressed ? 0.8 : 1,
                                        }
                                    ]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                        setDeliveryType(opt.id as any);
                                    }}
                                >
                                    <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.deliveryOptionBlur}>
                                        <MaterialCommunityIcons
                                            name={opt.icon as any}
                                            size={22}
                                            color={active ? colors.pink : colors.textSecondary}
                                        />
                                        <Text style={[styles.deliveryOptionLabel, { color: colors.textPrimary }]}>
                                            {opt.label}
                                        </Text>
                                        <Text style={[styles.deliveryOptionSub, { color: colors.textSecondary }]}>
                                            {opt.subtitle}
                                        </Text>
                                        {active && (
                                            <View style={styles.deliveryActiveDot}>
                                                <MaterialCommunityIcons name="check-circle" size={16} color={colors.pink} />
                                            </View>
                                        )}
                                    </GlassView>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>


                {deliveryType === 'home_delivery' ? (
                    /* Section: Shipping Address */
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <View style={styles.sectionHeaderLeft}>
                                <View style={[styles.sectionIcon, { backgroundColor: colors.pink + '15' }]}>
                                    <MaterialCommunityIcons name="truck-delivery-outline" size={20} color={colors.pink} />
                                </View>
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('checkout.shippingAddress')}</Text>
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
                                        <Text style={[styles.infoText, { color: colors.textSecondary }]}>{t('checkout.noAddress')}</Text>
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
                                                        {address.title || t('checkout.address')}
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
                ) : (
                    /* Section: Workshop Fitting Details */
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <View style={styles.sectionHeaderLeft}>
                                <View style={[styles.sectionIcon, { backgroundColor: '#10B981' + '15' }]}>
                                    <MaterialCommunityIcons name="wrench-outline" size={20} color="#10B981" />
                                </View>
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('checkout.workshopFitting')}</Text>
                            </View>
                        </View>

                        {hasWorkshopVendorGap ? (
                            <Text style={[styles.workshopDetail, { color: colors.pink }]}>
                                {t('checkout.workshopMissing')}
                            </Text>
                        ) : null}

                        {workshopVendorGroups.map((group, idx) => (
                            <Animated.View key={group.vendorId} entering={FadeInDown.delay(200 + idx * 60)}>
                                <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.workshopCard, { borderColor: colors.cardBorder }]}>
                                    <View style={styles.workshopHeader}>
                                        <MaterialCommunityIcons name="storefront-outline" size={22} color={colors.pink} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.workshopName, { color: colors.textPrimary }]}>{group.vendorName}</Text>
                                            <Text style={[styles.workshopDetail, { color: colors.textSecondary }]}>
                                                {t(group.itemCount === 1 ? 'checkout.itemForInstall' : 'checkout.itemsForInstall', { count: group.itemCount })}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.workshopLine}>
                                        <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.textSecondary} />
                                        <Text style={[styles.workshopDetail, { color: colors.textSecondary, flex: 1 }]}>
                                            {group.workshopAddress || t('checkout.workshopAddressPending')}
                                        </Text>
                                    </View>
                                    <View style={styles.workshopLine}>
                                        <MaterialCommunityIcons name="timer-outline" size={16} color={colors.textSecondary} />
                                        <Text style={[styles.workshopDetail, { color: colors.textSecondary, flex: 1 }]}>
                                            {t('checkout.estimatedFittingTime', { minutes: group.installationMinutes || 30 })}
                                        </Text>
                                    </View>
                                    <View style={[styles.workshopBadge, { backgroundColor: '#10B981' + '15', borderColor: '#10B981' + '30' }]}>
                                        <MaterialCommunityIcons name="wrench" size={14} color="#10B981" />
                                        <Text style={[styles.workshopBadgeText, { color: '#10B981' }]}>
                                            {t('checkout.fittingFee', { amount: WORKSHOP_SERVICE_FEE.toFixed(2), currency: t('common.currency.egp') })}
                                        </Text>
                                    </View>
                                </GlassView>
                            </Animated.View>
                        ))}
                    </View>
                )}


                {/* Section: Payment */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderLeft}>
                            <View style={[styles.sectionIcon, { backgroundColor: colors.purple + '15' }]}>
                                <MaterialCommunityIcons name="credit-card-outline" size={20} color={colors.purple} />
                            </View>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('checkout.paymentMethod')}</Text>
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
                                        if (method.value !== 'credit_card') {
                                            setUseNewCard(false);
                                        }
                                    }}
                                >
                                    <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.methodBlur}>
                                        <View style={styles.methodLeft}>
                                            <MaterialCommunityIcons name={method.icon as any} size={20} color={active ? colors.pink : colors.textSecondary} />
                                            <Text style={[styles.methodLabel, { color: colors.textPrimary }]}>{t(method.label)}</Text>
                                        </View>
                                        {active ? <MaterialCommunityIcons name="radiobox-marked" size={18} color={colors.pink} /> : <MaterialCommunityIcons name="radiobox-blank" size={18} color={colors.textSecondary} />}
                                    </GlassView>
                                </Pressable>
                            </Animated.View>
                        );
                    })}
                </View>

                {paymentMethod === 'credit_card' ? (
                    <Animated.View entering={FadeInUp}>
                        <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.paymentDetailsCard, { borderColor: colors.cardBorder }]}>
                            <Text style={[styles.paymentDetailsTitle, { color: colors.textPrimary }]}>{t('checkout.cardDetails')}</Text>
                            {loadingSavedCards ? (
                                <ActivityIndicator size="small" color={colors.pink} />
                            ) : savedCards.length > 0 ? (
                                <View style={{ gap: Spacing.sm, marginBottom: Spacing.md }}>
                                    {savedCards.map((card) => {
                                        const active = !useNewCard && selectedSavedCardId === card.payment_method_id;
                                        return (
                                            <Pressable
                                                key={card.payment_method_id}
                                                style={[
                                                    styles.methodCard,
                                                    {
                                                        backgroundColor: active ? colors.pink + '12' : 'transparent',
                                                        borderColor: active ? colors.pink : colors.cardBorder,
                                                        marginBottom: 0,
                                                    },
                                                ]}
                                                onPress={() => {
                                                    setSelectedSavedCardId(card.payment_method_id);
                                                    setUseNewCard(false);
                                                }}
                                            >
                                                <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.methodBlur}>
                                                    <View style={styles.methodLeft}>
                                                        <MaterialCommunityIcons name="credit-card-outline" size={20} color={active ? colors.pink : colors.textSecondary} />
                                                        <Text style={[styles.methodLabel, { color: colors.textPrimary }]}>
                                                            {cardBrandLabel(card.brand)} •••• {card.last4}
                                                        </Text>
                                                    </View>
                                                    {active ? <MaterialCommunityIcons name="radiobox-marked" size={18} color={colors.pink} /> : <MaterialCommunityIcons name="radiobox-blank" size={18} color={colors.textSecondary} />}
                                                </GlassView>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            ) : null}
                            <Pressable
                                style={[
                                    styles.methodCard,
                                    {
                                        backgroundColor: useNewCard ? colors.pink + '12' : 'transparent',
                                        borderColor: useNewCard ? colors.pink : colors.cardBorder,
                                    },
                                ]}
                                onPress={() => setUseNewCard(true)}
                            >
                                <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.methodBlur}>
                                    <View style={styles.methodLeft}>
                                        <MaterialCommunityIcons name="plus-circle-outline" size={20} color={useNewCard ? colors.pink : colors.textSecondary} />
                                        <Text style={[styles.methodLabel, { color: colors.textPrimary }]}>{t('checkout.useNewCard')}</Text>
                                    </View>
                                    {useNewCard ? <MaterialCommunityIcons name="radiobox-marked" size={18} color={colors.pink} /> : <MaterialCommunityIcons name="radiobox-blank" size={18} color={colors.textSecondary} />}
                                </GlassView>
                            </Pressable>
                            {(!savedCards.length || useNewCard) ? (
                                <>
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
                                </>
                            ) : null}
                            <Text style={[styles.uploadHint, { color: colors.textSecondary, opacity: 0.6 }]}>{t('checkout.cardHint')}</Text>
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
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('checkout.arrivalWindow')}</Text>
                        </View>
                    </View>





                    <Animated.View entering={FadeInDown.delay(750)}>
                        <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.estimatedCard, { borderColor: colors.cardBorder }]}>
                            <View style={styles.estimatedHeader}>
                                <MaterialCommunityIcons name="calendar-range" size={20} color={colors.pink} />
                                <Text style={[styles.estimatedTitle, { color: colors.textPrimary }]}>
                                    {t(deliveryType === 'home_delivery' ? 'checkout.estimatedDelivery' : 'checkout.preferredInstallationDay')}
                                </Text>
                            </View>
                            <Text style={[styles.estimatedText, { color: colors.textSecondary }]}>
                                {deliveryType === 'home_delivery'
                                    ? t('checkout.deliveryBetween', { start: formatReadableDate(formatDateValue(estimatedStartDate), language), end: formatReadableDate(formatDateValue(estimatedEndDate), language) })
                                    : t('checkout.workshopQueuesAssigned', { date: formatReadableDate(preferredDeliveryDate, language) })}
                            </Text>
                        </GlassView>
                    </Animated.View>

                    <Text style={[styles.dateSelectionLabel, { color: colors.textSecondary }]}>{t('checkout.selectPreferredDay')}</Text>

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
                                            <Text style={[styles.dateChipLabel, { color: selected ? colors.pink : colors.textSecondary }]}>{t(selected ? 'checkout.selected' : 'checkout.preferred')}</Text>
                                            <Text style={[styles.dateChipValue, { color: colors.textPrimary }]}>{formatReadableDate(dateValue, language)}</Text>
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
                            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>{t('checkout.orderSummary')}</Text>
                            <MaterialCommunityIcons name="receipt-outline" size={24} color={colors.textSecondary} />
                        </View>

                        <View style={styles.summaryTable}>
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('checkout.itemsCount', { count: items.length })}</Text>
                                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{totalNumber.toFixed(2)} {t('common.currency.egp')}</Text>
                            </View>
                            {deliveryType === 'home_delivery' ? (
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('checkout.shipping')}</Text>
                                    <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{shippingCharge.toFixed(2)} {t('common.currency.egp')}</Text>
                                </View>
                            ) : (
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('checkout.fittingService', { count: workshopVendorCount })}</Text>
                                    <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{serviceCharge.toFixed(2)} {t('common.currency.egp')}</Text>
                                </View>
                            )}

                            <View style={styles.divider} />
                            <View style={styles.summaryRow}>
                                <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>{t('order.details.grandTotal')}</Text>
                                <Text
                                    style={[styles.totalValue, { color: colors.pink }]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                >
                                    {totalWithShipping.toFixed(2)} {t('common.currency.egp')}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.deliveryBadge}>
                            <MaterialCommunityIcons name="clock-fast" size={16} color={colors.pink} />
                            <Text style={[styles.deliveryBadgeText, { color: colors.pink }]}>
                                {deliveryType === 'home_delivery'
                                    ? t('checkout.arrivalBy', { date: formatReadableDate(preferredDeliveryDate, language) })
                                    : t(workshopVendorCount === 1 ? 'checkout.queueAssigned' : 'checkout.queuesAssigned', { count: workshopVendorCount })}
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
                                <Text style={styles.placeButtonText}>{t('checkout.placeOrder')}</Text>
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
    deliverySelectorRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.sm,
    },
    deliveryOptionCard: {
        flex: 1,
        borderRadius: BorderRadius.xl,
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    deliveryOptionBlur: {
        padding: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        height: 120,
    },
    deliveryOptionLabel: {
        fontFamily: Fonts.bold,
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    deliveryOptionSub: {
        fontFamily: Fonts.medium,
        fontSize: 10,
        opacity: 0.7,
        marginTop: 4,
        textAlign: 'center',
    },
    deliveryActiveDot: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    workshopCard: {
        borderWidth: 1,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        overflow: 'hidden',
        marginTop: Spacing.sm,
    },
    workshopHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    workshopName: {
        fontFamily: Fonts.bold,
        fontSize: 16,
    },
    workshopDetail: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        marginBottom: Spacing.xs,
        opacity: 0.9,
    },
    workshopLine: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.xs,
        marginBottom: Spacing.xs,
    },
    workshopBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        marginTop: Spacing.md,
    },
    workshopBadgeText: {
        fontFamily: Fonts.bold,
        fontSize: 11,
        flex: 1,
    },
    promoCard: {
        borderWidth: 1,
        borderRadius: 20,
        overflow: 'hidden',
        ...Shadows.sm,
        marginTop: Spacing.sm,
    },
    promoInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    promoApplyBtn: {
        height: 52,
        paddingHorizontal: 22,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    promoApplyBtnText: {
        color: '#FFFFFF',
        fontFamily: Fonts.bold,
        fontSize: 14,
    },
    promoAppliedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
    },
    promoAppliedLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    promoAppliedTitle: {
        fontFamily: Fonts.bold,
        fontSize: 14,
    },
    promoAppliedSubtitle: {
        fontFamily: Fonts.medium,
        fontSize: 12,
        marginTop: 2,
        opacity: 0.8,
    },
    removePromoBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    promoInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        height: 52,
    },
    promoInputIcon: {
        marginRight: Spacing.xs,
    },
    promoTextInput: {
        flex: 1,
        fontSize: 13,
        fontFamily: Fonts.medium,
        height: '100%',
        paddingVertical: 0,
    },
    discountLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    summaryPromoBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
    },
    summaryPromoBadgeText: {
        fontFamily: Fonts.bold,
        fontSize: 10,
        letterSpacing: 0.5,
    },
    discountValueText: {
        fontFamily: Fonts.bold,
        fontSize: 15,
    },
});

