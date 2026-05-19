import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassView, GradientButton, OutlinedButton } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

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
            return new Date(value).toLocaleString('en-US', {
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

            <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
                <Animated.View entering={FadeInDown.delay(200)} style={[styles.iconCircle, { backgroundColor: colors.pink + '15' }]}>
                    <MaterialCommunityIcons name="check-decagram" size={64} color={colors.pink} />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400)} style={styles.textSection}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>Order Placed!</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {isWorkshopFitting && params.orderGroupId
                            ? `Your workshop order group #${params.orderGroupId} has been submitted successfully.`
                            : `Your order #${params.orderId || '-'} has been submitted successfully.`}
                    </Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(600)} style={styles.cardWrapper}>
                    <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.card}>
                        <View style={styles.cardRow}>
                            <MaterialCommunityIcons name="package-variant-closed" size={20} color={colors.pink} />
                            <Text style={[styles.cardText, { color: colors.textPrimary }]}>Processing your order</Text>
                        </View>
                        <Text style={[styles.cardSubtext, { color: colors.textMuted }]}>
                            {isWorkshopFitting
                                ? `Your vendor workshop queue${workshopOrders.length === 1 ? '' : 's'} have been assigned.`
                                : 'Our vendor has been notified and will start preparing your items shortly.'}
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
                                        Order #{item.orderId || '-'} · {item.vendorName || 'Vendor Workshop'}
                                    </Text>
                                </View>
                                <Text style={[styles.cardSubtext, { color: colors.textMuted }]}>
                                    Queue #{item.queueNumber || '-'} · {item.peopleBefore || 0} before you · about {item.waitMinutes || 0} min wait.
                                </Text>
                                <Text style={[styles.cardSubtext, { color: colors.textMuted }]}>
                                    Show up around {formatQueueTime(item.showUpAt)}{item.workshopAddress ? ` at ${item.workshopAddress}` : ''}.
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
                                <Text style={[styles.cardText, { color: colors.textPrimary }]}>Queue #{queueNumber}</Text>
                            </View>
                            <Text style={[styles.cardSubtext, { color: colors.textMuted }]}>
                                {peopleBefore} before you | about {waitMinutes} min wait. Show up around {formatQueueTime(params.showUpAt)}.
                            </Text>
                        </GlassView>
                    </Animated.View>
                ) : null}

                <Animated.View entering={FadeInDown.delay(800)} style={styles.buttonContainer}>
                    <GradientButton 
                        title="View My Orders" 
                        onPress={() => router.replace('/my-orders')}
                        icon="receipt-text-outline"
                    />
                    
                    <OutlinedButton 
                        title="Back to Home" 
                        onPress={() => router.replace('/(tabs)')}
                        style={{ marginTop: Spacing.md }}
                    />
                </Animated.View>
            </View>
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
        flex: 1,
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
