import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { providerService } from '@/services/api/provider.service';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GlassView } from '@/components';

export default function ProviderProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const [stats, setStats] = useState({
        todays_bookings: 0,
        total_customers: 0,
        revenue: 0,
    });

    useFocusEffect(
        useCallback(() => {
            providerService
                .getDashboard()
                .then((res) => {
                    if (res.success && res.data) {
                        setStats(res.data.stats as any);
                    }
                })
                .catch(() => { });
        }, [])
    );

    const handleLogout = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await logout();
        router.replace('/login');
    };

    const verificationStatus = (user as any)?.verification_status || 'pending';
    const verBadge =
        verificationStatus === 'verified'
            ? {
                label: 'Verified',
                bg: 'rgba(16,185,129,0.1)',
                fg: '#10B981',
                icon: 'shield-check' as const,
            }
            : verificationStatus === 'rejected'
                ? {
                    label: 'Rejected',
                    bg: 'rgba(239,68,68,0.1)',
                    fg: '#EF4444',
                    icon: 'shield-off' as const,
                }
                : {
                    label: 'Pending Review',
                    bg: 'rgba(249,115,22,0.1)',
                    fg: '#F97316',
                    icon: 'shield-half-full' as const,
                };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.bgGradientStart, colors.bgGradientEnd]}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative Orbs */}
            <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
            <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.md }]} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>Provider Profile</Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(100).duration(800)}>
                    <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.profileCard, { borderColor: colors.cardBorder }]}>
                        <View style={[styles.avatar, { backgroundColor: colors.pinkGlow }]}>
                            <Text style={[styles.avatarText, { color: colors.pink }]}>
                                {user?.name?.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.userInfo}>
                            <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name}</Text>
                            <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
                            <View style={[styles.badge, { backgroundColor: verBadge.bg }]}>
                                <MaterialCommunityIcons name={verBadge.icon} size={14} color={verBadge.fg} />
                                <Text style={[styles.badgeText, { color: verBadge.fg }]}>{verBadge.label}</Text>
                            </View>
                        </View>
                    </GlassView>
                </Animated.View>

                <View style={styles.storeStatsRow}>
                    {[
                        { label: 'Today', value: stats.todays_bookings, icon: 'calendar-check' as const, color: '#6366F1' },
                        { label: 'Customers', value: stats.total_customers, icon: 'account-group' as const, color: '#10B981' },
                        { label: 'Revenue', value: Number(stats.revenue).toLocaleString('en-EG'), icon: 'cash-multiple' as const, color: colors.pink },
                    ].map((stat, index) => (
                        <Animated.View 
                            key={stat.label} 
                            entering={FadeInDown.delay(200 + index * 100).duration(800)}
                            style={{ flex: 1 }}
                        >
                            <GlassView 
                                intensity={isDark ? 20 : 40} 
                                tint={isDark ? 'dark' : 'light'} 
                                style={[styles.storeStat, { borderColor: colors.cardBorder }]}
                            >
                                <MaterialCommunityIcons name={stat.icon} size={22} color={stat.color} />
                                <Text style={[styles.storeStatValue, { color: colors.textPrimary }]} numberOfLines={1}>{stat.value}</Text>
                                <Text style={[styles.storeStatLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                            </GlassView>
                        </Animated.View>
                    ))}
                </View>

                <Animated.View entering={FadeInDown.delay(500).duration(800)}>
                    <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.infoGrid, { borderColor: colors.cardBorder }]}>
                        <View style={styles.infoItem}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Role</Text>
                            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>Service Provider</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Provider ID</Text>
                            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{(user as any)?.provider_id ?? 'N/A'}</Text>
                        </View>
                    </GlassView>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(600).duration(800)}>
                    <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.section, { borderColor: colors.cardBorder }]}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.menuItem, 
                                { borderBottomColor: colors.cardBorder, backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent' }
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/profile/edit');
                            }}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: 'rgba(233, 30, 140, 0.1)' }]}>
                                <MaterialCommunityIcons name="account-edit" size={22} color={colors.pink} />
                            </View>
                            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Edit Personal Info</Text>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.menuItem, 
                                { borderBottomColor: colors.cardBorder, backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent' }
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/settings');
                            }}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                                <MaterialCommunityIcons name="wrench-cog" size={22} color="#6366F1" />
                            </View>
                            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Service Settings</Text>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.menuItem, 
                                { borderBottomColor: colors.cardBorder, backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent' }
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/support');
                            }}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <MaterialCommunityIcons name="lifebuoy" size={22} color="#10B981" />
                            </View>
                            <Text style={[styles.menuText, { color: colors.textPrimary }]}>Support</Text>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
                        </Pressable>

                        <Pressable 
                            style={({ pressed }) => [
                                styles.menuItemLast, 
                                { backgroundColor: pressed ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }
                            ]} 
                            onPress={handleLogout}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                <MaterialCommunityIcons name="logout" size={22} color="#EF4444" />
                            </View>
                            <Text style={[styles.menuText, { color: '#EF4444' }]}>Log Out</Text>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
                        </Pressable>
                    </GlassView>
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
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.5,
    },
    scrollContent: {
        padding: Spacing.md,
        paddingBottom: 150,
    },
    header: {
        marginBottom: Spacing.lg,
    },
    title: {
        fontFamily: Fonts.extraBold,
        fontSize: 32,
        letterSpacing: -1,
    },
    profileCard: {
        flexDirection: 'row',
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: Spacing.md,
        overflow: 'hidden',
        ...Shadows.md,
    },
    infoGrid: {
        flexDirection: 'row',
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        gap: Spacing.md,
        overflow: 'hidden',
        ...Shadows.md,
    },
    infoItem: {
        flex: 1,
    },
    infoLabel: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    infoValue: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.xxl,
    },
    userInfo: {
        marginLeft: Spacing.md,
        flex: 1,
    },
    name: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.lg,
    },
    email: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.sm,
        marginBottom: Spacing.xs,
    },
    badge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        marginTop: Spacing.xs,
    },
    badgeText: {
        fontFamily: Fonts.semiBold,
        fontSize: 12,
    },
    section: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        overflow: 'hidden',
        ...Shadows.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
    },
    menuItemLast: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuText: {
        flex: 1,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.md,
        marginLeft: Spacing.md,
    },
    storeStatsRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    storeStat: {
        flex: 1,
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        gap: 4,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    storeStatValue: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.lg,
    },
    storeStatLabel: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.xs,
    },
});

