import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';

export default function OrderSuccessScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const params = useLocalSearchParams<{ orderId?: string }>();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <MaterialCommunityIcons name="check-decagram" size={72} color={colors.pink} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>Order Placed</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Your order #{params.orderId || '-'} has been submitted successfully.
            </Text>

            <Pressable style={[styles.button, { backgroundColor: colors.pink }]} onPress={() => router.replace('/my-orders')}>
                <Text style={styles.buttonText}>View My Orders</Text>
            </Pressable>

            <Pressable style={[styles.secondary, { borderColor: colors.cardBorder }]} onPress={() => router.replace('/(tabs)')}>
                <Text style={[styles.secondaryText, { color: colors.textPrimary }]}>Back to Home</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
    },
    title: {
        marginTop: Spacing.md,
        fontFamily: Fonts.extraBold,
        fontSize: FontSizes.xxl,
    },
    subtitle: {
        marginTop: Spacing.sm,
        textAlign: 'center',
        fontFamily: Fonts.medium,
        fontSize: FontSizes.sm,
    },
    button: {
        marginTop: Spacing.xl,
        borderRadius: BorderRadius.md,
        minHeight: 48,
        minWidth: 210,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
    },
    buttonText: {
        color: '#FFFFFF',
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
    },
    secondary: {
        marginTop: Spacing.md,
        borderRadius: BorderRadius.md,
        minHeight: 44,
        minWidth: 210,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    secondaryText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.sm,
    },
});
