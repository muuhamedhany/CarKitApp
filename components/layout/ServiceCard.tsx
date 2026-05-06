import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, FontSizes, Spacing, BorderRadius, Shadows, Colors } from '@/constants/theme';

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
  const { colors, isDark } = useTheme();
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(!!imageUrl);
  
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  const showImage = !!imageUrl && !imgError;

  return (
    <Animated.View style={[styles.animatedWrapper, animatedStyle]}>
      <Pressable 
        style={[
          styles.card, 
          { 
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,1)', 
            borderColor: colors.cardBorder 
          },
          Shadows.md
        ]}
        onPress={onView}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Image banner */}
        <View style={[styles.imageBanner, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F5F5F7' }]}>
          {showImage ? (
            <>
              <Image
                source={{ uri: imageUrl! }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                onLoad={() => setImgLoading(false)}
                onError={() => { setImgError(true); setImgLoading(false); }}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 0, y: 1 }}
              />
              {imgLoading && (
                <ActivityIndicator size="small" color={colors.pink} style={styles.loader} />
              )}
            </>
          ) : (
            <LinearGradient
              colors={isDark ? ['#1A0B2E', '#2D1B4E'] : ['#F8F0FF', '#EBE0FF']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
               <View style={styles.placeholderInner}>
                <MaterialCommunityIcons name="car-wash" size={44} color={colors.pink + '40'} />
               </View>
            </LinearGradient>
          )}

          {/* Price badge overlaid on image */}
          <View style={[styles.priceBadge, { backgroundColor: colors.pink }]}>
            <Text style={styles.priceBadgeText}>{typeof price === 'number' ? price.toLocaleString() : price} EGP</Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
                {name}
              </Text>
              {providerName && (
                <Text style={[styles.provider, { color: colors.textSecondary }]} numberOfLines={1}>
                  {providerName}
                </Text>
              )}
            </View>
            {rating !== undefined && (
              <View style={[styles.ratingBadge, { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)' }]}>
                <MaterialCommunityIcons name="star" size={14} color="#FBBF24" />
                <Text style={[styles.ratingText, { color: '#FBBF24' }]}>{rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            {duration !== undefined && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{duration} min</Text>
              </View>
            )}
            {reviewCount !== undefined && reviewCount > 0 && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="comment-text-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{reviewCount} reviews</Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            {onBookNow && (
              <Pressable 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onBookNow();
                }} 
                style={({ pressed }) => [
                  styles.bookButton, 
                  { 
                    backgroundColor: colors.pink,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }]
                  }
                ]}
              >
                <Text style={styles.bookButtonText}>Book Now</Text>
              </Pressable>
            )}
            {onView && (
              <Pressable 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onView();
                }} 
                style={({ pressed }) => [
                  styles.viewButton, 
                  { 
                    borderColor: colors.cardBorder, 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }]
                  }
                ]}
              >
                <Text style={[styles.viewButtonText, { color: colors.textPrimary }]}>Details</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedWrapper: {
    marginBottom: Spacing.md,
    paddingHorizontal: 2,
  },
  card: {
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageBanner: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  loader: {
    ...StyleSheet.absoluteFillObject as any,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderInner: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  priceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  priceBadgeText: {
    fontFamily: Fonts.extraBold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  body: { padding: Spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  name: { fontFamily: Fonts.extraBold, fontSize: FontSizes.md + 2, letterSpacing: -0.5 },
  provider: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, opacity: 0.6, marginTop: 1 },
  ratingBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  ratingText: { fontFamily: Fonts.bold, fontSize: 12, marginLeft: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: Spacing.xl },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontFamily: Fonts.bold, fontSize: 12, opacity: 0.7 },
  actions: { flexDirection: 'row', gap: 12 },
  bookButton: {
    borderRadius: BorderRadius.xl, 
    flex: 2,
    paddingVertical: 14, 
    alignItems: 'center',
    ...Shadows.sm,
    shadowColor: Colors.pink,
  },
  bookButtonText: { fontFamily: Fonts.extraBold, fontSize: FontSizes.sm, color: '#FFFFFF' },
  viewButton: {
    flex: 1, 
    paddingVertical: 14, 
    alignItems: 'center',
    borderRadius: BorderRadius.xl, 
    borderWidth: 1,
  },
  viewButtonText: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },
});

