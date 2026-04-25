import { useCallback, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable, Switch,
    Image, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { providerService } from '@/services/api/provider.service';
import { Service } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import { GradientButton } from '@/components';

export default function ProviderServiceDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { showToast } = useToast();

    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    const loadService = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await providerService.getServiceById(Number(id));
            if (res.success && res.data) setService(res.data);
        } catch (err: any) {
            showToast('error', 'Error', 'Failed to load service.');
        } finally {
            setLoading(false);
        }
    }, [id, showToast]);

    useFocusEffect(useCallback(() => { loadService(); }, [loadService]));

    const handleToggle = async () => {
        if (!service) return;
        setToggling(true);
        try {
            const res = await providerService.toggleServiceActive(service.service_id);
            if (res.success && res.data) {
                setService(res.data);
                showToast('success', 'Updated', `Service is now ${res.data.is_active ? 'enabled' : 'disabled'}.`);
            }
        } catch {
            showToast('error', 'Error', 'Could not toggle service status.');
        } finally {
            setToggling(false);
        }
    };

    const handleDelete = () => {
        Alert.alert('Delete Service', 'Are you sure you want to delete this service?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try {
                        await providerService.deleteService(Number(id));
                        showToast('success', 'Deleted', 'Service has been deleted.');
                        router.back();
                    } catch {
                        showToast('error', 'Error', 'Could not delete service.');
                    }
                },
            },
        ]);
    };

    const photos = service
        ? [service.image_url, service.image_url_2, service.image_url_3].filter(Boolean) as string[]
        : [];

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Service Details</Text>
                <Pressable onPress={handleDelete}>
                    <MaterialCommunityIcons name="trash-can-outline" size={22} color="#EF4444" />
                </Pressable>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.pink} />
                </View>
            ) : !service ? (
                <View style={styles.centered}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>Service not found.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Photos */}
                    {photos.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                            {photos.map((uri, i) => (
                                <Image key={i} source={{ uri }} style={styles.photo} resizeMode="cover" />
                            ))}
                        </ScrollView>
                    )}

                    {/* Name + Badge */}
                    <View style={styles.titleRow}>
                        <Text style={[styles.serviceName, { color: colors.textPrimary }]}>{service.name}</Text>
                        <View style={[
                            styles.badge,
                            { backgroundColor: service.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }
                        ]}>
                            <Text style={[
                                styles.badgeText,
                                { color: service.is_active ? '#10B981' : '#EF4444' }
                            ]}>
                                {service.is_active ? 'Enabled' : 'Disabled'}
                            </Text>
                        </View>
                    </View>

                    {/* Details card */}
                    <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <DetailRow icon="tag-outline" label="Category" value={service.category_name || '—'} colors={colors} />
                        <DetailRow icon="clock-outline" label="Duration" value={`${service.duration} min`} colors={colors} />
                        <DetailRow icon="cash" label="Price" value={`${Number(service.price).toLocaleString('en-EG')} EGP`} colors={colors} pink />
                        {service.location_type && (
                            <DetailRow icon="map-marker-outline" label="Location" value={service.location_type} colors={colors} />
                        )}
                    </View>

                    {/* Description */}
                    {service.description ? (
                        <View style={[styles.descCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.descLabel, { color: colors.textMuted }]}>Description</Text>
                            <Text style={[styles.descText, { color: colors.textPrimary }]}>{service.description}</Text>
                        </View>
                    ) : null}

                    {/* Available times */}
                    {service.available_times && service.available_times.length > 0 && (
                        <View style={[styles.timesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.descLabel, { color: colors.textMuted }]}>Available Times</Text>
                            <View style={styles.timePills}>
                                {service.available_times.map((t, i) => (
                                    <View key={i} style={[styles.timePill, { backgroundColor: colors.pinkGlow, borderColor: colors.pink }]}>
                                        <Text style={[styles.timePillText, { color: colors.pink }]}>{t}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Toggle status */}
                    <View style={[styles.toggleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
                                {service.is_active ? 'Service is Active' : 'Service is Inactive'}
                            </Text>
                            <Text style={[styles.toggleSub, { color: colors.textMuted }]}>
                                Toggle to {service.is_active ? 'disable' : 'enable'} this service
                            </Text>
                        </View>
                        {toggling ? (
                            <ActivityIndicator color={colors.pink} />
                        ) : (
                            <Switch
                                value={service.is_active}
                                onValueChange={handleToggle}
                                trackColor={{ true: colors.pink, false: colors.border }}
                                thumbColor="#fff"
                            />
                        )}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

function DetailRow({ icon, label, value, colors, pink }: {
    icon: any; label: string; value: string; colors: any; pink?: boolean;
}) {
    return (
        <View style={styles.detailRow}>
            <MaterialCommunityIcons name={icon} size={18} color={colors.textMuted} />
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
            <Text style={[styles.detailValue, { color: pink ? colors.pink : colors.textPrimary }]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    },
    headerTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.lg },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontFamily: Fonts.medium, fontSize: FontSizes.md },
    scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: 120 },
    photoScroll: { marginBottom: Spacing.md },
    photo: {
        width: 200, height: 130, borderRadius: BorderRadius.lg,
        marginRight: Spacing.sm,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
    serviceName: { fontFamily: Fonts.bold, fontSize: FontSizes.xl, flex: 1 },
    badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: BorderRadius.full },
    badgeText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.xs, textTransform: 'capitalize' },
    detailsCard: { borderRadius: BorderRadius.xl, borderWidth: 1, overflow: 'hidden', marginBottom: Spacing.md },
    detailRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        paddingHorizontal: Spacing.md, paddingVertical: 12,
        borderBottomWidth: 0.5,
    },
    detailLabel: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, flex: 1 },
    detailValue: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
    descCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md },
    descLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    descText: { fontFamily: Fonts.regular, fontSize: FontSizes.md, lineHeight: 22 },
    timesCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md },
    timePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
    timePill: { borderRadius: BorderRadius.full, borderWidth: 1, paddingHorizontal: Spacing.sm, paddingVertical: 5 },
    timePillText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },
    toggleCard: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.md, gap: Spacing.md,
    },
    toggleLabel: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md, marginBottom: 2 },
    toggleSub: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
});
