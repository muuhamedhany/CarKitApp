import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, FontSizes, Spacing } from '@/constants/theme';

type ServiceCardProps = {
  name: string;
  providerName?: string;
  price: string | number;
  imageUrl?: string | null;
  duration?: number;
  rating?: number;
  reviewCount?: number;
  onBookNow?: () => void;
  onView?: () => void;
};

export default function ServiceCard({
  name,
  providerName,
  price,
  imageUrl,
  duration,
  rating,
  reviewCount,
  onBookNow,
  onView,
}: ServiceCardProps) {
  const { colors } = useTheme();
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(!!imageUrl);

  const showImage = !!imageUrl && !imgError;

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
      {/* Image banner */}
      <View style={[styles.imageBanner, { backgroundColor: colors.imagePlaceholder }]}>
        {showImage ? (
          <>
            <Image
              source={{ uri: imageUrl! }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              onLoad={() => setImgLoading(false)}
              onError={() => { setImgError(true); setImgLoading(false); }}
            />
            {/* Gradient scrim so text stays readable over photo */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.45)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0.4 }}
              end={{ x: 0, y: 1 }}
            />
            {imgLoading && (
              <ActivityIndicator size="small" color={colors.pink} />
            )}
          </>
        ) : (
          <View style={styles.placeholderInner}>
            <MaterialCommunityIcons name="car-wash" size={36} color={colors.textMuted} />
          </View>
        )}

        {/* Price badge overlaid on image */}
        <View style={[styles.priceBadge, { backgroundColor: colors.pink }]}>
          <Text style={styles.priceBadgeText}>{price} EGP</Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {name}
        </Text>
        {providerName && (
          <Text style={[styles.provider, { color: colors.textMuted }]} numberOfLines={1}>
            {providerName}
          </Text>
        )}

        <View style={styles.metaRow}>
          {rating !== undefined && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="star" size={13} color="#FBBF24" />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {rating.toFixed(1)}{reviewCount ? ` (${reviewCount})` : ''}
              </Text>
            </View>
          )}
          {duration !== undefined && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{duration} min</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          {onBookNow && (
            <Pressable onPress={onBookNow} style={[styles.bookButton, { backgroundColor: colors.pink }]}>
              <Text style={styles.bookButtonText}>Book Now</Text>
            </Pressable>
          )}
          {onView && (
            <Pressable onPress={onView} style={[styles.viewButton, { borderColor: colors.cardBorder }]}>
              <Text style={[styles.viewButtonText, { color: colors.textPrimary }]}>Details</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  imageBanner: {
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholderInner: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  priceBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xs,
    color: '#FFFFFF',
  },
  body: { padding: Spacing.md },
  name: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: 2 },
  provider: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: Fonts.medium, fontSize: FontSizes.xs },
  actions: { flexDirection: 'row', gap: 8 },
  bookButton: {
    borderRadius: 12, flex: 1,
    paddingVertical: 10, alignItems: 'center',
  },
  bookButtonText: { fontFamily: Fonts.bold, fontSize: FontSizes.sm, color: '#FFFFFF' },
  viewButton: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: 12, borderWidth: 1,
  },
  viewButtonText: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },
});
