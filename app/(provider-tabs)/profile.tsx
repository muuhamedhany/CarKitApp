import { useCallback, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable, Image,
} from 'react-native';
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

    const [stats, setStats] = useState({ todays_bookings: 0, total_customers: 0, revenue: 0 });

    useFocusEffect(
        useCallback(() => {
            providerService.getDashboard()
                .then(res => { if (res.success && res.data) setStats(res.data.stats as any); })
                .catch(() => {});
        }, [])
    );

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const verificationStatus = (user as any)?.verification_status || 'pending';
    const verBadge = verificationStatus === 'verified'
        ? { label: 'Verified Service Provider', bg: 'rgba(16,185,129,0.1)', fg: '#10B981', icon: 'shield-check' as const }
        : verificationStatus === 'rejected'
            ? { label: 'Rejected', bg: 'rgba(239,68,68,0.1)', fg: '#EF4444', icon: 'shield-off' as const }
            : { label: 'Pending Review', bg: 'rgba(249,115,22,0.1)', fg: '#F97316', icon: 'shield-half-full' as const };

    const menuItems = [
        {
            icon: 'help-circle-outline' as const,
            label: 'Help Center / FAQ',
            bg: 'rgba(99,102,241,0.1)',
            color: '#818CF8',
            onPress: () => {},
        },
        {
            icon: 'headset' as const,
            label: 'Contact Support',
            bg: 'rgba(16,185,129,0.1)',
            color: '#10B981',
            onPress: () => {},
        },
        {
            icon: 'shield-outline' as const,
            label: 'Privacy Policy',
            bg: 'rgba(249,115,22,0.1)',
            color: '#F97316',
            onPress: () => {},
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Profile</Text>

                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <View style={[styles.avatarRing, { borderColor: colors.pink }]}>
                        <View style={[styles.avatarBg, { backgroundColor: colors.card }]}>
                            <Text style={[styles.avatarInitial, { color: colors.textPrimary }]}>
                                {user?.name?.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name}</Text>
                    <View style={[styles.verBadge, { backgroundColor: verBadge.bg }]}>
                        <MaterialCommunityIcons name={verBadge.icon} size={13} color={verBadge.fg} />
                        <Text style={[styles.verBadgeText, { color: verBadge.fg }]}>{verBadge.label}</Text>
                    </View>
                    <Pressable
                        style={[styles.editBtn, { borderColor: colors.pink }]}
                        onPress={() => router.push('/profile/edit')}
                    >
                        <Text style={[styles.editBtnText, { color: colors.pink }]}>Edit Profile</Text>
                    </Pressable>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsRow}>
                    {[
                        { value: stats.total_customers, label: 'Customers' },
                        { value: `${Number(stats.revenue).toLocaleString('en-EG')}`, label: 'Revenue' },
                        { value: stats.todays_bookings, label: "Today's" },
                    ].map((s, i) => (
                        <View
                            key={i}
                            style={[styles.statItem, { borderColor: colors.border }]}
                        >
                            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{s.value}</Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Business Details */}
                <Text style={[styles.sectionHeader, { color: colors.pink }]}>Business Details</Text>
                <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {[
                        { icon: 'domain', label: 'Business Name', value: user?.name || '—' },
                        { icon: 'email-outline', label: 'Email', value: user?.email || '—' },
                        { icon: 'phone-outline', label: 'Phone', value: (user as any)?.phone || '—' },
                        { icon: 'map-marker-outline', label: 'Address', value: (user as any)?.address || '—' },
                    ].map((row, i, arr) => (
                        <View
                            key={row.label}
                            style={[
                                styles.detailRow,
                                { borderBottomColor: colors.border },
                                i < arr.length - 1 && { borderBottomWidth: 1 },
                            ]}
                        >
                            <View style={[styles.detailIcon, { backgroundColor: colors.pinkGlow }]}>
                                <MaterialCommunityIcons name={row.icon as any} size={18} color={colors.pink} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{row.label}</Text>
                                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{row.value}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Support & Legal */}
                <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>SUPPORT & LEGAL</Text>
                <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {menuItems.map((item, i) => (
                        <Pressable
                            key={item.label}
                            style={[
                                styles.menuItem,
                                { borderBottomColor: colors.border },
                                i < menuItems.length - 1 && { borderBottomWidth: 1 },
                            ]}
                            onPress={item.onPress}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                                <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
                            </View>
                            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                        </Pressable>
                    ))}
                </View>

                {/* Logout */}
                <Pressable
                    onPress={handleLogout}
                    style={[styles.logoutBtn, { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.08)' }]}
                >
                    <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
                    <Text style={[styles.logoutText, { color: '#EF4444' }]}>Logout</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: 120 },
    pageTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.xl, textAlign: 'center', marginVertical: Spacing.md },
    avatarSection: { alignItems: 'center', marginBottom: Spacing.lg },
    avatarRing: {
        width: 96, height: 96, borderRadius: 48, borderWidth: 2,
        alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
    },
    avatarBg: {
        width: 84, height: 84, borderRadius: 42,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarInitial: { fontFamily: Fonts.bold, fontSize: 36 },
    name: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, marginBottom: 6 },
    verBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full, marginBottom: Spacing.md,
    },
    verBadgeText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
    editBtn: {
        borderWidth: 1.5, borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.xl, paddingVertical: 8,
    },
    editBtnText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md },
    statsRow: {
        flexDirection: 'row', marginBottom: Spacing.lg,
    },
    statItem: {
        flex: 1, alignItems: 'center', paddingVertical: Spacing.md,
        borderRightWidth: 1,
    },
    statValue: { fontFamily: Fonts.bold, fontSize: FontSizes.lg },
    statLabel: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginTop: 2 },
    sectionHeader: {
        fontFamily: Fonts.semiBold, fontSize: FontSizes.sm,
        letterSpacing: 0.5, marginBottom: Spacing.sm, marginTop: Spacing.sm,
    },
    detailsCard: { borderRadius: BorderRadius.xl, borderWidth: 1, overflow: 'hidden', marginBottom: Spacing.lg },
    detailRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
    detailIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    detailLabel: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginBottom: 2 },
    detailValue: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
    menuCard: { borderRadius: BorderRadius.xl, borderWidth: 1, overflow: 'hidden', marginBottom: Spacing.lg },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
    menuIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    menuLabel: { flex: 1, fontFamily: Fonts.medium, fontSize: FontSizes.md },
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: Spacing.sm, borderWidth: 1.5, borderRadius: BorderRadius.xl,
        paddingVertical: Spacing.md,
    },
    logoutText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md },
});
