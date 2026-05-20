import { BorderRadius, Fonts, FontSizes, Shadows, Spacing } from '@/constants/theme';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

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
  const { t } = useTranslation();
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
            backgroundColor: colors.card,
            borderColor: colors.cardBorder
          },
          Shadows.md
        ]}
        onPress={onView}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Image banner */}
        <View style={[styles.imageBanner, { backgroundColor: colors.imagePlaceholder, borderBottomColor: colors.dividerLine }]}>
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
                <ActivityIndicator size="small" color={colors.pink} style={[styles.loader, { backgroundColor: colors.overlay }]} />
              )}
            </>
          ) : (
            <LinearGradient
              colors={isDark ? [colors.backgroundSecondary, colors.background] : [colors.surfaceMuted, colors.accentSoft]}
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
            <Text style={styles.priceBadgeText}>{typeof price === 'number' ? price.toLocaleString() : price} {t('service.card.currency')}</Text>
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
            {rating !== undefined && rating !== null && (
              <View style={[styles.ratingBadge, { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)' }]}>
                <MaterialCommunityIcons name="star" size={14} color="#FBBF24" />
                <Text style={[styles.ratingText, { color: '#FBBF24' }]}>{Number(rating).toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            {duration !== undefined && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{duration} {t('service.card.minute')}</Text>
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
                <Text style={styles.bookButtonText}>{t('service.card.bookNow')}</Text>
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
                    backgroundColor: colors.surfaceMuted,
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }]
                  }
                ]}
              >
                <Text style={[styles.viewButtonText, { color: colors.textPrimary }]}>{t('service.card.details')}</Text>
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
    paddingHorizontal: 2,
  },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    ...Platform.select({
      ios: { overflow: 'hidden' as const },
      android: { overflow: 'hidden' as const, elevation: 0 },
    }),
  },
  imageBanner: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomWidth: 1,
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
    ...Shadows.lg,
  },
  priceBadgeText: {
    fontFamily: Fonts.extraBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  body: { padding: Spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  name: { fontFamily: Fonts.bold, fontSize: FontSizes.md + 2 },
  provider: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, opacity: 0.5, marginTop: 3 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  ratingText: { fontFamily: Fonts.bold, fontSize: 12, marginLeft: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: Spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontFamily: Fonts.bold, fontSize: 12, opacity: 0.6 },
  actions: { flexDirection: 'row', gap: 12 },
  bookButton: {
    borderRadius: BorderRadius.xl,
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    ...Shadows.md,
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

