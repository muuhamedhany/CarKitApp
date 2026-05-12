import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassView, GradientButton, OutlinedButton } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function OrderSuccessScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ orderId?: string }>();

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
                        Your order #{params.orderId || '-'} has been submitted successfully.
                    </Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(600)} style={styles.cardWrapper}>
                    <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.card}>
                        <View style={styles.cardRow}>
                            <MaterialCommunityIcons name="package-variant-closed" size={20} color={colors.pink} />
                            <Text style={[styles.cardText, { color: colors.textPrimary }]}>Processing your order</Text>
                        </View>
                        <Text style={[styles.cardSubtext, { color: colors.textMuted }]}>
                            Our vendor has been notified and will start preparing your items shortly.
                        </Text>
                    </GlassView>
                </Animated.View>

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
    buttonContainer: {
        width: '100%',
        gap: Spacing.md,
    },
});
