import { CenteredHeader, GlassView } from '@/components';
import { BorderRadius, Fonts, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

type PaymentCard = {
    id: string;
    type: 'visa' | 'mastercard';
    last4: string;
    expiry: string;
    holder: string;
};

export default function PaymentsScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const [cards] = useState<PaymentCard[]>([
        { id: '1', type: 'visa', last4: '4242', expiry: '12/25', holder: 'John Doe' },
        { id: '2', type: 'mastercard', last4: '8812', expiry: '09/24', holder: 'John Doe' },
    ]);

    const renderCard = (card: PaymentCard, index: number) => (
        <Animated.View
            key={card.id}
            entering={FadeInDown.delay(200 + index * 100).springify()}
            layout={Layout.springify()}
            style={styles.cardWrapper}
        >
            <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={[styles.card, { borderColor: colors.cardBorder }]}>
                <LinearGradient
                    colors={card.type === 'visa' ? ['#2563EB', '#1D4ED8'] : ['#EB5757', '#C20D0D']}
                    style={styles.cardTypeBadge}
                >
                    <MaterialCommunityIcons
                        name="credit-card"
                        size={20}
                        color="white"
                    />
                </LinearGradient>

                <View style={styles.cardMain}>
                    <Text style={[styles.cardNumber, { color: colors.textPrimary }]}>
                        ••••  ••••  ••••  {card.last4}
                    </Text>

                    <View style={styles.cardFooter}>
                        <View>
                            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>HOLDER</Text>
                            <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{card.holder}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>EXPIRY</Text>
                            <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{card.expiry}</Text>
                        </View>
                    </View>
                </View>

                <Pressable
                    style={[styles.removeBtn, { backgroundColor: colors.error + '15' }]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        // handle remove logic here
                    }}
                >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                </Pressable>
            </GlassView>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.bgGradientStart, colors.bgGradientEnd]}
                style={StyleSheet.absoluteFill}
            />

            <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
            <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />

            <CenteredHeader title="Payments" titleColor={colors.textPrimary} />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SAVED CARDS</Text>

                {cards.length === 0 ? (
                    <Animated.View entering={FadeInDown} style={styles.emptyContainer}>
                        <GlassView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.emptyIconCircle}>
                            <MaterialCommunityIcons name="credit-card-off-outline" size={56} color={colors.textMuted} />
                        </GlassView>
                        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No cards saved</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            Add a payment method to speed up your checkout process.
                        </Text>
                    </Animated.View>
                ) : (
                    <View style={styles.cardList}>
                        {cards.map(renderCard)}
                    </View>
                )}

                <Pressable
                    style={({ pressed }) => [
                        styles.addBtn,
                        { transform: [{ scale: pressed ? 0.98 : 1 }] }
                    ]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        // Open add card flow
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

                <View style={styles.divider} />

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>OTHER METHODS</Text>

                <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.methodItem, { borderColor: colors.cardBorder }]}>
                    <View style={[styles.methodIcon, { backgroundColor: '#4CAF5020' }]}>
                        <MaterialCommunityIcons name="bank-transfer" size={24} color="#4CAF50" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.methodLabelText, { color: colors.textPrimary }]}>InstaPay</Text>
                        <Text style={[styles.methodSubtitle, { color: colors.textSecondary }]}>carkit.pay</Text>
                    </View>
                    <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                </GlassView>

                <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.methodItem, { borderColor: colors.cardBorder, marginTop: Spacing.md }]}>
                    <View style={[styles.methodIcon, { backgroundColor: '#E11D4820' }]}>
                        <MaterialCommunityIcons name="wallet-outline" size={24} color="#E11D48" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.methodLabelText, { color: colors.textPrimary }]}>Vodafone Cash</Text>
                        <Text style={[styles.methodSubtitle, { color: colors.textSecondary }]}>01004899835</Text>
                    </View>
                    <MaterialCommunityIcons name="check-circle" size={20} color="#E11D48" />
                </GlassView>

                <View style={{ height: 100 }} />
            </ScrollView>
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
    content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
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
    removeBtn: {
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
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 40,
    },
    methodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        gap: Spacing.md,
    },
    methodIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    methodLabelText: {
        fontFamily: Fonts.bold,
        fontSize: 16,
    },
    methodSubtitle: {
        fontFamily: Fonts.medium,
        fontSize: 13,
        opacity: 0.6,
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
});
