import {
  MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams,
  useRouter } from 'expo-router';
import { StyleSheet,
  ScrollView,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassView, GradientButton, OutlinedButton } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import Text from '@/components/common/LocalizedText';

type WorkshopOrderSummary = {
    orderId?: number;
    vendorName?: string;
    workshopAddress?: string;
    queueNumber?: number;
    peopleBefore?: number;
    waitMinutes?: number;
    showUpAt?: string;
};

export default function OrderSuccessScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { t, language } = useTranslation();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{
        orderId?: string;
        deliveryType?: string;
        queueNumber?: string;
        peopleBefore?: string;
        waitMinutes?: string;
        showUpAt?: string;
        orderGroupId?: string;
        orderIds?: string;
        orders?: string;
    }>();
    const isWorkshopFitting = params.deliveryType === 'workshop_fitting';
    const queueNumber = params.queueNumber ? Number(params.queueNumber) : null;
    const peopleBefore = params.peopleBefore ? Number(params.peopleBefore) : 0;
    const waitMinutes = params.waitMinutes ? Number(params.waitMinutes) : 0;
    const workshopOrders: WorkshopOrderSummary[] = (() => {
        if (!params.orders) return [];
        try {
            const parsed = JSON.parse(String(params.orders));
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    })();

    const formatQueueTime = (value?: string) => {
        if (!value) return '-';
        try {
            return new Date(value).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
            });
        } catch {
            return value;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.bgGradientStart, colors.bgGradientEnd]}
                style={StyleSheet.absoluteFill}
            />

            <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
            <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />

            <ScrollView
                contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + Spacing.xl }]}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View entering={FadeInDown.delay(200)} style={[styles.iconCircle, { backgroundColor: colors.pink + '15' }]}>
                    <MaterialCommunityIcons name="check-decagram" size={64} color={colors.pink} />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400)} style={styles.textSection}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>{t('order.success.title')}</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {isWorkshopFitting && params.orderGroupId
                            ? t('order.success.workshopGroup', { id: params.orderGroupId })
                            : t('order.success.order', { id: params.orderId || '-' })}
                    </Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(600)} style={styles.cardWrapper}>
                    <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.card}>
                        <View style={styles.cardRow}>
                            <MaterialCommunityIcons name="package-variant-closed" size={20} color={colors.pink} />
                            <Text style={[styles.cardText, { color: colors.textPrimary }]}>{t('order.success.processing')}</Text>
                        </View>
                        <Text style={[styles.cardSubtext, { color: colors.textMuted }]}>
                            {isWorkshopFitting
                                ? t(workshopOrders.length === 1 ? 'order.success.queueAssigned' : 'order.success.queuesAssigned')
                                : t('order.success.vendorNotified')}
                        </Text>
                    </GlassView>
                </Animated.View>

                {isWorkshopFitting && workshopOrders.length > 0 ? (
                    <Animated.View entering={FadeInDown.delay(700)} style={styles.cardWrapper}>
                        {workshopOrders.map((item, index) => (
                            <GlassView key={`${item.orderId || index}`} intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.card, index > 0 ? styles.stackedCard : null]}>
                                <View style={styles.cardRow}>
                                    <MaterialCommunityIcons name="store-clock-outline" size={20} color={colors.pink} />
                                    <Text style={[styles.cardText, { color: colors.textPrimary }]}>
                                        {t('order.success.orderVendor', { id: item.orderId || '-', vendor: item.vendorName || t('checkout.workshopFitting') })}
                                    </Text>
                                </View>
                                <Text style={[styles.cardSubtext, { color: colors.textMuted }]}>
                                    {t('order.success.queueDetails', { queue: item.queueNumber || '-', before: item.peopleBefore || 0, minutes: item.waitMinutes || 0 })}
                                </Text>
                                <Text style={[styles.cardSubtext, { color: colors.textMuted }]}>
                                    {t(item.workshopAddress ? 'order.success.showUpAtAddress' : 'order.success.showUpAt', { time: formatQueueTime(item.showUpAt), address: item.workshopAddress || '' })}
                                </Text>
                            </GlassView>
                        ))}
                    </Animated.View>
                ) : null}

                {isWorkshopFitting && workshopOrders.length === 0 && queueNumber ? (
                    <Animated.View entering={FadeInDown.delay(700)} style={styles.cardWrapper}>
                        <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.card}>
                            <View style={styles.cardRow}>
                                <MaterialCommunityIcons name="account-clock-outline" size={20} color={colors.pink} />
                                <Text style={[styles.cardText, { color: colors.textPrimary }]}>{t('order.success.queueNumber', { queue: queueNumber })}</Text>
                            </View>
                            <Text style={[styles.cardSubtext, { color: colors.textMuted }]}>
                                {t('order.success.queueHint', { before: peopleBefore, minutes: waitMinutes, time: formatQueueTime(params.showUpAt) })}
                            </Text>
                        </GlassView>
                    </Animated.View>
                ) : null}

                <Animated.View entering={FadeInDown.delay(800)} style={styles.buttonContainer}>
                    <GradientButton 
                        title="order.success.viewOrders" 
                        onPress={() => router.replace('/my-orders')}
                        icon="receipt-text-outline"
                    />
                    
                    <OutlinedButton 
                        title="common.backToHome" 
                        onPress={() => router.replace('/(tabs)')}
                        style={{ marginTop: Spacing.md }}
                    />
                </Animated.View>
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
        width: 400,
        height: 400,
        borderRadius: 200,
        opacity: 0.4,
    },
    content: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    textSection: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    title: {
        fontFamily: Fonts.extraBold,
        fontSize: 32,
        letterSpacing: -1,
    },
    subtitle: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.md,
        textAlign: 'center',
        marginTop: 8,
        opacity: 0.7,
        lineHeight: 22,
    },
    cardWrapper: {
        width: '100%',
        marginBottom: Spacing.xxl,
    },
    card: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.xxl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: 8,
    },
    cardText: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
    },
    cardSubtext: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        lineHeight: 18,
        opacity: 0.8,
    },
    stackedCard: {
        marginTop: Spacing.md,
    },
    buttonContainer: {
        width: '100%',
        gap: Spacing.md,
    },
});
