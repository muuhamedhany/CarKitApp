import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { Fonts, Spacing, BorderRadius } from '@/constants/theme';

type TabItem = {
    name: string;
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    iconFilled: keyof typeof MaterialCommunityIcons.glyphMap;
};

const TABS: TabItem[] = [
    { name: 'index', label: 'Dashboard', icon: 'view-dashboard-outline', iconFilled: 'view-dashboard' },
    { name: 'products', label: 'Inventory', icon: 'package-variant-closed', iconFilled: 'package-variant' },
    { name: 'orders', label: 'Orders', icon: 'receipt-text-outline', iconFilled: 'receipt-text' },
    { name: 'profile', label: 'Profile', icon: 'account-outline', iconFilled: 'account' },
];

function TabButton({
    tab,
    isFocused,
    onPress,
}: {
    tab: TabItem;
    isFocused: boolean;
    onPress: () => void;
}) {
    const { colors } = useTheme();
    const focusProgress = useSharedValue(isFocused ? 1 : 0);

    useEffect(() => {
        focusProgress.value = withSpring(isFocused ? 1 : 0, {
            damping: 15,
            stiffness: 150,
        });
    }, [isFocused, focusProgress]);

    const iconAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(focusProgress.value, [0, 1], [1, 1.15]) }],
    }));

    const indicatorAnimatedStyle = useAnimatedStyle(() => ({
        opacity: focusProgress.value,
        transform: [{ scaleX: focusProgress.value }],
    }));

    return (
        <Pressable
            onPress={onPress}
            style={styles.tab}
            android_ripple={{ color: 'rgba(205,66,168,0.12)', borderless: true, radius: 28 }}
        >
            <Animated.View style={iconAnimatedStyle}>
                <MaterialCommunityIcons
                    name={isFocused ? tab.iconFilled : tab.icon}
                    size={22}
                    color={isFocused ? colors.pink : colors.textSecondary}
                />
            </Animated.View>
            <Text
                style={[
                    styles.label,
                    { color: isFocused ? colors.pink : colors.textSecondary },
                    isFocused && styles.labelActive,
                ]}
            >
                {tab.label}
            </Text>
            <Animated.View
                style={[
                    styles.activeIndicator,
                    { backgroundColor: colors.pink },
                    indicatorAnimatedStyle,
                ]}
            />
        </Pressable>
    );
}

export default function VendorTabBar({ state, navigation }: any) {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();

    return (
        <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                {TABS.map((tab, index) => {
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const route = state.routes[index];
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return <TabButton key={tab.name} tab={tab} isFocused={isFocused} onPress={onPress} />;
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
    },
    container: {
        flexDirection: 'row',
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        paddingVertical: 10,
        paddingHorizontal: Spacing.xs,
        width: '100%',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        position: 'relative',
    },
    label: {
        fontFamily: Fonts.medium,
        fontSize: 11,
        marginTop: 2,
    },
    labelActive: {
        fontFamily: Fonts.bold,
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -6,
        height: 3,
        borderRadius: 2,
    },
});