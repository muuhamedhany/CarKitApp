import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator, Alert, Image, Pressable,
    ScrollView, StyleSheet, Text, View, Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { providerService } from '@/services/api/provider.service';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import type { Service } from '@/types/api.types';
import { BorderRadius, Fonts, FontSizes, Spacing } from '@/constants/theme';

const buildStatusBadge = (isActive: boolean) =>
    isActive
        ? { label: 'Enabled', backgroundColor: 'rgba(16,185,129,0.16)', color: '#10B981' }
        : { label: 'Disabled', backgroundColor: 'rgba(239,68,68,0.16)', color: '#EF4444' };

const buildLocationBadge = (type?: string | null) => {
    if (!type) return null;
    const map: Record<string, { label: string; bg: string; fg: string }> = {
        'both':    { label: 'Mobile & In-Shop', bg: 'rgba(129,140,248,0.16)', fg: '#818CF8' },
        'mobile':  { label: 'Mobile Service',   bg: 'rgba(16,185,129,0.16)',  fg: '#10B981' },
        'in-shop': { label: 'In-Shop Only',      bg: 'rgba(249,115,22,0.16)',  fg: '#F97316' },
    };
    return map[type] ?? null;
};

export default function ProviderServiceDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();

    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchService = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await providerService.getServiceById(Number(id));
            if (res.success && res.data) setService(res.data);
            else throw new Error((res as any).message || 'Not found');
        } catch (err: any) {
            showToast('error', 'Error', err.message || 'Failed to load service details.');
            router.back();
        } finally {
            setLoading(false);
        }
    }, [id, router, showToast]);

    useFocusEffect(useCallback(() => { fetchService(); }, [fetchService]));

    // ─── Derived ───────────────────────────────────────────────────────────
    const statusInfo = useMemo(() => buildStatusBadge(service?.is_active ?? true), [service?.is_active]);
    const locationInfo = useMemo(() => buildLocationBadge(service?.location_type), [service?.location_type]);

    const serviceImages = useMemo(
        () => [service?.image_url, service?.image_url_2, service?.image_url_3]
            .filter((u): u is string => Boolean(u)),
        [service?.image_url, service?.image_url_2, service?.image_url_3]
    );

    // ─── Actions ───────────────────────────────────────────────────────────
    const handleToggleStatus = async () => {
        if (!service || saving) return;
        try {
            setSaving(true);
            const res = await providerService.toggleServiceActive(service.service_id);
            if (res.success && res.data) {
                setService(res.data);
                showToast(
                    'success', 'Updated',
                    `Service ${res.data.is_active ? 'enabled' : 'disabled'} successfully.`
                );
            }
        } catch (err: any) {
            showToast('error', 'Error', err.message || 'Failed to update service status.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (!service || saving) return;
        Alert.alert(
            'Delete Service',
            'This will permanently remove this service. Bookings already made will not be affected.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        try {
                            setSaving(true);
                            await providerService.deleteService(service.service_id);
                            showToast('success', 'Deleted', 'Service deleted successfully.');
                            router.replace('/(provider-tabs)/services');
                        } catch (err: any) {
                            showToast('error', 'Error', err.message || 'Failed to delete service.');
                        } finally {
                            setSaving(false);
                        }
                    },
                },
            ]
        );
    };

    // ─── Loading / empty ───────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.pink} />
            </View>
        );
    }

    if (!service) return null;

    const isEnabled = service.is_active;
    const isPending = service.status === 'pending';
    const isRejected = service.status === 'rejected';

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>

            {/* ── Header ── */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerIconButton}>
                    <MaterialCommunityIcons name="chevron-left" size={30} color={colors.textPrimary} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Service details</Text>
                <View style={styles.headerIconSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* ── Pending / Rejected banner ── */}
                {isPending && (
                    <View style={styles.pendingBanner}>
                        <MaterialCommunityIcons name="clock-outline" size={18} color="#F59E0B" />
                        <Text style={styles.pendingBannerText}>
                            Pending Admin Approval — this service is not visible to customers yet.
                        </Text>
                    </View>
                )}
                {isRejected && (
                    <View style={[styles.pendingBanner, styles.rejectedBanner]}>
                        <MaterialCommunityIcons name="close-circle-outline" size={18} color="#EF4444" />
                        <Text style={[styles.pendingBannerText, { color: '#EF4444' }]}>
                            Service Rejected — contact admin for more information.
                        </Text>
                    </View>
                )}

                {/* ── Hero card: images + name + price + badges ── */}
                <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.imageWrap, { backgroundColor: colors.backgroundSecondary }]}>
                        {serviceImages.length > 0 ? (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.imageScrollContent}
                            >
                                {serviceImages.map((uri, i) => (
                                    <Image
                                        key={`${uri}-${i}`}
                                        source={{ uri }}
                                        style={styles.galleryImage}
                                        resizeMode="cover"
                                    />
                                ))}
                            </ScrollView>
                        ) : (
                            <MaterialCommunityIcons name="wrench-outline" size={48} color={colors.textMuted} />
                        )}
                    </View>

                    <View style={styles.heroInfo}>
                        <Text style={[styles.serviceName, { color: colors.textPrimary }]}>{service.name}</Text>
                        <Text style={[styles.servicePrice, { color: colors.pink }]}>
                            {Number(service.price).toLocaleString('en-EG')} EGP
                        </Text>

                        <View style={styles.badgeRow}>
                            <View style={[styles.badge, { backgroundColor: statusInfo.backgroundColor }]}>
                                <Text style={[styles.badgeText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                            </View>
                            {locationInfo && (
                                <View style={[styles.badge, { backgroundColor: locationInfo.bg }]}>
                                    <Text style={[styles.badgeText, { color: locationInfo.fg }]}>{locationInfo.label}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* ── Info card ── */}
                <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Category</Text>
                        <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                            {service.category_name || 'Uncategorized'}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Duration</Text>
                        <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{service.duration} min</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Service ID</Text>
                        <Text style={[styles.infoValue, { color: colors.textPrimary }]}>#{service.service_id}</Text>
                    </View>
                </View>

                {/* ── Available times ── */}
                {service.available_times && service.available_times.length > 0 && (
                    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Available Times</Text>
                        <View style={styles.timePillsRow}>
                            {service.available_times.map((t, i) => (
                                <View
                                    key={i}
                                    style={[styles.timePill, { backgroundColor: 'rgba(205,66,168,0.12)', borderColor: colors.pink }]}
                                >
                                    <MaterialCommunityIcons name="clock-outline" size={13} color={colors.pink} />
                                    <Text style={[styles.timePillText, { color: colors.pink }]}>{t}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* ── Description ── */}
                <View style={[styles.descriptionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Description</Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        {service.description || 'No description provided for this service.'}
                    </Text>
                </View>

                {/* ── Actions ── */}
                <View style={styles.actions}>
                    {/* Edit */}
                    <Pressable
                        onPress={() => router.push({ pathname: '/edit-service/[id]', params: { id: String(service.service_id) } })}
                        disabled={saving}
                        style={({ pressed }) => [
                            styles.editAction,
                            { borderColor: colors.pink, opacity: pressed || saving ? 0.85 : 1 },
                        ]}
                    >
                        <MaterialCommunityIcons name="square-edit-outline" size={20} color={colors.pink} />
                        <Text style={[styles.editActionText, { color: colors.pink }]}>Edit service</Text>
                    </Pressable>

                    {/* Enable / Disable — disabled while pending */}
                    <Pressable
                        onPress={isPending ? undefined : handleToggleStatus}
                        disabled={saving || isPending}
                        style={({ pressed }) => [
                            styles.primaryAction,
                            {
                                backgroundColor: isPending
                                    ? colors.backgroundSecondary
                                    : isEnabled ? colors.backgroundSecondary : colors.pink,
                                borderColor: isPending ? colors.border : colors.pink,
                                opacity: pressed || saving || isPending ? 0.6 : 1,
                            },
                        ]}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color={isEnabled ? colors.pink : '#fff'} />
                        ) : (
                            <>
                                <MaterialCommunityIcons
                                    name={isPending ? 'clock-outline' : isEnabled ? 'pause-circle-outline' : 'play-circle-outline'}
                                    size={20}
                                    color={isPending ? colors.textMuted : isEnabled ? colors.pink : '#fff'}
                                />
                                <Text style={[styles.primaryActionText, {
                                    color: isPending ? colors.textMuted : isEnabled ? colors.pink : '#fff',
                                }]}>
                                    {isPending ? 'Awaiting approval' : isEnabled ? 'Disable service' : 'Enable service'}
                                </Text>
                            </>
                        )}
                    </Pressable>

                    {/* Delete */}
                    <Pressable
                        onPress={handleDelete}
                        disabled={saving}
                        style={({ pressed }) => [
                            styles.deleteAction,
                            { borderColor: '#EF4444', opacity: pressed || saving ? 0.85 : 1 },
                        ]}
                    >
                        <MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />
                        <Text style={styles.deleteActionText}>Delete service</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerIconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerIconSpacer: { width: 44, height: 44 },
    headerTitle: { fontFamily: Fonts.semiBold, fontSize: FontSizes.lg },
    content: { paddingHorizontal: Spacing.md, paddingBottom: 120, gap: Spacing.md },

    // Hero
    heroCard: { borderWidth: 1, borderRadius: BorderRadius.xl, overflow: 'hidden' },
    imageWrap: { height: 240, alignItems: 'center', justifyContent: 'center' },
    imageScrollContent: { paddingHorizontal: Spacing.md, alignItems: 'center', gap: Spacing.sm },
    galleryImage: { width: 240, height: 200, borderRadius: BorderRadius.md },
    heroInfo: { padding: Spacing.md, gap: Spacing.xs },
    serviceName: { fontFamily: Fonts.bold, fontSize: FontSizes.xl },
    servicePrice: { fontFamily: Fonts.bold, fontSize: FontSizes.lg },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
    badge: { paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: BorderRadius.full },
    badgeText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.xs },

    // Info
    infoCard: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.md, gap: Spacing.md },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.md },
    infoLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },
    infoValue: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm, textAlign: 'right', flexShrink: 1 },
    sectionTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: Spacing.xs },

    // Times
    timePillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    timePill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderWidth: 1, borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.sm, paddingVertical: 5,
    },
    timePillText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.xs },

    // Description
    descriptionCard: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.md },
    description: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, lineHeight: 22 },

    // Actions
    actions: { gap: Spacing.sm, marginTop: Spacing.xs },
    primaryAction: {
        minHeight: 52, borderRadius: BorderRadius.full, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.md,
    },
    primaryActionText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md },
    editAction: {
        minHeight: 52, borderRadius: BorderRadius.full, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.md,
    },
    editActionText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md },
    deleteAction: {
        minHeight: 52, borderRadius: BorderRadius.full, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.md,
    },
    deleteActionText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md, color: '#EF4444' },

    // Pending / rejected banner
    pendingBanner: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.35)', borderRadius: BorderRadius.md,
        padding: Spacing.sm, marginBottom: Spacing.sm,
    },
    pendingBannerText: {
        fontFamily: Fonts.medium, fontSize: FontSizes.xs,
        color: '#F59E0B', flex: 1,
    },
    rejectedBanner: {
        backgroundColor: 'rgba(239,68,68,0.12)',
        borderColor: 'rgba(239,68,68,0.35)',
    },
});
