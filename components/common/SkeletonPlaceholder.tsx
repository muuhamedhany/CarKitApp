import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius } from '@/constants/theme';

type SkeletonProps = {
    width: number | `${number}%`;
    height: number;
    borderRadius?: number;
    style?: ViewStyle;
};

function SkeletonBone({ width, height, borderRadius = BorderRadius.md, style }: SkeletonProps) {
    const { colors } = useTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: colors.cardBorder,
                    opacity,
                },
                style,
            ]}
        />
    );
}

/** Pre-built skeleton layout matching the vendor dashboard stat cards */
export function DashboardSkeleton() {
    return (
        <View style={skeletonStyles.container}>
            {/* Greeting */}
            <SkeletonBone width={120} height={16} style={{ marginBottom: 6 }} />
            <SkeletonBone width={180} height={28} style={{ marginBottom: 24 }} />

            {/* Stat Cards - 2x2 grid */}
            <View style={skeletonStyles.statsGrid}>
                {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={skeletonStyles.statCard}>
                        <SkeletonBone width={40} height={40} borderRadius={20} />
                        <SkeletonBone width={48} height={24} style={{ marginTop: 10 }} />
                        <SkeletonBone width={72} height={12} style={{ marginTop: 6 }} />
                    </View>
                ))}
            </View>

            {/* Recent Orders */}
            <SkeletonBone width={140} height={20} style={{ marginTop: 28, marginBottom: 12 }} />
            {[1, 2].map((i) => (
                <View key={i} style={skeletonStyles.orderCard}>
                    <View style={skeletonStyles.orderRow}>
                        <SkeletonBone width={120} height={16} />
                        <SkeletonBone width={68} height={24} borderRadius={12} />
                    </View>
                    <SkeletonBone width={'80%' as `${number}%`} height={12} style={{ marginTop: 8 }} />
                    <SkeletonBone width={80} height={12} style={{ marginTop: 6 }} />
                </View>
            ))}

            {/* Top Products */}
            <SkeletonBone width={130} height={20} style={{ marginTop: 28, marginBottom: 12 }} />
            {[1, 2, 3].map((i) => (
                <View key={i} style={skeletonStyles.productRow}>
                    <SkeletonBone width={40} height={40} borderRadius={8} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <SkeletonBone width={'70%' as `${number}%`} height={14} />
                        <SkeletonBone width={50} height={12} style={{ marginTop: 4 }} />
                    </View>
                    <SkeletonBone width={60} height={14} />
                </View>
            ))}
        </View>
    );
}

export { SkeletonBone };

const skeletonStyles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        width: '47%',
        padding: 16,
        alignItems: 'center',
        borderRadius: BorderRadius.lg,
    },
    orderCard: {
        padding: 16,
        marginBottom: 10,
        borderRadius: BorderRadius.lg,
    },
    orderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
});
