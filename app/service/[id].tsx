import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, Pressable,
  ActivityIndicator, FlatList, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 340;

type ServiceDetail = {
  service_id: number;
  name: string;
  description: string;
  price: string;
  duration: number;
  category_name: string;
  provider_name: string;
  provider_id_fk?: number;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  location_type?: 'both' | 'mobile' | 'in-shop';
  available_times?: string[];
};

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetchService();
  }, [id]);

  const fetchService = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`${API_URL}/services/${id}`, { headers });
      const data = await response.json();
      if (data.success) {
        setService(data.data);
      } else {
        showToast('error', 'Error', 'Service not found');
        router.back();
      }
    } catch {
      showToast('error', 'Error', 'Failed to fetch service details.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!service) return;
    router.push({
      pathname: '/booking-confirmation',
      params: {
        serviceId: String(service.service_id),
        serviceName: service.name,
        price: String(service.price),
        duration: String(service.duration),
        providerId: service.provider_id_fk ? String(service.provider_id_fk) : '',
        providerName: service.provider_name || '',
        availableTimes: JSON.stringify(service.available_times || []),
      },
    } as any);
  };

  const handleImagePress = (images: string[], index: number) => {
    router.push({
      pathname: '/image-viewer',
      params: {
        images: JSON.stringify(images),
        initialIndex: String(index),
      },
    } as any);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.pink} />
      </View>
    );
  }

  if (!service) return null;

  const images: string[] = [];
  if (service.image_url) images.push(service.image_url);
  if (service.image_url_2) images.push(service.image_url_2);
  if (service.image_url_3) images.push(service.image_url_3);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Floating Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color="#FFFFFF" />
        </Pressable>
        <Pressable onPress={() => { }} style={styles.iconBtn}>
          <MaterialCommunityIcons name="share-variant" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
          {images.length > 0 ? (
            <FlatList
              data={images}
              keyExtractor={(_, i) => i.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={({ viewableItems }) => {
                if (viewableItems.length > 0) {
                  setActiveImageIndex(viewableItems[0].index || 0);
                }
              }}
              viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              renderItem={({ item, index }) => (
                <Pressable
                  onPress={() => handleImagePress(images, index)}
                  style={styles.imageWrapper}
                >
                  <Image source={{ uri: item }} style={styles.image} resizeMode="cover" />
                </Pressable>
              )}
            />
          ) : (
            <View style={[styles.imageWrapper, styles.center]}>
              <MaterialCommunityIcons name="car-wash" size={80} color="rgba(255,255,255,0.3)" />
            </View>
          )}
        </View>

        {/* Pagination Dots */}
        {images.length > 1 && (
          <View style={styles.pagination}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === activeImageIndex
                    ? [styles.dotActive, { backgroundColor: colors.pink }]
                    : { backgroundColor: colors.textMuted },
                ]}
              />
            ))}
          </View>
        )}

        {/* Content Section */}
        <View style={styles.content}>
          <Text style={[styles.serviceName, { color: colors.textPrimary }]}>{service.name}</Text>
          {service.provider_name && (
            <Text style={[styles.providerLine, { color: colors.textSecondary }]}>
              By {service.provider_name}
            </Text>
          )}

          {/* Badges */}
          <View style={styles.badgesRow}>
            {service.category_name && (
              <View style={[styles.badge, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="tag-outline" size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{service.category_name}</Text>
              </View>
            )}
            {service.duration && (
              <View style={[styles.badge, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="clock-outline" size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{service.duration} min</Text>
              </View>
            )}
            {service.location_type && (
              <View style={[styles.badge, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons
                  name={service.location_type === 'mobile' ? 'car' : service.location_type === 'in-shop' ? 'store' : 'map-marker'}
                  size={13}
                  color={colors.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                  {service.location_type === 'mobile' ? 'Mobile' : service.location_type === 'in-shop' ? 'In-Shop' : 'Both'}
                </Text>
              </View>
            )}
          </View>

          {/* Description Card */}
          <View style={[styles.descriptionCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Description</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {service.description || 'No description available for this service.'}
            </Text>
          </View>

          {/* Available Times (if any) */}
          {service.available_times && service.available_times.length > 0 && (
            <View style={styles.timesCard}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Available Times</Text>
              <View style={styles.timesRow}>
                {service.available_times.map((time, i) => (
                  <View key={i} style={[styles.timeChip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.timeChipText, { color: colors.textPrimary }]}>{time}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Sticky Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.sm, backgroundColor: colors.background, borderTopColor: colors.dividerLine }]}>
        <View style={styles.priceBlock}>
          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Starting at</Text>
          <Text style={[styles.priceValue, { color: colors.textPrimary }]}>{service.price} EGP</Text>
        </View>
        <Pressable onPress={handleBookNow} style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionBtn}
          >
            <Text style={styles.actionBtnText}>Book Now</Text>
            <MaterialCommunityIcons name="calendar-check" size={20} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, zIndex: 10,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  galleryContainer: {
    width: SCREEN_WIDTH - 40, height: IMAGE_HEIGHT,
    borderRadius: BorderRadius.xl, overflow: 'hidden',
    marginBottom: Spacing.xl, marginTop: 105, marginHorizontal: 20,
  },
  imageWrapper: { width: SCREEN_WIDTH - 40, height: IMAGE_HEIGHT },
  image: { width: SCREEN_WIDTH - 40, height: IMAGE_HEIGHT, borderRadius: BorderRadius.xl },
  pagination: {
    flexDirection: 'row', bottom: Spacing.md, alignSelf: 'center',
    left: 0, right: 0, justifyContent: 'center',
  },
  dot: { height: 8, width: 8, borderRadius: 4, marginHorizontal: 3 },
  dotActive: { width: 24, borderRadius: 4 },
  content: { paddingHorizontal: Spacing.lg },
  serviceName: { fontFamily: Fonts.bold, fontSize: FontSizes.xxl, color: '#FFFFFF' },
  providerLine: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginBottom: Spacing.md },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.lg },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BorderRadius.full, borderWidth: 1, marginRight: Spacing.sm,
  },
  badgeText: { fontFamily: Fonts.medium, fontSize: FontSizes.xs },
  descriptionCard: { borderRadius: 20, borderWidth: 1, padding: Spacing.md },
  sectionTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: Spacing.sm },
  description: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, lineHeight: 22 },
  timesCard: { marginTop: Spacing.lg },
  timesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  timeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1 },
  timeChipText: { fontFamily: Fonts.medium, fontSize: FontSizes.xs },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, gap: Spacing.md,
  },
  priceBlock: { justifyContent: 'center' },
  priceLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.xs },
  priceValue: { fontFamily: Fonts.extraBold, fontSize: FontSizes.lg },
  actionBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    height: 54, borderRadius: BorderRadius.full, gap: Spacing.sm,
  },
  actionBtnText: { fontFamily: Fonts.bold, fontSize: FontSizes.md, color: '#FFFFFF' },
});
