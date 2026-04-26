import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { providerService } from '@/services/api/provider.service';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

export default function ProviderProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { colors } = useTheme();
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
                .catch(() => {});
        }, [])
    );

    const handleLogout = async () => {
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
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>Provider Profile</Text>
                </View>

                <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.avatar, { backgroundColor: colors.pinkGlow }]}>
                        <Text style={[styles.avatarText, { color: colors.pink }]}> 
                            {user?.name?.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name}</Text>
                        <Text style={[styles.email, { color: colors.textMuted }]}>{user?.email}</Text>
                        <View style={[styles.badge, { backgroundColor: verBadge.bg }]}>
                            <MaterialCommunityIcons name={verBadge.icon} size={14} color={verBadge.fg} />
                            <Text style={[styles.badgeText, { color: verBadge.fg }]}>{verBadge.label}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.storeStatsRow}>
                    <View style={[styles.storeStat, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                        <MaterialCommunityIcons name="calendar-check" size={22} color="#6366F1" />
                        <Text style={[styles.storeStatValue, { color: colors.textPrimary }]}>{stats.todays_bookings}</Text>
                        <Text style={[styles.storeStatLabel, { color: colors.textMuted }]}>Today</Text>
                    </View>
                    <View style={[styles.storeStat, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                        <MaterialCommunityIcons name="account-group" size={22} color="#10B981" />
                        <Text style={[styles.storeStatValue, { color: colors.textPrimary }]}>{stats.total_customers}</Text>
                        <Text style={[styles.storeStatLabel, { color: colors.textMuted }]}>Customers</Text>
                    </View>
                    <View style={[styles.storeStat, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                        <MaterialCommunityIcons name="cash-multiple" size={22} color={colors.pink} />
                        <Text style={[styles.storeStatValue, { color: colors.textPrimary }]}>
                            {Number(stats.revenue).toLocaleString('en-EG')}
                        </Text>
                        <Text style={[styles.storeStatLabel, { color: colors.textMuted }]}>Revenue</Text>
                    </View>
                </View>

                <View style={[styles.infoGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.infoItem}>
                        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Role</Text>
                        <Text style={[styles.infoValue, { color: colors.textPrimary }]}>Service Provider</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Provider ID</Text>
                        <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{(user as any)?.provider_id ?? 'N/A'}</Text>
                    </View>
                </View>

                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Pressable
                        style={[styles.menuItem, { borderBottomColor: colors.itemSeparator }]}
                        onPress={() => router.push('/profile/edit')}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(233, 30, 140, 0.1)' }]}>
                            <MaterialCommunityIcons name="account-edit" size={22} color={colors.pink} />
                        </View>
                        <Text style={[styles.menuText, { color: colors.textPrimary }]}>Edit Personal Info</Text>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
                    </Pressable>

                    <Pressable
                        style={[styles.menuItem, { borderBottomColor: colors.itemSeparator }]}
                        onPress={() => router.push('/settings')}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                            <MaterialCommunityIcons name="wrench-cog" size={22} color="#6366F1" />
                        </View>
                        <Text style={[styles.menuText, { color: colors.textPrimary }]}>Service Settings</Text>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
                    </Pressable>

                    <Pressable
                        style={[styles.menuItem, { borderBottomColor: colors.itemSeparator }]}
                        onPress={() => router.push('/support')}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <MaterialCommunityIcons name="lifebuoy" size={22} color="#10B981" />
                        </View>
                        <Text style={[styles.menuText, { color: colors.textPrimary }]}>Support</Text>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
                    </Pressable>

                    <Pressable style={styles.menuItemLast} onPress={handleLogout}>
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                            <MaterialCommunityIcons name="logout" size={22} color="#EF4444" />
                        </View>
                        <Text style={[styles.menuText, { color: '#EF4444' }]}>Log Out</Text>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.md,
        paddingBottom: 150,
    },
    header: {
        marginBottom: Spacing.md,
    },
    title: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.xxl,
    },
    profileCard: {
        flexDirection: 'row',
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    infoGrid: {
        flexDirection: 'row',
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        gap: Spacing.md,
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
